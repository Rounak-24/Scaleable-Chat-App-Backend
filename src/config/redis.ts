import Redis from "ioredis"

export const pub = new Redis(
    process.env.PUB_REDIS_URL || "redis://127.0.0.1:6379"
)

export const sub = new Redis(
    process.env.SUB_REDIS_URL || "redis://127.0.0.1:6379"
)

