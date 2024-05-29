"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = async (req, res, next) => {
    try {
        if (req.cookies.token && process.env.JWT_SECRET) {
            const { id } = jsonwebtoken_1.default.verify(req.cookies.token, process.env.JWT_SECRET);
            const user = await User_1.default.findById(id);
            if (user) {
                req.verify = true;
                req.user = user.username;
                req.id = user._id;
            }
            else {
                req.verify = false;
            }
        }
        else {
            req.verify = false;
        }
    }
    catch (err) {
        console.log(err);
        req.verify = false;
    }
    next();
};
exports.default = authMiddleware;
