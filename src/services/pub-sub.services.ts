import { type Socket, type Server } from "socket.io"
import { pub,sub } from "../config/redis.js"
import type { IMsgPayload } from "./socket.js"
import { produceMessage } from "./kafka.services.js"

export const publishMessage = async (payload:IMsgPayload)=>{
    try{
        await pub.publish("MESSAGES",JSON.stringify({
            payload:payload
        }))

        console.log(`Message-data published to Redis, data:${payload}, Time: ${new Date(Date.now())}`)

    }catch(err){
        console.log(`Error occured for publishing messages to Redis`,err)
    }
}

export const subscribeMessage = async ()=>{
    try{
        await sub.subscribe("MESSAGES")

        // console.log("message subscribed")
    }catch(err){
        console.log(`Error occured for subscribing messages to Redis`,err)
    }
}

export const sendMessages = async (io:Server, socket:Socket, channel:string, payload:IMsgPayload)=>{
    try{
        const {messageText, receiverId, conversationId} = payload
        const { id } = socket.data.user?.id

        sub.on("message",async ()=>{
            switch(channel){
                case "MESSAGES":
                    io.to(receiverId).emit("receive:message", {messageText, conversationId})
                    socket.to(id).emit("receive:message", {messageText, conversationId})

                    await produceMessage(payload)
            }
        })

        console.log("message sent")

    }catch(err){
        console.log(`Error occured for sending messages to client`,err)
    }
}

