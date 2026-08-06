import mongoose from "mongoose";
import video from "./Modals/video.js";

const clearDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/yourtube");
    await video.deleteMany({});
    console.log("Database cleared");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
clearDB();
