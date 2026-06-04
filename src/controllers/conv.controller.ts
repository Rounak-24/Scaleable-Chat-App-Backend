import { asyncHandler } from "../utils/asyncHandler"
import { type Request, type Response } from "express"
import { startConv } from "../services/conv.services.js"
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";


export const startConvHandler = asyncHandler(async (req:Request, res:Response)=>{
    const {convType, to } = req.body
    const currentUserId = req.user.id
    if(!convType || !to) throw new ApiError(400,"convType and user_id is required")
    
    const newConvId = await startConv(to,currentUserId,convType)
    if(!newConvId) throw new ApiError(500,"Something went wrong while sstarting conv")

    return res.status(200).json(
        new ApiResponse(200,{newConvId:newConvId},"new conv started")
    )
})