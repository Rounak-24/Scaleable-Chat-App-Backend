import { prisma } from "../config/prisma.js"

enum convType {
    DIRECT = "DIRECT",
    GROUP = "GROUP"
}

export const startConv = async (to:string, from:string, type:convType)=>{
    const createConv = await prisma.conversation.create({
        data:{
            type: type,
        },
        select:{
            id:true
        }
    })

    const addParticipants = await prisma.conversation.update({
        where:{id:createConv.id},
        data:{
            participants:{
                create:[
                    {
                        userId:to,
                    },
                    {
                        userId:from
                    }
                ]
            }
        }
    })

    console.log(addParticipants)
    return createConv.id as string
}

export const getConvs = async (userId:string)=>{
    const convs = await prisma.conversation.findMany({
        where:{
            participants:{
                
            }
        }
    })
}