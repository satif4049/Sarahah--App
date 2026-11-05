import { Router } from "express";
import * as messageServices from "./message.service.js"
import { multerUpload } from "../../Middlewares/multer.middleware.js";
import {  NotFoundException } from "../../Utils/Security/ErrorException/error.exception.js";
import { magicNumberMiddleware } from "../../Middlewares/magic-number.middleware.js";
import { validationMiddleWare } from "../../Middlewares/zod-validation.middleware.js";
import { messageSchema} from "./message.validation.js"
import { authenticate } from "../../Middlewares/authentication.middleware.js";
const messageController = Router()


messageController.post(
  "/send",
  multerUpload({ desiredPath: "messageFiles" }).single("messageFile"),
  magicNumberMiddleware,
  async (req, res) => {
    const { content, receiverId } = req.body;
    const file = req.file;

    if (!content && !file) {
      throw NotFoundException("message content or file are required");
    }

    const result = await messageServices.sendMessage({
      content,
      file,
      receiverId,
    });

    res.status(201).json({ Message: "Message Send Successfuly", result });
  },
  
  
  
  messageController.get("/getMessagesByRecieverId" ,authenticate,async (req ,res) => {
     const result = await messageServices.getMessagesByRecieverId(
       req.authUser._id,
     );
     
    res.json({ Message: "Messages get Successfuly", result });
  }))





















export default messageController