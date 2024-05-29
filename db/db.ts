import mongoose from "mongoose";

const connect = async () => {
  try {
    if (process.env.mongo_URI) {
      await mongoose.connect(process.env.mongo_URI);
      console.log("connected");
    }
  } catch (err) {
    console.log(err);
  }
};

export default connect;
