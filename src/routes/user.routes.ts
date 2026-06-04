import { Router } from "express"
import { jwtAuthMiddleware } from "../middlewares/jwt.middleware.js"
import {
    searchUser
} from "../controllers/user.controller.js"


export const userRouter = Router()

userRouter.post('/search', jwtAuthMiddleware, searchUser)