import { Router } from "express";
import { z } from "zod";
import Product from "../models/Product";
import Notification from "../models/Alarm";
import { readUserFromReq } from "../utils/authToken";

const router = Router();

/** 등록 */
router.post("/", async (req, res) => {
  const user = readUserFromReq(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });

  const Body = z.object({
    title: z.string().min(1),
    description: z.string().optional().default(""),
    price: z.number().nonnegative(),
    category: z.string().optional().default("기타"),
    location: z.string().optional().default("미정"),
    images: z.array(z.string().url()).optional().default([]),
  });

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.message });
  }

  const doc = await Product.create({ ...parsed.data, seller: user.id });
  return res.status(201).json({ ok: true, product: doc });
});

/** 목록 (최신순) */
router.get("/", async (_req, res) => {
  const list = await Product.find().sort({ createdAt: -1 }).limit(200);
  return res.json({ ok: true, products: list });
});

/** 단건 조회 */
router.get("/:id", async (req, res) => {
  const user = readUserFromReq(req);
  const item = await Product.findById(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: "not_found" });
  
  // 현재 사용자의 좋아요 여부 추가
  const isLiked = user ? item.likes.some(id => id.toString() === user.id) : false;
  
  return res.json({ 
    ok: true, 
    product: { ...item.toObject(), isLiked } 
  });
});

/** 수정 */
router.put("/:id", async (req, res) => {
  const user = readUserFromReq(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });

  const item = await Product.findById(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: "not_found" });
  
  // 권한 확인: 게시자만 수정 가능
  if (item.seller.toString() !== user.id) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const Body = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().nonnegative().optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    images: z.array(z.string().url()).optional(),
    status: z.enum(["selling", "reserved", "sold"]).optional(),
  });

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.message });
  }

  // 가격 변동 확인
  const priceChanged = parsed.data.price && parsed.data.price !== item.price;
  const oldPrice = item.price;
  
  // 상태 변동 확인
  const statusChanged = parsed.data.status && parsed.data.status !== item.status;
  const oldStatus = item.status;

  // 업데이트
  Object.assign(item, parsed.data);
  await item.save();

  // 좋아요 누른 사용자들에게 알림 생성
  if (priceChanged || statusChanged) {
    const notifications = [];
    
    for (const userId of item.likes) {
      if (userId.toString() === user.id) continue; // 본인 제외
      
      if (priceChanged) {
        notifications.push({
          user: userId,
          type: "price",
          title: item.title,
          message: `가격이 ${oldPrice.toLocaleString()}원에서 ${item.price.toLocaleString()}원으로 변경되었습니다.`,
          productId: item._id,
        });
      }
      
      if (statusChanged) {
        const statusText = {
          selling: "판매중",
          reserved: "예약중",
          sold: "판매완료",
        };
        notifications.push({
          user: userId,
          type: "status",
          title: item.title,
          message: `판매 상태가 ${statusText[oldStatus]}에서 ${statusText[item.status]}(으)로 변경되었습니다.`,
          productId: item._id,
        });
      }
    }
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  }

  return res.json({ ok: true, product: item });
});

/** 삭제 */
router.delete("/:id", async (req, res) => {
  const user = readUserFromReq(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });

  const item = await Product.findById(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: "not_found" });
  
  // 권한 확인: 게시자만 삭제 가능
  if (item.seller.toString() !== user.id) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  await item.deleteOne();
  return res.json({ ok: true });
});

/** 좋아요 토글 */
router.post("/:id/like", async (req, res) => {
  const user = readUserFromReq(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });

  const item = await Product.findById(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: "not_found" });

  const userId = user.id;
  const likeIndex = item.likes.findIndex(id => id.toString() === userId);

  if (likeIndex >= 0) {
    // 이미 좋아요 -> 취소
    item.likes.splice(likeIndex, 1);
  } else {
    // 좋아요 추가
    item.likes.push(userId as any);
  }

  await item.save();

  return res.json({ 
    ok: true, 
    isLiked: likeIndex < 0,
    likesCount: item.likes.length 
  });
});

export default router;