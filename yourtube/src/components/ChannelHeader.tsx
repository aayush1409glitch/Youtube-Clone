import React, { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";

import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

const ChannelHeader = ({ channel, user }: any) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { login } = useUser();

  React.useEffect(() => {
    if (user && user.subscriptions && channel) {
      const subbed = user.subscriptions.some(
        (sub: any) => sub.uploaderId === channel.owner
      );
      setIsSubscribed(subbed);
    }
  }, [user, channel]);

  const handleSubscribe = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/user/subscribe`, {
        userId: user._id,
        channelName: channel.channelname,
        uploaderId: channel.owner,
        avatar: channel.avatar || channel.channelname[0]
      });
      if (res.data) {
        login(res.data);
      }
    } catch (error) {
      console.log("Error subscribing:", error);
    }
  };

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="relative h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden"></div>

      {/* Channel Info */}
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="w-20 h-20 md:w-32 md:h-32">
            <AvatarFallback className="text-2xl">
              {channel?.channelname[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold">{channel?.channelname}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>@{channel?.channelname.toLowerCase().replace(/\s+/g, "")}</span>
            </div>
            {channel?.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 max-w-2xl">
                {channel?.description}
              </p>
            )}
          </div>

          {user && user?._id !== channel?._id && (
            <div className="flex gap-2">
              <Button
                onClick={handleSubscribe}
                variant={isSubscribed ? "outline" : "default"}
                className={
                  isSubscribed ? "bg-gray-100 dark:bg-zinc-800 dark:text-zinc-200" : "bg-red-600 hover:bg-red-700 text-white"
                }
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;
