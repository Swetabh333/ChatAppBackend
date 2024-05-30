import express, { Express } from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import connect from "../db/db";
import authroute from "../routes/authroute";
import userRouter from "../routes/userroute";
import messageRouter from "../routes/messageRoute";
import cookieParser from "cookie-parser";
import ws, { WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User";
import Messages from "../models/Messages";

dotenv.config();

const app: Express = express();

app.use(express.json());

const port = process.env.PORT || 5000;

const corsOptions: CorsOptions = {
  credentials: true,
  origin: "*",
  methods: "GET,POST,PUT,PATCH,DELETE",
  allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept",
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.options("*", cors(corsOptions));

connect();

app.use("/auth", authroute);

app.use("/getusers", userRouter);

app.use("/messages", messageRouter);

const server = app.listen(port, async () => {
  console.log(process.env.FRONTEND_URL);
  console.log("App listening on port " + port);
});

const wss = new ws.WebSocketServer({ server });

interface customWS extends WebSocket {
  user?: string;
  id?: string;
  isAlive?: boolean;
}

wss.on("connection", async (ws: customWS, req) => {
  const notifyOnline = () => {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          usersOnline: [...wss.clients].map((c: customWS) => ({
            userId: c.id,
            username: c.user,
          })),
        }),
      );
    });
  };
  ws.isAlive = true;
  let timeout: ReturnType<typeof setTimeout>;
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
      .find((elem: string) => elem.startsWith("token="));
    if (cookies && process.env.JWT_SECRET) {
      const token = cookies.split("=")[1];
      const { id } = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      const post = await User.findById(id);
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
      const msg = await Messages.create({
        data: data,
        sender: sender,
        receiver: receiver,
        timestamp: timestamp,
      });
      [...wss.clients]
        .filter((client: customWS) => {
          return client.id == receiver;
        })
        .forEach((client: customWS) => {
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
