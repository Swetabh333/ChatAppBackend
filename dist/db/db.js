"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connect = async () => {
    try {
        if (process.env.mongo_URI) {
            await mongoose_1.default.connect(process.env.mongo_URI);
            console.log("connected");
        }
    }
    catch (err) {
        console.log(err);
    }
};
exports.default = connect;
