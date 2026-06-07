import { type Server } from "socket.io"
import { pub,sub } from "../config/redis.js"
import type { IMsgPayload } from "./socket.js"
import { produceMessage } from "./kafka.services.js"

export const publishMessage = async (payload:IMsgPayload)=>{
    try{
        await pub.publish("MESSAGES",JSON.stringify(payload))

        console.log(`Message-data published to Redis, data:${JSON.stringify(payload)}, Time: ${new Date(Date.now())}`)

    }catch(err){
        console.log(`Error occured for publishing messages to Redis`,err)
    }
}


export const initRedisSubscriber = async (io:Server)=>{
    try{
        await sub.subscribe("MESSAGES")
        console.log("✅ Subscribed to Redis MESSAGES channel")

        sub.on("message",async (channel:string, message:string)=>{
            const msgPayload:IMsgPayload = JSON.parse(message)
            const {messageText, conversationId, senderId } = msgPayload
            console.log("message recieved in redisSubscriber",msgPayload)

            switch(channel){
                case "MESSAGES":
                    io.to(conversationId).emit("receive:message", {
                        messageText, 
                        conversationId,
                        senderId: senderId
                    })
                    // socket.to(id).emit("receive:message", {
                    //     messageText, 
                    //     conversationId,
                    //     senderId: id
                    // })

                    await produceMessage(msgPayload)
                    console.log("message sent from redis subscriber")
            }
        })

    }catch(err){
        console.log(`Error occured in initRedisSubscriber`,err)
    }
}
