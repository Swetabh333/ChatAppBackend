"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const Messages_1 = __importDefault(require("../models/Messages"));
const router = (0, express_1.Router)();
router.post("/", auth_1.default, async (req, res) => {
    const { id, selectedUser } = req.body;
    try {
        const msgs = await Messages_1.default.find({
            sender: { $in: [id, selectedUser] },
            receiver: { $in: [selectedUser, id] },
        }).sort({ createdAt: 1 });
        res.json({ msgs });
    }
    catch (err) {
        res.json({ data: "Messages not found" });
    }
});
exports.default = router;
