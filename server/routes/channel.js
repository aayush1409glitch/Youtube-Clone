import express from "express";
import { createChannel, getUserChannels, getChannelById } from "../controllers/channel.js";

const routes = express.Router();

routes.post("/create", createChannel);
routes.get("/user/:userId", getUserChannels);
routes.get("/:channelId", getChannelById);

export default routes;
