import video from "../Modals/video.js";
import like from "../Modals/like.js";

export const handlelike = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;

  if (!userId) return res.status(400).json({ message: "User ID required" });

  try {
    const targetVideo = await video.findById(videoId);
    if (!targetVideo) return res.status(404).json({ message: "Video not found" });

    if (!targetVideo.likedBy) targetVideo.likedBy = [];
    if (!targetVideo.dislikedBy) targetVideo.dislikedBy = [];

    const isLiked = targetVideo.likedBy.includes(userId);
    const isDisliked = targetVideo.dislikedBy.includes(userId);

    let updatedLiked = false;

    if (isLiked) {
      // Remove Like
      targetVideo.likedBy = targetVideo.likedBy.filter(id => id !== userId);
      targetVideo.Like = Math.max(0, (targetVideo.Like || 1) - 1);
      await like.findOneAndDelete({ viewer: userId, videoid: videoId });
      updatedLiked = false;
    } else {
      // Add Like
      targetVideo.likedBy.push(userId);
      targetVideo.Like = (targetVideo.Like || 0) + 1;

      // Remove Dislike if present
      if (isDisliked) {
        targetVideo.dislikedBy = targetVideo.dislikedBy.filter(id => id !== userId);
        targetVideo.Dislike = Math.max(0, (targetVideo.Dislike || 1) - 1);
      }

      await like.create({ viewer: userId, videoid: videoId });
      updatedLiked = true;
    }

    await targetVideo.save();

    return res.status(200).json({
      liked: updatedLiked,
      disliked: false,
      likes: targetVideo.Like,
      dislikes: targetVideo.Dislike
    });
  } catch (error) {
    console.error("Like error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const handledislike = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;

  if (!userId) return res.status(400).json({ message: "User ID required" });

  try {
    const targetVideo = await video.findById(videoId);
    if (!targetVideo) return res.status(404).json({ message: "Video not found" });

    if (!targetVideo.likedBy) targetVideo.likedBy = [];
    if (!targetVideo.dislikedBy) targetVideo.dislikedBy = [];

    const isLiked = targetVideo.likedBy.includes(userId);
    const isDisliked = targetVideo.dislikedBy.includes(userId);

    let updatedDisliked = false;

    if (isDisliked) {
      // Remove Dislike
      targetVideo.dislikedBy = targetVideo.dislikedBy.filter(id => id !== userId);
      targetVideo.Dislike = Math.max(0, (targetVideo.Dislike || 1) - 1);
      updatedDisliked = false;
    } else {
      // Add Dislike
      targetVideo.dislikedBy.push(userId);
      targetVideo.Dislike = (targetVideo.Dislike || 0) + 1;

      // Remove Like if present
      if (isLiked) {
        targetVideo.likedBy = targetVideo.likedBy.filter(id => id !== userId);
        targetVideo.Like = Math.max(0, (targetVideo.Like || 1) - 1);
        await like.findOneAndDelete({ viewer: userId, videoid: videoId });
      }

      updatedDisliked = true;
    }

    await targetVideo.save();

    return res.status(200).json({
      liked: false,
      disliked: updatedDisliked,
      likes: targetVideo.Like,
      dislikes: targetVideo.Dislike
    });
  } catch (error) {
    console.error("Dislike error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const checkLikeStatus = async (req, res) => {
  const { videoId, userId } = req.params;
  try {
    const targetVideo = await video.findById(videoId);
    if (!targetVideo) return res.status(404).json({ message: "Video not found" });

    const liked = (targetVideo.likedBy || []).includes(userId);
    const disliked = (targetVideo.dislikedBy || []).includes(userId);

    return res.status(200).json({
      liked,
      disliked,
      likes: targetVideo.Like || 0,
      dislikes: targetVideo.Dislike || 0
    });
  } catch (error) {
    console.error("Check status error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallLikedVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    const likevideo = await like
      .find({ viewer: userId })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(likevideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
