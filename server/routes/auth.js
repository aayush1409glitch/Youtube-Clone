import express from "express";
import { login, updateprofile, toggleSubscribe, downloadVideo, upgradePlan, deleteDownload, verifyOtp, updateTheme, getOtpForTesting } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.post("/verify-otp", verifyOtp);
routes.get("/get-otp/:email", getOtpForTesting);
routes.post("/update-theme", updateTheme);
routes.patch("/update/:id", updateprofile);
routes.post("/subscribe", toggleSubscribe);
routes.post("/download", downloadVideo);
routes.post("/upgrade", upgradePlan);
routes.delete("/download/:channelId/:downloadId", deleteDownload);
export default routes;
