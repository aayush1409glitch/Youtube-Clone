import mongoose from "mongoose";

const getOtp = async () => {
  try {
    await mongoose.connect("mongodb+srv://aayushtishya1409_db_user:sWgpPy1lQbXXJLur@cluster0.vkfjd5d.mongodb.net/?appName=Cluster0");
    const UserSchema = new mongoose.Schema({
      email: String,
      otp: String,
      otpExpiry: Date
    });
    const User = mongoose.model("User", UserSchema);
    
    const user = await User.findOne({ email: "aayush.p.chauhan24@slrtce.in" });
    if (user) {
      console.log("----------------------------------------");
      console.log(`User: ${user.email}`);
      console.log(`OTP: ${user.otp}`);
      console.log(`Expires: ${user.otpExpiry}`);
      console.log("----------------------------------------");
    } else {
      console.log("User not found in cloud database.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Error retrieving OTP:", error);
    process.exit(1);
  }
};

getOtp();
