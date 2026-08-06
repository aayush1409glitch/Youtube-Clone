import comment from "../Modals/comment.js";
import mongoose from "mongoose";

export const postcomment = async (req, res) => {
  const { videoid, userid, commentbody, usercommented, location } = req.body;
  
  // Basic content filter
  const badWords = ['abuse', 'spam', 'fuck', 'shit', 'bitch', 'asshole'];
  const hasBadWords = badWords.some(word => commentbody.toLowerCase().includes(word));
  if (hasBadWords) {
    return res.status(400).json({ message: "Comment contains inappropriate language." });
  }

  // Repeated special characters filter
  if (/([!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`])\1{4,}/.test(commentbody)) {
    return res.status(400).json({ message: "Comment contains excessive special characters." });
  }

  // Spam detection: extreme repetition of identical characters or very long words without spaces
  if (/(.)\1{10,}/.test(commentbody) || /[^\s]{50,}/.test(commentbody)) {
    return res.status(400).json({ message: "Comment looks like spam." });
  }

  const postcomment = new comment({
    videoid,
    userid,
    commentbody,
    usercommented,
    location
  });

  try {
    const savedComment = await postcomment.save();
    return res.status(200).json({ comment: true, data: savedComment });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid: videoid });
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }

  // Basic content filter
  const badWords = ['abuse', 'spam', 'fuck', 'shit', 'bitch', 'asshole'];
  const hasBadWords = badWords.some(word => commentbody.toLowerCase().includes(word));
  if (hasBadWords) {
    return res.status(400).json({ message: "Comment contains inappropriate language." });
  }

  // Repeated special characters filter
  if (/([!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`])\1{4,}/.test(commentbody)) {
    return res.status(400).json({ message: "Comment contains excessive special characters." });
  }

  // Spam detection: extreme repetition of identical characters or very long words without spaces
  if (/(.)\1{10,}/.test(commentbody) || /[^\s]{50,}/.test(commentbody)) {
    return res.status(400).json({ message: "Comment looks like spam." });
  }

  try {
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody },
    }, { new: true });
    res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const likeComment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send("comment unavailable");
  try {
    const c = await comment.findById(id);
    if (!c) return res.status(404).json({ message: "Comment not found" });

    const index = c.likes.findIndex((uid) => uid === String(userId));
    if (index === -1) {
      c.likes.push(String(userId));
      // Remove from dislikes if present
      c.dislikes = c.dislikes.filter(uid => uid !== String(userId));
    } else {
      c.likes = c.likes.filter(uid => uid !== String(userId));
    }
    const updated = await c.save();
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const dislikeComment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send("comment unavailable");
  try {
    const c = await comment.findById(id);
    if (!c) return res.status(404).json({ message: "Comment not found" });

    const index = c.dislikes.findIndex((uid) => uid === String(userId));
    if (index === -1) {
      c.dislikes.push(String(userId));
      // Remove from likes if present
      c.likes = c.likes.filter(uid => uid !== String(userId));
    } else {
      c.dislikes = c.dislikes.filter(uid => uid !== String(userId));
    }
    const updated = await c.save();
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const reportComment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send("comment unavailable");
  try {
    const c = await comment.findById(id);
    if (!c) return res.status(404).json({ message: "Comment not found" });

    if (!c.reports.includes(String(userId))) {
      c.reports.push(String(userId));
    }
    // Flag for review
    c.isFlagged = true;
    const updated = await c.save();
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
