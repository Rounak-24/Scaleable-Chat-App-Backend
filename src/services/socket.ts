import { Server } from "socket.io";
import { publishMessage, sendMessages, subscribeMessage } from "./pub-sub.services.js"
import { setupSocketAuth } from "../services/auth.services.js"

export interface IMsgPayload {
    messageText: string
    receiverId: string
    senderId: string
    conversationId: string
}

export class SocketService{
    private _io:Server

    constructor(){
        console.log(`Init Socket Server......`)
        this._io = new Server()

        setupSocketAuth(this._io)
        subscribeMessage()
    }

    public async initListeners() {
        const io = this._io

        io.on("connect", (socket)=>{
            const user = socket.data.user?.email
            console.log(`new socket connected: ${socket.id}, email:${user}`)

            const userId = socket.data.user.id
            socket.join(userId)

            socket.on("join:conversation", async (data)=>{
                socket.join(data?.conversationId)
                console.log(`User ${user} joined in room: ${data?.conversationId}`)
            })

            socket.on("event:direct_message", async (payload:IMsgPayload)=>{
                const { messageText } = payload
                console.log(`New message recieved: ${messageText}`)

                payload.senderId = userId
                await publishMessage(payload)
                await sendMessages(io, socket, "MESSAGES", payload)
            })
        })
    }

    get io(){
        return this._io
    }
}