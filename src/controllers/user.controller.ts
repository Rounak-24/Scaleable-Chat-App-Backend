import { asyncHandler } from "../utils/asyncHandler"
import { type Request, type Response } from "express"
import { searchUserbyEmail } from "../services/user.services.js"
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";


export const searchUser = asyncHandler(async (req:Request, res:Response)=>{
    const {email} = req.body
    if(!email) throw new ApiError(400,"email can't be empty")

    const user = await searchUserbyEmail(email)
    return res.status(200).json(
        new ApiResponse(200,user)   
    )
})