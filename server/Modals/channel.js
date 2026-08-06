import mongoose from "mongoose";

const channelschema = mongoose.Schema({
  channelname: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  avatar: { type: String },
  joinedon: { type: Date, default: Date.now },
  plan: { type: String, default: "free" },
  downloads: [
    {
      videoId: String,
      videoTitle: String,
      videoUrl: String,
      downloadDate: { type: Date, default: Date.now }
    }
  ]
});

export default mongoose.models.channel || mongoose.model("channel", channelschema);
