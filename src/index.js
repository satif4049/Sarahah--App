import "./Configs/env.config.js"
import express from "express";
import dpConnection from "./DB/dp.connection.js";
import authController from "./Modules/Auth/auth.controller.js";
import userController from "./Modules/User/user.controller.js";
import globalErrorHandler from "./Middlewares/golobal-error-handler-middleware.js";
import  cors from "cors"
import { redisConnection } from "./Common/Clints/redis.clint.js";
import helmet from "helmet";
import { createRateLimiter } from "./Middlewares/rate-limit.middleware.js";
import messageController from "./Modules/Message/message.controller.js";
const port = process.env.PORT || 3000;
const app = express();
await dpConnection();
await redisConnection();
app.use(
  cors({
    origin: "http://localhost:4200",
  }),
  helmet(),
  createRateLimiter(),
  express.json(),
);



app.use("/api/auth", authController);
app.use("/api/user", userController);
app.use("/api/messages" , messageController);


app.use("/uplouds" , express.static("uplouds"))
app.get("/", (req, res) => {
  res.json({ Message: "hello in server" });
});


app.use((req, res) => {
  res.status(404).json({ Message: "Invalid EndPoint" });
});

app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`Server Run On Port ${port}`);
});
