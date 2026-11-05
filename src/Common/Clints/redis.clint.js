import { createClient } from "redis";
import { redisConfig } from "../../Configs/redis.config.js";

export const redisClient = createClient(redisConfig);
console.log(redisConfig);

export const redisConnection = async () => {
  try {
    await redisClient.connect();
    console.log("redis connection successfully");
  } catch (error) {
    console.log("redis connection faild", error);
  }
};
