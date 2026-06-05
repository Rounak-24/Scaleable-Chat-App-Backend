import { asyncHandler } from "../utils/asyncHandler"
import { type Request, type Response } from "express"
import { startConv, findDirectConv, getAllConvs } from "../services/conv.services.js"
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";


export const startConvHandler = asyncHandler(async (req:Request, res:Response)=>{
    const {convType, receiverId } = req.body
    const currentUserId = req.user.id
    if(!convType || !receiverId) throw new ApiError(400,"convType and user_id is required")

    const findConv = await findDirectConv(currentUserId,receiverId) 
    const existedConvId = findConv[0]?.id

    if(findConv) return res.status(200).json(
        new ApiResponse(200,{
            existedConv:findConv[0],
            convId:existedConvId
        },"conversation already exists!")
    )
    
    const newConvId = await startConv(receiverId,currentUserId,convType)
    if(!newConvId) throw new ApiError(500,"Something went wrong while sstarting conv")

    return res.status(200).json(
        new ApiResponse(200,{convId:newConvId},"new conv started")
    )
})

export const getAllConvsHandler = asyncHandler(async (req:Request, res:Response)=>{
    const {id} = req.user?.id

    const getConvs = await getAllConvs(id)
    if(!getConvs) return res.status(200).json({message:"no conversation found"})
    
    return res.status(200).json(
        new ApiResponse(200,getConvs,"fetched all conversationss successfully")
    )
})