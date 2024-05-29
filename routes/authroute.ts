import { Router, Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth";

interface request extends Request {
  verify?: boolean;
  user?: string;
  id?: string;
}

const authRouter: Router = Router();

authRouter.get(
  "/verifytoken",
  authMiddleware,
  async (req: request, res: Response) => {
    if (req.verify) {
      res.status(200).json({ user: req.user, id: req.id });
    } else {
      res.sendStatus(207);
    }
  },
);

authRouter.post("/", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const find = await User.findOne({
      username,
    });
    if (find) {
      const check = await bcrypt.compare(password, find.password as string);
      if (check) {
        const token = jwt.sign(
          {
            id: find.id,
          },
          process.env.JWT_SECRET as string,
        );
        const expiration = 24 * 60 * 60 * 1000;
        res
          .status(200)
          .cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: expiration,
          })
          .json({ id: find.id });
      } else {
        res.json({ msg: "The username and password do not match." });
      }
    } else {
      res.json({ msg: "User does not exist" });
    }
  } catch (err) {
    res.status(500).json({ err });
  }
});

authRouter.post("/register", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  try {
    const check = await User.findOne({ email });
    if (!check) {
      const salt = await bcrypt.genSalt();
      const hashPassword = await bcrypt.hash(password, salt);
      const user = await User.create({
        username,
        email,
        password: hashPassword,
      });
      if (user) {
        res.status(200).json({ status: "created" });
      } else {
        res.status(400).json({ status: "failed" });
      }
    } else {
      res.status(202).json({ status: "User already exists." });
    }
  } catch (err) {
    res.status(500).json({ err });
  }
});

export default authRouter;
