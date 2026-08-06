import mongoose from "mongoose";
const commentschema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    commentbody: { type: String },
    usercommented: { type: String },
    commentedon: { type: Date, default: Date.now },
    location: { type: String },
    likes: [{ type: String }],
    dislikes: [{ type: String }],
    reports: [{ type: String }],
    isFlagged: { type: Boolean, default: false }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("comment", commentschema);
