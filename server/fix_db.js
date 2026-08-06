import mongoose from 'mongoose';
import dotenv from 'dotenv';
import videoModel from './Modals/video.js';

dotenv.config();

const workingUrls = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://vjs.zencdn.net/v/oceans.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
];

async function fixDB() {
  await mongoose.connect(process.env.DB_URL);
  
  const videos = await videoModel.find({ filepath: { $regex: 'googleapis' } });
  
  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    v.filepath = workingUrls[i % workingUrls.length];
    await v.save();
    console.log(`Updated ${v.videotitle} to ${v.filepath}`);
  }
  
  console.log("Done updating MongoDB.");
  process.exit(0);
}

fixDB();
