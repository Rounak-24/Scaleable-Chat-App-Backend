let socket; 
let activeConversationId = null;
let activeReceiverId = null; 
let jwtToken = ""; 
let myUserId = null;
let historyLoadGeneration = 0;
let historyFetchInFlight = null;
const conversationsMeta = new Map();
const messageStore = new Map();
const renderedMessageIds = new Set();

const tokenInput = document.getElementById("tokenInput");
const connectBtn = document.getElementById("connectBtn");
const authError = document.getElementById("authError");
const statusDiv = document.getElementById("status");

const appLayout = document.getElementById("app-layout");
const searchEmail = document.getElementById("searchEmail");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
const conversationsList = document.getElementById("conversationsList");

const currentChatHeader = document.getElementById("currentChatHeader");
const messagesList = document.getElementById("messagesList");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

connectBtn.addEventListener("click", () => {
    connectBtn.disabled = true
    jwtToken = tokenInput.value.trim();
    if (!jwtToken) return showError("Please enter a token first!");

    const decodedToken = decodeJwt(jwtToken);
    myUserId = decodedToken
        ? normalizeId(decodedToken.id || decodedToken.userId || decodedToken.sub || decodedToken._id)
        : null;

    authError.style.display = "none";
    statusDiv.innerText = "Status: 🟡 Connecting...";

    if (socket) socket.disconnect();

    socket = io("http://localhost:3000", {
        auth: { token: jwtToken }
    });

    setupSocketListeners();

    setTimeout(()=>{
        connectBtn.disabled = false,
        connectBtn.innerText = "connect"
    }, 1000*2)
});

function normalizeId(value) {
    return value == null ? "" : String(value);
}

function getMessageText(data) {
    return data.messageText || data.content || data.text || "";
}

function getSenderType(data) {
    const senderId = normalizeId(data.senderId || data.sender_id || data.sender?.id);
    if (!senderId) return "other";
    return senderId === normalizeId(myUserId) ? "self" : "other";
}

function getConversationId(data) {
    return normalizeId(data.conversationId || data.conversation_id);
}

function getStoredMessages(convId) {
    const key = normalizeId(convId);
    if (!messageStore.has(key)) {
        messageStore.set(key, []);
    }
    return messageStore.get(key);
}

function messageAlreadyStored(convId, id) {
    if (!id) return false;
    return getStoredMessages(convId).some((msg) => msg.id === id);
}

function isContentAlreadyInStore(convId, text, senderType) {
    const store = getStoredMessages(convId);
    if (store.some((msg) => msg.text === text && msg.senderType === senderType)) {
        return true;
    }
    if (senderType === "other" && store.some((msg) => msg.text === text && msg.senderType === "self")) {
        return true;
    }
    return false;
}

function getSortedMessages(convId) {
    return [...getStoredMessages(convId)].sort((a, b) => {
        const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
        const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
        return timeA - timeB;
    });
}

function removeMatchingTempMessage(convId, text, senderType) {
    const store = getStoredMessages(convId);
    const tempIndex = store.findIndex(
        (msg) =>
            String(msg.id).startsWith("temp-") &&
            msg.text === text &&
            msg.senderType === senderType
    );
    if (tempIndex >= 0) store.splice(tempIndex, 1);
}

function addMessageToStore(convId, text, senderType, id = null, options = {}) {
    const normalizedConvId = normalizeId(convId);
    if (!text) return false;

    if (messageAlreadyStored(normalizedConvId, id)) {
        return false;
    }

    if (options.fromSocket && isContentAlreadyInStore(normalizedConvId, text, senderType)) {
        return false;
    }

    if (id && !String(id).startsWith("temp-")) {
        removeMatchingTempMessage(normalizedConvId, text, senderType);
    }

    const messageId = id || `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    getStoredMessages(normalizedConvId).push({
        id: messageId,
        text,
        senderType,
        sentAt: options.sentAt || new Date().toISOString()
    });
    return true;
}

function appendChatMessage(convId, text, senderType, id = null, options = {}) {
    if (!addMessageToStore(convId, text, senderType, id, options)) return false;

    if (normalizeId(convId) !== normalizeId(activeConversationId)) return true;

    renderConversationMessages(convId);
    return true;
}

function joinConversationRoom(convId) {
    if (!socket?.connected || !convId) return;
    socket.emit("join:conversation", { conversationId: normalizeId(convId) });
}

function renderConversationMessages(convId) {
    const normalizedConvId = normalizeId(convId);
    if (normalizedConvId !== normalizeId(activeConversationId)) return;

    messagesList.innerHTML = "";
    renderedMessageIds.clear();

    getSortedMessages(normalizedConvId).forEach((msg) => {
        appendMessageToUI(msg.text, msg.senderType, msg.id);
    });
}

function handleIncomingSocketMessage(data) {
    const convId = getConversationId(data);
    const text = getMessageText(data);
    if (!convId || !text) return;

    const messageId = data.id || data.messageId || null;
    const senderType = getSenderType(data);

    if (senderType === "self") return;
    if (isContentAlreadyInStore(convId, text, senderType)) return;

    console.log("Socket message received:", data);

    appendChatMessage(convId, text, senderType, messageId, {
        fromSocket: true,
        sentAt: new Date().toISOString()
    });
}

function setupSocketListeners() {
    socket.off("connect");
    socket.off("connect_error");
    socket.off("disconnect");
    socket.off("receive:message");

    socket.on("connect", () => {
        const decodedToken = decodeJwt(jwtToken);
        const email = decodedToken?.email || "unknown";
        statusDiv.innerText = `Status: 🟢 Connected securely (ID: ${socket.id}), User: ${email}`;
        appLayout.classList.add("active");

        fetchExistingConversations();
    });

    socket.on("connect_error", (err) => {
        statusDiv.innerText = `Status: 🔴 Connection Rejected`;
        showError(`Auth Error: ${err.message}`);
        appLayout.classList.remove("active");
    });

    socket.on("disconnect", () => {
        statusDiv.innerText = `Status: 🔴 Disconnected`;
        appLayout.classList.remove("active");
    });

    socket.on("receive:message", handleIncomingSocketMessage);
}

async function fetchExistingConversations() {
    try {
        const res = await fetch("http://localhost:3000/api/v1/conversations/get", {
            method: "GET",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error("Failed to load conversations");
        
        const convs = data.data || [];
        conversationsList.innerHTML = ""; 

        convs.forEach(conv => {
            const convId = conv.id || conv._id || conv.convId;
            const receiverId = conv.participants?.[0]?.user?.id || conv.receiverId || null;
            const participant = conv.participants?.[0]?.user?.fullname;
            const displayName = conv.name || participant || "Conversation";

            conversationsMeta.set(normalizeId(convId), {
                receiverId: normalizeId(receiverId),
                displayName
            });

            addConversationToSidebar(convId, displayName, normalizeId(receiverId), false);
        });

    } catch (err) {
        console.error(err);
    }
}

async function fetchMessageHistory(convId) {
    const normalizedConvId = normalizeId(convId);
    if (!normalizedConvId) return;

    if (historyFetchInFlight === normalizedConvId) return;

    const loadId = ++historyLoadGeneration;
    historyFetchInFlight = normalizedConvId;

    try {
        messagesList.innerHTML = `<li style="text-align: center; color: #888;">Loading messages...</li>`;

        const res = await fetch(`http://localhost:3000/api/v1/conversations/messages/${normalizedConvId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error("Failed to load history");
        if (loadId !== historyLoadGeneration) return;
        if (normalizedConvId !== normalizeId(activeConversationId)) return;

        // 1. Keep track of pending unconfirmed temporary messages
        const pendingTemps = getStoredMessages(normalizedConvId).filter((msg) =>
            String(msg.id).startsWith("temp-")
        );

        // 2. Clear store to populate with fresh API history
        messageStore.set(normalizedConvId, []);

        const msgs = [...(data.data?.[0]?.messages || [])].sort((a, b) => {
            return new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime();
        });

        // 3. Process the API history
        msgs.forEach((msg) => {
            const text = msg.messageText || msg.content;
            if (!text) return;

            const senderId = msg.senderId || msg.sender_id || msg.sender?.id;
            const senderType = normalizeId(senderId) === normalizeId(myUserId) ? "self" : "other";

            addMessageToStore(normalizedConvId, text, senderType, msg.id, { sentAt: msg.sentAt });

            // Consume a matching pending temp message
            const matchIndex = pendingTemps.findIndex(t => t.text === text && t.senderType === senderType);
            if (matchIndex >= 0) pendingTemps.splice(matchIndex, 1);
        });

        // 4. Restore any remaining temporary messages not yet in API
        const store = getStoredMessages(normalizedConvId);
        pendingTemps.forEach(t => store.push(t));

        renderConversationMessages(normalizedConvId);

    } catch (err) {
        if (loadId !== historyLoadGeneration) return;
        messagesList.innerHTML = `<li style="text-align: center; color: red;">Error loading history</li>`;
        console.error(err);
    } finally {
        if (historyFetchInFlight === normalizedConvId) {
            historyFetchInFlight = null;
        }
    }
}

function selectConversation(normalizedConvId, displayEmail, normalizedReceiverId) {
    const isAlreadyActive = normalizedConvId === activeConversationId;

    document.querySelectorAll(".conv-item").forEach((el) => el.classList.remove("active"));
    const item = document.getElementById(`conv-${normalizedConvId}`);
    if (item) item.classList.add("active");

    activeConversationId = normalizedConvId;
    activeReceiverId = normalizedReceiverId || conversationsMeta.get(normalizedConvId)?.receiverId || null;

    currentChatHeader.innerText = `Chatting with ${displayEmail}`;
    messageInput.disabled = false;
    sendBtn.disabled = false;

    joinConversationRoom(normalizedConvId);

    if (!isAlreadyActive) {
        fetchMessageHistory(normalizedConvId);
    }
}

searchBtn.addEventListener("click", async () => {
    const email = searchEmail.value.trim();
    if (!email) return alert("Please enter an email");

    try {
        searchBtn.innerText = "...";
        searchBtn.disabled = true;
        searchResults.innerHTML = ""; 

        const response = await fetch(`http://localhost:3000/api/v1/user/search`, {
            method: "POST", 
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ email: email }) 
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "User not found");
        
        const userId = data.data.id || data._id || data.receiver_id; 
        const userEmail = data.data.email || email;
        const username = data.data.fullname || userEmail;

        searchResults.innerHTML = `
            <div class="search-result-item">
                <span>${username}</span>
                <button id="initiateChatBtn">Start Chat</button>
            </div>
        `;

        document.getElementById("initiateChatBtn").addEventListener("click", () => {
            initiateConversation(userId, username); 
        });

    } catch (err) {
        searchResults.innerHTML = `<span style="color:red; font-size:12px;">${err.message}</span>`;
    } finally {
        searchBtn.innerText = "Search";
        searchBtn.disabled = false;
    }
});

async function initiateConversation(receiverId, receiverEmail) {
    const btn = document.getElementById("initiateChatBtn");
    btn.innerText = "Starting...";
    btn.disabled = true;

    try {
        const response = await fetch("http://localhost:3000/api/v1/conversations/init", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ 
                receiverId: receiverId,
                convType: "DIRECT"
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to start chat");

        const conversation_id = data.data?.convId || data.data?.existedConv?.id;
        conversationsMeta.set(normalizeId(conversation_id), {
            receiverId: normalizeId(receiverId),
            displayName: receiverEmail
        });

        // autoClick=true only for newly initiated chats — intentional UX.
        addConversationToSidebar(conversation_id, receiverEmail, normalizeId(receiverId), true);
        
        searchResults.innerHTML = "";
        searchEmail.value = "";

    } catch (err) {
        alert(err.message);
        btn.innerText = "Start Chat";
        btn.disabled = false;
    }
}

function addConversationToSidebar(convId, displayEmail, receiverId, autoClick = false) {
    const normalizedConvId = normalizeId(convId);
    const normalizedReceiverId = normalizeId(
        receiverId || conversationsMeta.get(normalizedConvId)?.receiverId || null
    ) || null;

    conversationsMeta.set(normalizedConvId, {
        receiverId: normalizedReceiverId,
        displayName: displayEmail
    });

    const existing = document.getElementById(`conv-${normalizedConvId}`);
    if (existing) {
        if (autoClick) selectConversation(normalizedConvId, displayEmail, normalizedReceiverId);
        return;
    }

    const li = document.createElement("li");
    li.className = "conv-item";
    li.id = `conv-${normalizedConvId}`;
    li.innerText = displayEmail;
    
    li.addEventListener("click", () => {
        selectConversation(normalizedConvId, displayEmail, normalizedReceiverId);
    });

    conversationsList.prepend(li);
    if (autoClick) selectConversation(normalizedConvId, displayEmail, normalizedReceiverId);
}

sendBtn.addEventListener("click", () => {
    if (!activeConversationId || !socket?.connected) return;

    const text = messageInput.value.trim();
    if (!text) return;

    const meta = conversationsMeta.get(normalizeId(activeConversationId));
    const receiverId = normalizeId(activeReceiverId || meta?.receiverId);
    if (!receiverId) {
        alert("Cannot send: receiver not found for this conversation.");
        return;
    }

    const payload = {
        conversationId: normalizeId(activeConversationId),
        receiverId,
        messageText: text,
        senderId: myUserId
    };

    socket.emit("event:direct_message", payload);
    appendChatMessage(activeConversationId, text, "self", null, {
        sentAt: new Date().toISOString()
    });
    messageInput.value = "";
});

messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
});

function appendMessageToUI(text, senderType, messageId = null) {
    if (messageId && renderedMessageIds.has(messageId)) return;
    if (messageId) renderedMessageIds.add(messageId);

    const li = document.createElement("li");
    li.className = `msg-item ${senderType}`;
    li.dataset.text = text;
    if (messageId) li.dataset.messageId = messageId;
    li.innerText = text;
    messagesList.appendChild(li);
    messagesList.scrollTop = messagesList.scrollHeight;
}

function showError(msg) {
    authError.innerText = msg;
    authError.style.display = "block";
}