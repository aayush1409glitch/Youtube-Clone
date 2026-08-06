import express from "express";
import { login, updateprofile, toggleSubscribe, downloadVideo, upgradePlan, deleteDownload, verifyOtp, updateTheme } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.post("/verify-otp", verifyOtp);
routes.post("/update-theme", updateTheme);
routes.patch("/update/:id", updateprofile);
routes.post("/subscribe", toggleSubscribe);
routes.post("/download", downloadVideo);
routes.post("/upgrade", upgradePlan);
routes.delete("/download/:channelId/:downloadId", deleteDownload);
export default routes;
