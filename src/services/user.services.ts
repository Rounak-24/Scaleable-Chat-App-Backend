import { prisma } from "../config/prisma.js"
import { ApiError } from "../utils/ApiError.js";

export const searchUserbyEmail = async (email:string)=>{
    const user = await prisma.user.findUnique({
        where:{email:email},
        select:{
            id:true,
            fullname:true,
            email:true,
            bio:true
        }
    })

    if(!user) throw new ApiError(404,"User not found")
    return user
}