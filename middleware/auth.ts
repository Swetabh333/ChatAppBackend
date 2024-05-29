import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import jwt, { JwtPayload } from "jsonwebtoken";

interface request extends Request {
  verify?: boolean;
	user?:string;
	id?:string
}

const authMiddleware = async (
  req: request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.cookies.token && process.env.JWT_SECRET) {
      const { id } = jwt.verify(
        req.cookies.token,
        process.env.JWT_SECRET,
      ) as JwtPayload;
      const user = await User.findById(id);
      if (user) {
        req.verify = true;
				req.user = user.username;
				req.id  = user._id;
      } else {
        req.verify = false;
      }
    } else {
      req.verify = false;
    }
  } catch (err) {
    console.log(err);
    req.verify = false;
  }

  next();
};

export default authMiddleware;
