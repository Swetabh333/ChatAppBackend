"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = __importDefault(require("../middleware/auth"));
const authRouter = (0, express_1.Router)();
authRouter.get("/verifytoken", auth_1.default, async (req, res) => {
    if (req.verify) {
        res.status(200).json({ user: req.user, id: req.id });
    }
    else {
        res.sendStatus(207);
    }
});
authRouter.post("/", async (req, res) => {
    const { username, password } = req.body;
    try {
        const find = await User_1.default.findOne({
            username,
        });
        if (find) {
            const check = await bcryptjs_1.default.compare(password, find.password);
            if (check) {
                const token = jsonwebtoken_1.default.sign({
                    id: find.id,
                }, process.env.JWT_SECRET);
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
            }
            else {
                res.json({ msg: "The username and password do not match." });
            }
        }
        else {
            res.json({ msg: "User does not exist" });
        }
    }
    catch (err) {
        res.status(500).json({ err });
    }
});
authRouter.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const check = await User_1.default.findOne({ email });
        if (!check) {
            const salt = await bcryptjs_1.default.genSalt();
            const hashPassword = await bcryptjs_1.default.hash(password, salt);
            const user = await User_1.default.create({
                username,
                email,
                password: hashPassword,
            });
            if (user) {
                res.status(200).json({ status: "created" });
            }
            else {
                res.status(400).json({ status: "failed" });
            }
        }
        else {
            res.status(202).json({ status: "User already exists." });
        }
    }
    catch (err) {
        res.status(500).json({ err });
    }
});
exports.default = authRouter;
