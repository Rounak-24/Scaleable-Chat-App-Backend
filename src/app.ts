import express from "express"
import cors from "cors"
import type { Express, Request, Response } from "express"
import { authRouter } from "./routes/auth.routes.js"
import { userRouter } from "./routes/user.routes.js"

export const app:Express = express()

export const corsOptions = {
    origin:process.env.CORS_ORIGIN || "*",
    credentials:true
}

const logRequest = (req: Request, res: Response, next:Function)=>{
    console.log(`Time:${new Date(Date.now())} ,Request made to ${req.url}`)
    next()
}

app.use(logRequest)
app.use(express.json())
app.use(cors(corsOptions))

app.use("/api/v1/auth",authRouter)
app.use("/api/v1/user",userRouter)