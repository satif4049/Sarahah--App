import MessageRepository from "../../DB/Repositories/message.repository.js";
import UserRepository from "../../DB/Repositories/user.repository.js";
import { ApplicationException } from "../../Utils/Security/ErrorException/error.exception.js";

const messageRepo = new MessageRepository();
const userRepo = new UserRepository();

export const sendMessage = async ({ content, file, receiverId }) => {
  
  const user = await userRepo.findDocumentByID(receiverId);
  if (!user) {
    ApplicationException({ message: "receiver not found" });
  }
  return await messageRepo.creatDocument({
    content,
    file: file?.path,
    receiverId,
  });
};

export const getMessagesByRecieverId = async (receiverId) => {
  const message = await messageRepo.findDocument({ receiverId });
  if (!message) {
    ApplicationException({ message: "receiver not found" });
  }
  return message;
};