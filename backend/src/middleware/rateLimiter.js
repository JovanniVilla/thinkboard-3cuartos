import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = new Redis(process.env.REDIS_URI || "redis://localhost:6379");

const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 300, // Límite razonable para peticiones concurrentes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Excluir streaming de videos (los reproductores de video realizan múltiples peticiones HTTP Range)
    const url = req.originalUrl || req.url || "";
    return url.includes("/stream") || url.startsWith("/uploads");
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  message: {
    message: "Too many requests, please try again later",
  },
});

export default rateLimiter;
