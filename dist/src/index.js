"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("../db/db"));
const authroute_1 = __importDefault(require("../routes/authroute"));
const userroute_1 = __importDefault(require("../routes/userroute"));
const messageRoute_1 = __importDefault(require("../routes/messageRoute"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const ws_1 = __importDefault(require("ws"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Messages_1 = __importDefault(require("../models/Messages"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const port = process.env.PORT || 5000;
const corsOptions = {
    credentials: true,
    origin: process.env.FRONTEND_URL,
    methods: "GET,POST,PUT,PATCH,DELETE",
    allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept",
};
app.use((0, cors_1.default)(corsOptions));
app.use((0, cookie_parser_1.default)());
app.options("*", (0, cors_1.default)(corsOptions));
(0, db_1.default)();
app.use("/auth", authroute_1.default);
app.use("/getusers", userroute_1.default);
app.use("/messages", messageRoute_1.default);
const server = app.listen(port, async () => {
    console.log(process.env.FRONTEND_URL);
    console.log("App listening on port " + port);
});
const wss = new ws_1.default.WebSocketServer({ server });
wss.on("connection", async (ws, req) => {
    const notifyOnline = () => {
        [...wss.clients].forEach((client) => {
            client.send(JSON.stringify({
                usersOnline: [...wss.clients].map((c) => ({
                    userId: c.id,
                    username: c.user,
                })),
            }));
        });
    };
    ws.isAlive = true;
    let timeout;
    setInterval(() => {
        ws.ping();
        timeout = setTimeout(() => {
            ws.isAlive = false;
            ws.close();
            notifyOnline();
        });
    }, 10000);
    ws.on("pong", () => {
        clearTimeout(timeout);
    });
    if (req.headers.cookie) {
        const cookies = req.headers.cookie
            .split(";")
            .find((elem) => elem.startsWith("token="));
        if (cookies && process.env.JWT_SECRET) {
            const token = cookies.split("=")[1];
            const { id } = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const post = await User_1.default.findById(id);
            if (post) {
                ws.user = post.username;
                ws.id = post._id;
            }
        }
    }
    ws.on("message", async (str) => {
        const msgToStore = JSON.parse(str.toString());
        const { data, sender, receiver, timestamp } = msgToStore;
        if (sender && receiver) {
            const msg = await Messages_1.default.create({
                data: data,
                sender: sender,
                receiver: receiver,
                timestamp: timestamp,
            });
            [...wss.clients]
                .filter((client) => {
                return client.id == receiver;
            })
                .forEach((client) => {
                const msgToBeSent = JSON.stringify({
                    data: msg.data,
                    sender: ws.id,
                    receiver: receiver,
                    timestamp: msg.timestamp,
                });
                client.send(msgToBeSent);
            });
        }
    });
    notifyOnline();
});
