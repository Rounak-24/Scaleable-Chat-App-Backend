import type { NextFunction, Request, Response } from "express"
import { ApiError } from "../utils/ApiError.js"
import { prisma } from '../config/prisma.js'
import jwt, { type Secret } from "jsonwebtoken"

interface IJWTPayload {
    id:string
    email:string
    phone: string
}

export const jwtAuthMiddleware = async (req:Request, res:Response, next:NextFunction)=>{
    try{    
        const auth = req.headers.authorization || req.cookies?.accessToken
        if(!auth) throw new ApiError(401,"Unauthorized Request")

        const token:string = auth.split(' ')[1]
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY as Secret) as IJWTPayload

        const User = await prisma.user.findUnique({
            where: {id: decoded.id},
            select:{
                id:true,
                fullname:true,
                email:true,
                emailVeriified:true
            }
        })

        if(!User) throw new ApiError(404,"User not found!")
        else req.user = User

        next()

    }catch(err){
        console.log(`Error in jwt middleware, Error: ${err}`)
        res.status(400).json(
            new ApiError(400,"Invalid Token",err as [])
        )
    }
}

