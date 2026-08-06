import mongoose from "mongoose";
import video from "./Modals/video.js";

const cleanup = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/yourtube");
    await video.deleteMany({ videotitle: { $ne: 'youtube clone using next js' } });
    console.log('Cleaned up fake videos!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
cleanup();
