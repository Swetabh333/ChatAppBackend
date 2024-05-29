import mongoose, { Schema, Document } from "mongoose";
import User from "./User";

interface Message extends Document {
  data: string;
  url?: string;
  sender: Schema.Types.ObjectId;
  receiver: Schema.Types.ObjectId;
	timestamp:Date;
}

const messageSchema = new Schema<Message>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: User,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: User,
    },
    data: {
      type: String,
    },
    url: {
      type: String,
    },
		timestamp:{
			type:Date,
		}
  },
  { timestamps: true },
);

export default mongoose.model("message", messageSchema);
