import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  joinedon: { type: Date, default: Date.now },
  subscriptions: [
    {
      channelName: String,
      uploaderId: String,
      avatar: String
    }
  ],
  plan: { type: String, default: "free" },
  planExpiry: { type: Date },
  downloads: [
    {
      videoId: String,
      videoTitle: String,
      videoUrl: String,
      downloadDate: { type: Date, default: Date.now }
    }
  ],
  theme: { type: String, default: "dark" },
  trustedDevices: [{ type: String }],
  trustedLocations: [{ type: String }],
  otp: { type: String },
  otpExpiry: { type: Date }
});

export default mongoose.model("user", userschema);
