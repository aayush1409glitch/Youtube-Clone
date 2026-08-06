import mongoose from "mongoose";
import channels from "../Modals/channel.js";

export const createChannel = async (req, res) => {
  const { channelname, description, owner, avatar } = req.body;
  if (!channelname || !owner) {
    return res.status(400).json({ message: "Channel name and owner are required" });
  }
  try {
    const newChannel = await channels.create({ channelname, description, owner, avatar });
    return res.status(201).json(newChannel);
  } catch (error) {
    console.error("Create channel error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserChannels = async (req, res) => {
  const { userId } = req.params;
  try {
    const userChannels = await channels.find({ owner: userId });
    return res.status(200).json(userChannels);
  } catch (error) {
    console.error("Get channels error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getChannelById = async (req, res) => {
  const { channelId } = req.params;
  try {
    const channel = await channels.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }
    return res.status(200).json(channel);
  } catch (error) {
    console.error("Get channel error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
