// server/src/routes/alarms.ts
import { Router } from "express";
import Alarm from "../models/Alarm";
import { readUserFromReq } from "../utils/authToken";

const router = Router();

/** 알림 목록 조회 */
router.get("/", async (req, res) => {
  const user = readUserFromReq(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });

  try {
    const alarms = await Alarm.find({ user: user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    
    return res.json({ ok: true, alarms });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/** 알림 읽음 처리 */
router.post("/:id/read", async (req, res) => {
  const user = readUserFromReq(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });

  try {
    const alarm = await Alarm.findOne({
      _id: req.params.id,
      user: user.id,
    });

    if (!alarm) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    alarm.read = true;
    await alarm.save();

    return res.json({ ok: true, alarm });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

export default router;