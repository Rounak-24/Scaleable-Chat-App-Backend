import { prisma } from "../config/prisma.js"

enum convType {
    DIRECT = "DIRECT",
    GROUP = "GROUP"
}

export const findDirectConv = async (user1:string, user2:string)=>{
    const data = await prisma.conversation.findMany({
        where:{
            type:"DIRECT",
            AND:[
                {
                    participants:{
                        some:{ userId:user1 }
                    }
                },
                {
                    participants:{
                        some:{ userId: user2}
                    }
                }
            ]
        },

        include:{
            messages:{
                select:{
                    id: true,
                    content: true,
                    sentAt: true,
                    sender:{
                        select:{
                            id: true,
                            fullname: true,
                            email: true
                        }
                    }
                }
            }
        }
    })

    return data
}

export const startConv = async (receiverId:string, from:string, type:convType)=>{
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
                        userId:receiverId,
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

export const getAllConvs = async (userId:string)=>{
    const data = await prisma.conversation.findMany({
        where:{
            participants:{
                some:{ userId: userId }
            }
        },
        
        include:{
            messages:{
                select:{
                    id: true,
                    content: true,
                    sentAt: true,
                    sender:{
                        select:{
                            id: true,
                            fullname: true,
                            email: true
                        }
                    }
                }
            }
        }
    })

    return data
}