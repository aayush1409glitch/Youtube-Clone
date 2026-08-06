import ChannelHeader from "@/components/ChannelHeader";
import axiosInstance from "@/lib/axiosinstance";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import { useUser } from "@/lib/AuthContext";
import { notFound } from "next/navigation";
import { useRouter } from "next/router";
import React from "react";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [channel, setChannel] = React.useState<any>(null);
  const [videos, setVideos] = React.useState<any>([]);

  const fetchVideos = () => {
    if (id) {
      axiosInstance.get("/video/getall").then(res => {
        const chanVideos = res.data.filter((v: any) => v.uploader === id);
        setVideos(chanVideos);
      }).catch(console.error);
    }
  };

  React.useEffect(() => {
    if (id) {
      // Fetch channel
      axiosInstance.get(`/channel/${id}`).then(res => setChannel(res.data)).catch(console.error);
      fetchVideos();
    }
  }, [id]);

  if (!channel) return <div>Loading...</div>;

  return (
    <div className="flex-1 min-h-screen">
      <div className="max-w-full mx-auto">
        <ChannelHeader channel={channel} user={user} />
        <Channeltabs />
        {user && user._id === channel.owner && (
          <div className="px-4 pb-8">
            <VideoUploader channelId={id} channelName={channel?.channelname} onUploadSuccess={fetchVideos} />
          </div>
        )}
        <div className="px-4 pb-8">
          <ChannelVideos videos={videos} />
        </div>
      </div>
    </div>
  );
};
export default index;
