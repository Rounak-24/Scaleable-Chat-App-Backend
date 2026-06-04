import { asyncHandler } from "../utils/asyncHandler.js";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/prisma.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { hashPassword, comparePassword, generateTokens } from "../services/auth.services.js";


const cookieOptions = {
    httpOnly: true,
    secure: true,
}


export const registerUser = asyncHandler(async (req:Request, res:Response)=>{
    const {name, email, password} = req.body
    if(!email || !password || !name){
        throw new ApiError(400,"User credentials are required")
    }
    
    const findUser = await prisma.user.findUnique({
        where:{ email:email }
    })
    
    if(findUser) throw new ApiError(400,"User already exists")

    const passwordHash = await hashPassword(password as string)

    const createUser = await prisma.user.create({
        data:{
            fullname:name,
            email:email,
            password:passwordHash
        },

        select: {
            fullname : true,
            email: true,
            id : true
        }
    })

    if(!createUser){
        throw new ApiError(500,"Something went wrong while creating user")
    }

    const { accessToken, refreshToken } = generateTokens(
        createUser.id,
        createUser.fullname,
        createUser.email
    )

    await prisma.user.update({
        where: { id:createUser.id },
        data:{
            refreshToken: refreshToken
        }
    })

    return res.status(200)
    .cookie("accessToken",accessToken,cookieOptions)
    .cookie("refreshToken",refreshToken,cookieOptions)
    .json(
        new ApiResponse(200,{
            user: createUser,
            accessToken : accessToken
        },"User registered successfully")
    )
})


export const loginUser = asyncHandler(async (req:Request, res:Response)=>{
    const {email, password} = req.body
    if(!email || !password){
        throw new ApiError(400,'email and password both are required')
    }

    const findUser = await prisma.user.findUnique({
        where: { email:email },
        select: {
            id:true,
            fullname:true,
            email:true,
            password:true,
        }
    })

    if(!findUser){
        throw new ApiError(404,"User not found")
    }

    if(!comparePassword(password, findUser.password)){
        throw new ApiResponse(401,null,`Incorrect password`)
    }

    const tokenObj = generateTokens(
        findUser.id,
        findUser.fullname,
        findUser.email
    )

    await prisma.user.update({
        where: {id: findUser.id},
        data:{
            refreshToken:tokenObj.refreshToken
        }
    })
    
    return res.status(200)
    .cookie("accessToken",tokenObj.accessToken,cookieOptions)
    .cookie("refreshToken",tokenObj.refreshToken,cookieOptions)
    .json(
        new ApiResponse(200,{
            user:{
                id:findUser.id,
                name:findUser.fullname,
                email:findUser.email
            },
            accessToken:tokenObj.accessToken
        },'user logged in successfully')
    )
})