import express, { Request, Response } from "express";
import User from "../models/User";

const userRouter = express.Router();

userRouter.get("/", async (req: Request, res: Response) => {
  const users = await User.find({}, { username: 1, id: 1 });
  res.json({ users });
});

export default userRouter;
