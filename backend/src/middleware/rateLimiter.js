import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = new Redis(process.env.REDIS_URI || "redis://localhost:6379");

const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // Límite de 100 peticiones por minuto
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  message: {
    message: "Too many requests, please try again later",
  },
});

export default rateLimiter;
