import { Server } from "socket.io";
import { publishMessage, sendMessages, subscribeMessage } from "../services/message.services.js"
import { setupSocketAuth } from "../services/auth.services.js"

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
            console.log(`new socket connected: ${socket.id}`)

            socket.on("event:message", async ({message}:{message:string})=>{
                console.log(`New message recieved: ${message}`)

                await publishMessage(message)

                await sendMessages(io, "MESSAGES", message)
            })
        })
    }

    get io(){
        return this._io
    }
}