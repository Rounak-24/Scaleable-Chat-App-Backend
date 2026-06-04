import { Router } from "express"
import { jwtAuthMiddleware } from "../middlewares/jwt.middleware.js"
import {
    registerUser,
    loginUser
} from "../controllers/auth.controller.js"


export const authRouter = Router()

authRouter.post('/signup', registerUser)
authRouter.post('/login', loginUser)