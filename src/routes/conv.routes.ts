import { Router } from "express"
import { jwtAuthMiddleware } from "../middlewares/jwt.middleware.js"
import {
    startConvHandler,
    getAllConvsHandler
} from "../controllers/conv.controller.js"


export const convRouter = Router()

convRouter.post('/init', jwtAuthMiddleware, startConvHandler)
convRouter.get('/get', jwtAuthMiddleware, getAllConvsHandler)