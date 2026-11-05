import mongoose from "mongoose";
import * as zod from "zod";

export const messageSchema = zod.strictObject({
  content: zod.string(),

  receiverId: zod
    .string()
    .refine((id) => mongoose.Types.ObjectId.isValid(id), "invalid object id"),
});