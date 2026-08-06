import express from "express";
import { getallvideo, uploadvideo } from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";

const routes = express.Router();

routes.post("/upload", upload.single("file"), uploadvideo);
routes.get("/getall", getallvideo);
routes.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { default: video } = await import("../Modals/video.js");
    const v = await video.findById(id);
    res.status(200).json(v);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});
export default routes;
