import type { Server } from "socket.io";
import { pub,sub } from "../config/redis.js"

export const publishMessage = async (message:string)=>{
    try{
        await pub.publish("MESSAGES",JSON.stringify({
            message:message
        }))

        console.log(`Messsage published to Redis, msg:${message}, Time: ${new Date(Date.now())}`)

    }catch(err){
        console.log(`Error occured for publishing messages to Redis`,err)
    }
}

export const subscribeMessage = async ()=>{
    try{
        await sub.subscribe("MESSAGES")

        console.log("message subscribed")
    }catch(err){
        console.log(`Error occured for subscribing messages to Redis`,err)
    }
}

export const sendMessages = async (io:Server, channel:string, messsage:any)=>{
    try{
        sub.on("message",async ()=>{
            switch(channel){
                case "MESSAGES":
                    io.emit("message", {
                        messsage:messsage
                    })
            }
        })

        console.log("message sent")

    }catch(err){
        console.log(`Error occured for sending messages to client`,err)
    }
}

