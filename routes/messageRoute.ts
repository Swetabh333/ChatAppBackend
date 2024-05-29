import { Request, Response, Router } from "express";
import authMiddleware from "../middleware/auth";
import Messages from "../models/Messages";
import User from "../models/User";

const router: Router = Router();

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  const { id, selectedUser } = req.body;

  try {
    const msgs = await Messages.find({
      sender: { $in: [id, selectedUser] },
      receiver: { $in: [selectedUser, id] },
    }).sort({ createdAt: 1 });
    res.json({ msgs });
  } catch (err) {
    res.json({ data: "Messages not found" });
  }
});

export default router;
