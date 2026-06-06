import { prisma } from "../config/prisma.js"
import type { IMsgPayload } from "./socket";

export const saveMessage = async (payload:IMsgPayload)=>{
    const { conversationId, messageText, senderId } = payload
    if(!conversationId) throw Error("convId is required")
    
    const addMsg = await prisma.conversation.update({
        where:{id: conversationId},
        data:{
            messages:{
                create:{
                    content: messageText,
                    senderId: senderId
                }
            }
        }
    })

    console.log(`saved to DB`, addMsg)

    if(!addMsg) throw Error("Error occured while adding new message")
    return true
}