import { Router } from "express";
import { z } from "zod";
import ChatRoom from "../models/ChatRoom";
import Product from "../models/Product";
import Alarm from "../models/Alarm";
import { readUserFromReq } from "../utils/authToken";

const router = Router();

/** 채팅방 직접 조회 (ID로) */
router.get("/:chatRoomId", async (req, res) => {
  const user = readUserFromReq(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });

  try {
    const chatRoom = await ChatRoom.findById(req.params.chatRoomId).populate(
      "product",
      "title price images"
    );

    if (!chatRoom) {
      return res.status(404).json({ ok: false, error: "chatroom_not_found" });
    }

    // 권한 확인: 구매자 또는 판매자만 조회 가능
    const userId = user.id;
    if (
      chatRoom.buyer.toString() !== userId &&
      chatRoom.seller.toString() !== userId
    ) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    return res.json({ ok: true, chatRoom });
  } catch (e) {
    console.error("채팅방 조회 실패:", e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/** 채팅방 생성 또는 조회 (상품 기준) */
router.post("/product/:productId", async (req, res) => {
  const user = readUserFromReq(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });

  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ ok: false, error: "product_not_found" });
    }

    const sellerId = product.seller.toString();
    const userId = user.id;

    // 판매자는 이 엔드포인트로 접근 불가
    if (sellerId === userId) {
      return res.status(400).json({ 
        ok: false, 
        error: "cannot_chat_with_self",
        message: "자신의 상품에는 채팅할 수 없습니다." 
      });
    }

    // 구매자인 경우: 기존 채팅방 찾기 또는 생성
    let chatRoom = await ChatRoom.findOne({
      product: req.params.productId,
      buyer: userId,
      seller: sellerId,
    }).populate("product", "title price images");

    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        product: req.params.productId,
        buyer: userId,
        seller: sellerId,
        messages: [],
      });
      chatRoom = await chatRoom.populate("product", "title price images");
    }

    return res.json({ ok: true, chatRoom });
  } catch (e) {
    console.error("채팅방 생성 실패:", e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/** 메시지 전송 */
router.post("/:chatRoomId/message", async (req, res) => {
  const user = readUserFromReq(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });

  const Body = z.object({
    content: z.string().min(1).max(1000),
  });

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.message });
  }

  try {
    const chatRoom = await ChatRoom.findById(req.params.chatRoomId).populate(
      "product",
      "title price images"
    );
    
    if (!chatRoom) {
      return res.status(404).json({ ok: false, error: "chatroom_not_found" });
    }

    // 권한 확인: 구매자 또는 판매자만 메시지 전송 가능
    const userId = user.id;
    if (
      chatRoom.buyer.toString() !== userId &&
      chatRoom.seller.toString() !== userId
    ) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    // 메시지 추가
    chatRoom.messages.push({
      sender: userId as any,
      content: parsed.data.content,
    } as any);

    await chatRoom.save();

    // 상대방에게 알림 생성
    const receiverId =
      chatRoom.buyer.toString() === userId
        ? chatRoom.seller
        : chatRoom.buyer;

    console.log("알림 생성 시도:", {
      sender: userId,
      receiver: receiverId,
      message: parsed.data.content
    });

    const alarm = await Alarm.create({
      user: receiverId,
      type: "chat",
      title: "새 메시지",
      message: parsed.data.content,
      productId: (chatRoom.product as any)._id,
      chatRoomId: chatRoom._id,
    });

    console.log("알림 생성 성공:", alarm);

    return res.json({ ok: true, chatRoom });
  } catch (e) {
    console.error("메시지 전송 실패:", e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/** 내 채팅방 목록 */
router.get("/", async (req, res) => {
  const user = readUserFromReq(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });

  try {
    const chatRooms = await ChatRoom.find({
      $or: [{ buyer: user.id }, { seller: user.id }],
    })
      .populate("product", "title price images")
      .sort({ updatedAt: -1 });

    return res.json({ ok: true, chatRooms });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

export default router;