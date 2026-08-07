import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageCircle, Circle, Square } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";

const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000");

const RemoteVideo = ({ peer, peerID }: { peer: any, peerID: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    peer.on("stream", (stream: MediaStream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <div className="bg-gray-700 aspect-video rounded-lg flex items-center justify-center text-gray-400 relative overflow-hidden">
      <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />
      <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs truncate max-w-[90%]">
        {peerID.substring(0, 6)}...
      </span>
    </div>
  );
};

export default function WatchParty() {
  const router = useRouter();
  const { id: roomId, videoId } = router.query;
  const { user } = useUser();
  const [videoData, setVideoData] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [showChat, setShowChat] = useState(true);

  // WebRTC State
  const [peers, setPeers] = useState<any[]>([]);
  const userVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<any[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!roomId || !videoId || !user) return;

    const fetchVideo = async () => {
      try {
        const res = await axiosInstance.get(`/video/${videoId}`);
        setVideoData(res.data);
      } catch (error) {
        console.error("Error fetching video:", error);
      }
    };
    fetchVideo();
  }, [roomId, videoId, user]);

  useEffect(() => {
    if (!videoData || !user || !roomId) return;

    const setupRoom = (stream: MediaStream | null) => {
      if (stream) {
        streamRef.current = stream;
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
          userVideo.current.play().catch(e => {
            console.error("Play error:", e);
          });
        }
      }
      
      socket.emit("join-room", roomId, user._id, { name: user.name, image: user.image });

      socket.on("user-connected", (userId, userDetails, socketId) => {
        const peer = createPeer(socketId, socket.id as string, stream as MediaStream);
        peersRef.current.push({
          peerID: socketId,
          peer,
        });
        setPeers((users) => [...users, { peerID: socketId, peer }]);
      });

      socket.on("user-joined", (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, stream as MediaStream);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
        });
        setPeers((users) => [...users, { peerID: payload.callerID, peer }]);
      });

      socket.on("receiving-returned-signal", (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        if (item) item.peer.signal(payload.signal);
      });
      
      socket.on("user-disconnected", (id) => {
        const peerObj = peersRef.current.find((p) => p.peerID === id);
        if (peerObj) peerObj.peer.destroy();
        const peers = peersRef.current.filter((p) => p.peerID !== id);
        peersRef.current = peers;
        setPeers(peers);
      });
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(setupRoom)
      .catch(err => {
        console.error("Failed to get local stream", err);
        alert("Camera access denied or no camera found. You are joining without video/audio.");
        setupRoom(null);
      });

    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("sync-play", (time) => {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.currentTime = time;
        videoRef.current.play().catch(e => console.error(e));
      }
    });

    socket.on("sync-pause", (time) => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.currentTime = time;
        videoRef.current.pause();
      }
    });

    socket.on("sync-seek", (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    });

    return () => {
      socket.disconnect();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoData, roomId, user]);

  function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
    const Peer = require("simple-peer");
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal: any) => {
      socket.emit("sending-signal", { userToSignal, callerID, signal, userDetails: user });
    });

    return peer;
  }

  function addPeer(incomingSignal: any, callerID: string, stream: MediaStream) {
    const Peer = require("simple-peer");
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal: any) => {
      socket.emit("returning-signal", { signal, callerID });
    });

    peer.signal(incomingSignal);
    return peer;
  }

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true } as any);
        const videoTrack = screenStream.getVideoTracks()[0];
        
        videoTrack.onended = () => {
          stopScreenShare();
        };

        if (streamRef.current) {
          const oldVideoTrack = streamRef.current.getVideoTracks()[0];
          peersRef.current.forEach(p => p.peer.replaceTrack(oldVideoTrack, videoTrack, streamRef.current));
          if (userVideo.current) userVideo.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen sharing failed", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      const newVideoTrack = stream.getVideoTracks()[0];
      if (streamRef.current) {
        const oldVideoTrack = (userVideo.current?.srcObject as MediaStream)?.getVideoTracks()[0];
        if (oldVideoTrack) oldVideoTrack.stop();
        
        peersRef.current.forEach(p => p.peer.replaceTrack(oldVideoTrack, newVideoTrack, streamRef.current));
        if (userVideo.current) userVideo.current.srcObject = streamRef.current;
      }
      setIsScreenSharing(false);
      setIsVideoOff(false);
    });
  };

  const toggleRecording = () => {
    if (!isRecording) {
      if (!streamRef.current) return;
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm; codecs=vp9' };
      try {
        const mediaRecorder = new MediaRecorder(streamRef.current, options);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.style.display = 'none';
          a.href = url;
          a.download = `watch-party-recording-${roomId}.webm`;
          a.click();
          window.URL.revokeObjectURL(url);
        };
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (e) {
        console.error("MediaRecorder error:", e);
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    
    const msg = {
      senderId: user?._id,
      senderName: user?.name,
      senderImage: user?.image,
      text: currentMessage,
      time: new Date().toLocaleTimeString(),
    };
    
    socket.emit("send-chat-message", msg);
    setMessages((prev) => [...prev, msg]);
    setCurrentMessage("");
  };

  const handlePlay = () => {
    if (videoRef.current) {
      socket.emit("video-play", videoRef.current.currentTime);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      socket.emit("video-pause", videoRef.current.currentTime);
    }
  };

  if (!user) return <div className="p-8 text-center text-xl">Please sign in to join the watch party.</div>;
  if (!videoData) return <div className="p-8 text-center text-xl">Loading Watch Party...</div>;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-zinc-950 text-white overflow-x-hidden">
      {/* LEFT SIDE: VIDEO PLAYER & CALL GRID */}
      <div className="flex-1 flex flex-col p-3 sm:p-6 overflow-y-auto">
        
        {/* Main Sync Video */}
        <div className="w-full aspect-video max-h-[60vh] flex justify-center bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative mb-4 shrink-0">
          <video
            ref={videoRef}
            src={videoData.filepath.startsWith("http") ? videoData.filepath.replace("commondatastorage.googleapis.com", "storage.googleapis.com").replace("http://", "https://") : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/${videoData.filepath}`}
            className="w-full h-full object-contain"
            controls
            autoPlay
            muted
            onPlay={handlePlay}
            onPause={handlePause}
          />
        </div>
        
        <div className="mb-4 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">{videoData.videotitle}</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">Host: <span className="text-zinc-200 font-medium">{user.name}</span> • Room: <span className="font-mono text-blue-400">{roomId}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              Live Sync
            </span>
          </div>
        </div>

        {/* Video Call Grid */}
        <div className="bg-zinc-900/60 backdrop-blur rounded-2xl p-4 border border-zinc-800/80 mb-4">
           <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-3">Participants ({peers.length + 1})</h3>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
              {/* Local User */}
              <div className="bg-zinc-800 aspect-video rounded-xl flex items-center justify-center text-zinc-400 relative overflow-hidden border border-zinc-700/50 shadow-md">
                 <video playsInline muted ref={userVideo} autoPlay className="w-full h-full object-cover" />
                 <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur text-white px-2 py-0.5 rounded-md text-xs font-medium border border-white/10">
                   You {isMuted && "🔇"}
                 </span>
              </div>
              
              {/* Remote Peers */}
              {peers.map((peerObj, index) => {
                return (
                  <RemoteVideo key={index} peer={peerObj.peer} peerID={peerObj.peerID} />
                );
              })}
           </div>
        </div>

        {/* Control Bar */}
        <div className="bg-zinc-900/90 backdrop-blur-md rounded-2xl p-3 flex items-center justify-center gap-2 sm:gap-4 border border-zinc-800 shadow-xl">
          <Button onClick={toggleMute} variant="secondary" className={`rounded-xl w-11 h-11 p-0 border transition-all ${isMuted ? 'bg-red-600/90 hover:bg-red-600 border-red-500' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'}`}>
            {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </Button>
          <Button onClick={toggleVideo} variant="secondary" className={`rounded-xl w-11 h-11 p-0 border transition-all ${isVideoOff ? 'bg-red-600/90 hover:bg-red-600 border-red-500' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'}`}>
            {isVideoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
          </Button>
          <Button onClick={toggleScreenShare} variant="secondary" className={`rounded-xl w-11 h-11 p-0 border transition-all ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700 border-blue-500' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'}`}>
            <MonitorUp className="w-5 h-5 text-white" />
          </Button>
          <Button onClick={toggleRecording} variant="secondary" className={`rounded-xl w-11 h-11 p-0 border transition-all ${isRecording ? 'bg-red-600/90 hover:bg-red-600 border-red-500 animate-pulse' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'}`}>
            {isRecording ? <Square className="w-5 h-5 text-white fill-white" /> : <Circle className="w-5 h-5 text-red-500 fill-red-500" />}
          </Button>
          <Button onClick={() => setShowChat(!showChat)} variant="secondary" className={`rounded-xl w-11 h-11 p-0 border transition-all ${showChat ? 'bg-blue-600 hover:bg-blue-700 border-blue-500' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'}`}>
            <MessageCircle className="w-5 h-5 text-white" />
          </Button>
          <Button onClick={() => router.push("/")} variant="destructive" className="rounded-xl px-4 h-11 bg-red-600 hover:bg-red-700 font-semibold shadow-lg shadow-red-900/20">
            <PhoneOff className="w-5 h-5 mr-1.5" /> Leave
          </Button>
        </div>
        
      </div>

      {/* RIGHT SIDE: CHAT PANEL */}
      {showChat && (
        <div className="w-full md:w-80 lg:w-96 bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col h-[500px] md:h-auto shadow-2xl shrink-0">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2 text-white">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              Party Chat
            </h2>
            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{messages.length} msgs</span>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-900/40">
            {messages.length === 0 ? (
              <div className="text-zinc-500 text-center my-auto py-12 text-sm flex flex-col items-center">
                <MessageCircle className="w-8 h-8 opacity-30 mb-2" />
                No messages yet. Say hi to the room!
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.senderId === user._id ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] text-zinc-400 mb-1 font-medium">{msg.senderName} • {msg.time}</span>
                  <div className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm max-w-[85%] break-words shadow-sm ${msg.senderId === user._id ? 'bg-blue-600 text-white rounded-br-xs' : 'bg-zinc-800 text-zinc-100 border border-zinc-700/50 rounded-bl-xs'}`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-zinc-950 border-t border-zinc-800">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-800 text-white border border-zinc-700/60 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm placeholder:text-zinc-500"
              />
              <Button type="submit" className="rounded-full bg-blue-600 hover:bg-blue-700 px-4 text-xs sm:text-sm font-semibold shadow-md shadow-blue-900/30">Send</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
