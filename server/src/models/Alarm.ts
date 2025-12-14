import { Schema, model, Types } from "mongoose";

const AlarmSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: { 
      type: String, 
      enum: ["chat", "price", "status"], 
      required: true,
      index: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    productId: { type: Types.ObjectId, ref: "Product", required: true },
    chatRoomId: { type: Types.ObjectId, ref: "ChatRoom" },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default model("Alarm", AlarmSchema);