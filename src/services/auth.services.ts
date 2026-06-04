import jwt, {type Secret, type SignOptions } from "jsonwebtoken"
import type { Server, Socket } from "socket.io"
import { hash, compare } from "bcrypt"

interface IJWTPayload {
    id:string
    email:string
}

export const verifyJWT = (token:string)=>{
    const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY as Secret) as IJWTPayload

    return decoded
}

export function setupSocketAuth(io: Server) {
    io.use((socket: Socket, next) => {

        const token = socket.handshake.auth?.token
        if (!token) {
            throw new Error("Authentication error: Token missing")
        }

        try {
            const decoded = verifyJWT(token)
            socket.data.user = decoded; 
            
            next(); 

        } catch (err) {
            console.log(`Invalid token error: ${err}`)
            return next(new Error("Authentication error: Invalid token"));
        }
    });
}

export const hashPassword = async (pass:string)=>{
    return await hash(pass,2)
}

export const comparePassword = async (pass:string, passwordHash:string)=>{
    return await compare(pass, passwordHash)
}

export const generateTokens = (id:string, name:string, email:string)=>{
    const accessToken = jwt.sign({
        id, email

    },process.env.JWT_SECRET_KEY as Secret, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    } as SignOptions)

    const refreshToken = jwt.sign({
        id, email, name

    },process.env.JWT_SECRET_KEY as Secret, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    } as SignOptions)

    return {accessToken, refreshToken}
}
