"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Download, Play, MoreVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DownloadsContent() {
  const { user, setUser, login, activeChannel } = useUser();
  const [downloads, setDownloads] = useState<any[]>([]);

  useEffect(() => {
    const fetchFreshUserData = async () => {
      if (!user?.email) return;
      try {
        const response = await axiosInstance.post("/user/login", {
          email: user.email,
          name: user.name,
          image: user.image
        });
        if (response.data && response.data.result) {
          setUser(response.data.result);
          localStorage.setItem("user", JSON.stringify(response.data.result));
        }
      } catch (err) {
        console.error("Error refreshing downloads:", err);
      }
    };
    fetchFreshUserData();
  }, []);

  useEffect(() => {
    const userDownloads = user?.downloads || [];
    const channelDownloads = activeChannel?.downloads || [];
    
    // Combine both user and channel downloads to ensure NOTHING is missed
    const combinedMap = new Map();
    [...userDownloads, ...channelDownloads].forEach(item => {
      if (item && item.videoId) {
        combinedMap.set(item._id || item.videoId, item);
      }
    });

    const sorted = Array.from(combinedMap.values()).sort(
      (a: any, b: any) => new Date(b.downloadDate).getTime() - new Date(a.downloadDate).getTime()
    );
    setDownloads(sorted);
  }, [user, activeChannel]);

  const handleDeleteDownload = async (downloadId: string) => {
    const entityId = user?._id || activeChannel?._id;
    if (!entityId) return;
    try {
      const res = await axiosInstance.delete(`/user/download/${entityId}/${downloadId}`);
      if (res.data) {
        const updated = res.data;
        if (updated && updated.email) {
          setUser(updated);
          localStorage.setItem("user", JSON.stringify(updated));
        } else {
          setDownloads(prev => prev.filter(d => d._id !== downloadId));
        }
        toast.success("Video removed from downloads");
      }
    } catch (error) {
      console.error("Error deleting download:", error);
      toast.error("Failed to remove video from downloads");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Keep track of videos you download
        </h2>
        <p className="text-gray-600">Sign in to see your download history.</p>
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <div className="text-center py-12">
        <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No downloaded videos yet</h2>
        <p className="text-gray-600">Videos you download will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{downloads.length} videos downloaded</p>
      </div>

      <div className="space-y-4">
        {downloads.map((item, index) => (
          <div key={index} className="flex gap-4 group items-center bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <Link href={`/watch/${item.videoId}`} className="flex-shrink-0">
              <div className="relative w-40 aspect-video bg-gray-200 dark:bg-zinc-800 rounded overflow-hidden flex items-center justify-center">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/watch/${item.videoId}`}>
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 mb-1">
                  {item.videoTitle}
                </h3>
              </Link>
              <p className="text-xs text-gray-500 mt-1">
                Downloaded {formatDistanceToNow(new Date(item.downloadDate))} ago
              </p>
              {item.videoUrl && (
                <a 
                  href={item.videoUrl} 
                  download={`${item.videoTitle}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                >
                  Download again
                </a>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleDeleteDownload(item._id)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove from downloads
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
