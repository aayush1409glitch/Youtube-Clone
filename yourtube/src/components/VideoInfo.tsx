import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import { toast } from "sonner";

const VideoInfo = ({ video }: any) => {
  const router = useRouter();
  const [likes, setlikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user, login, activeChannel } = useUser();
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setlikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
  }, [video]);

  useEffect(() => {
    if (user && user.subscriptions) {
      const subbed = user.subscriptions.some(
        (sub: any) => sub.channelName === video.videochanel || sub.uploaderId === video.uploader
      );
      setIsSubscribed(subbed);
    }
  }, [user, video]);

  useEffect(() => {
    const handleviews = async () => {
      if (user) {
        try {
          return await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } catch (error) {
          return console.log(error);
        }
      } else {
        return await axiosInstance.post(`/history/views/${video?._id}`);
      }
    };
    handleviews();
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) {
      alert("Please log in to subscribe");
      return;
    }
    try {
      const res = await axiosInstance.post(`/user/subscribe`, {
        userId: user._id,
        channelName: video.videochanel,
        uploaderId: video.uploader || "unknown",
        avatar: video.videochanel[0]
      });
      // The backend returns the updated user object
      if (res.data) {
        login(res.data); // Update AuthContext
      }
    } catch (error) {
      console.log("Error subscribing:", error);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      toast.error("Please log in to download videos");
      return;
    }
    try {
      const videoUrl = video.filepath?.startsWith("http") 
        ? video.filepath.replace("http://", "https://") 
        : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/${video.filepath}`;
      
      const res = await axiosInstance.post(`/user/download`, {
        userId: user._id,
        channelId: activeChannel?._id || null,
        videoId: video._id,
        videoTitle: video.videotitle,
        videoUrl: videoUrl
      });
      
      if (res.data) {
        const updatedUser = res.data.entity || res.data;
        if (updatedUser && updatedUser.email) {
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        toast.success("Video downloaded and saved to your Downloads section!");
      }
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to download video. Please try again later.");
        console.log("Error downloading:", error);
      }
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.liked) {
        if (isLiked) {
          setlikes((prev: any) => prev - 1);
          setIsLiked(false);
        } else {
          setlikes((prev: any) => prev + 1);
          setIsLiked(true);
          if (isDisliked) {
            setDislikes((prev: any) => prev - 1);
            setIsDisliked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleWatchLater = async () => {
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleDislike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (!res.data.liked) {
        if (isDisliked) {
          setDislikes((prev: any) => prev - 1);
          setIsDisliked(false);
        } else {
          setDislikes((prev: any) => prev + 1);
          setIsDisliked(true);
          if (isLiked) {
            setlikes((prev: any) => prev - 1);
            setIsLiked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-medium">{video.videotitle}</h1>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{video.videochanel[0]}</AvatarFallback>
          </Avatar>
          <div className="whitespace-nowrap">
            <h3 className="font-medium">{video.videochanel}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">1.2M subscribers</p>
          </div>
          <Button 
            className={`ml-2 shrink-0 ${isSubscribed ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700' : 'bg-red-600 hover:bg-red-700 text-white'}`}
            onClick={handleSubscribe}
          >
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full mt-3 lg:mt-0">
          <div className="flex items-center bg-gray-100 dark:bg-zinc-800 dark:text-zinc-200 rounded-full">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full hover:bg-gray-200 dark:hover:bg-zinc-700"
              onClick={handleLike}
            >
              <ThumbsUp
                className={`w-5 h-5 mr-2 ${
                  isLiked ? "fill-black text-black dark:fill-white dark:text-white" : ""
                }`}
              />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-zinc-700" />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full hover:bg-gray-200 dark:hover:bg-zinc-700"
              onClick={handleDislike}
            >
              <ThumbsDown
                className={`w-5 h-5 mr-2 ${
                  isDisliked ? "fill-black text-black dark:fill-white dark:text-white" : ""
                }`}
              />
              {dislikes.toLocaleString()}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 rounded-full ${
              isWatchLater ? "text-primary" : ""
            }`}
            onClick={handleWatchLater}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 rounded-full"
            onClick={() => {
              const roomId = Math.random().toString(36).substring(2, 10);
              router.push(`/watch-party/${roomId}?videoId=${video._id}`);
            }}
          >
            <Users className="w-5 h-5 mr-2" />
            Watch Party
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 rounded-full"
          >
            <Share className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 rounded-full"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 rounded-full"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-zinc-800 dark:text-zinc-200 rounded-lg p-4">
        <div className="flex gap-4 text-sm font-medium mb-2">
          <span>{video.views.toLocaleString()} views</span>
          <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
        </div>
        <div className={`text-sm ${showFullDescription ? "" : "line-clamp-3"}`}>
          <p>
            Sample video description. This would contain the actual video
            description from the database.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 p-0 h-auto font-medium"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>
    </div>
  );
};

export default VideoInfo;
