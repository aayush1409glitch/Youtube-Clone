const initSocket = (io) => {
  io.on("connection", (socket) => {
    // console.log("New user connected:", socket.id);

    // Join a specific watch party room
    socket.on("join-room", (roomId, userId, userDetails) => {
      socket.join(roomId);
      
      // Notify others in the room that a new user joined (for WebRTC peer initiation)
      socket.to(roomId).emit("user-connected", userId, userDetails, socket.id);

      // Handle WebRTC Signaling: Sending a signal to a specific peer
      socket.on("sending-signal", (payload) => {
        io.to(payload.userToSignal).emit("user-joined", {
          signal: payload.signal,
          callerID: payload.callerID,
          userDetails: payload.userDetails
        });
      });

      // Handle WebRTC Signaling: Returning a signal back to the caller
      socket.on("returning-signal", (payload) => {
        io.to(payload.callerID).emit("receiving-returned-signal", {
          signal: payload.signal,
          id: socket.id
        });
      });

      // Handle Chat Messages
      socket.on("send-chat-message", (message) => {
        socket.to(roomId).emit("chat-message", message);
      });

      // Handle Video Synchronization
      socket.on("video-play", (currentTime) => {
        socket.to(roomId).emit("sync-play", currentTime);
      });

      socket.on("video-pause", (currentTime) => {
        socket.to(roomId).emit("sync-pause", currentTime);
      });

      socket.on("video-seek", (currentTime) => {
        socket.to(roomId).emit("sync-seek", currentTime);
      });

      // Handle Disconnection
      socket.on("disconnect", () => {
        socket.to(roomId).emit("user-disconnected", socket.id);
      });
    });
  });
};

export default initSocket;
