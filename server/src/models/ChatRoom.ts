import { Schema, model, Types } from "mongoose";

const MessageSchema = new Schema(
  {
    sender: { type: Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const ChatRoomSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: "Product", required: true, index: true },
    buyer: { type: Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: Types.ObjectId, ref: "User", required: true, index: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

// 같은 상품에 대해 같은 구매자-판매자 조합은 하나의 채팅방만 존재
ChatRoomSchema.index({ product: 1, buyer: 1, seller: 1 }, { unique: true });

export default model("ChatRoom", ChatRoomSchema);