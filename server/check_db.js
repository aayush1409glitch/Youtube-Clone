import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const videoSchema = new mongoose.Schema({
  videotitle: String,
  filepath: String,
});

const Video = mongoose.model('Video', videoSchema);

async function checkDB() {
  await mongoose.connect(process.env.DB_URL);
  const videos = await Video.find({});
  videos.forEach(v => console.log(v.videotitle, v.filepath));
  process.exit(0);
}

checkDB();
