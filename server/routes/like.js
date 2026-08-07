import express from "express";
import { handlelike, handledislike, checkLikeStatus, getallLikedVideo } from "../controllers/like.js";

const routes = express.Router();
routes.get("/status/:videoId/:userId", checkLikeStatus);
routes.get("/:userId", getallLikedVideo);
routes.post("/dislike/:videoId", handledislike);
routes.post("/:videoId", handlelike);
export default routes;
