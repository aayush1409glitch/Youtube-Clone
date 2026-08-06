import mongoose from "mongoose";
import video from "./Modals/video.js";

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL || "mongodb://127.0.0.1:27017/yourtube");
    
    // Clear everything
    await video.deleteMany({});

    const videosList = [
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        title: "Big Buck Bunny - Animated Short",
        channel: "Blender Foundation"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        title: "Elephants Dream - Short Film",
        channel: "Blender Foundation"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        title: "Google Chromecast - For Bigger Blazes",
        channel: "Google TV"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        title: "Google Chromecast - For Bigger Escapes",
        channel: "Google TV"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        title: "Google Chromecast - For Bigger Fun",
        channel: "Google TV"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        title: "Google Chromecast - For Bigger Joyrides",
        channel: "Google TV"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        title: "Google Chromecast - For Bigger Meltdowns",
        channel: "Google TV"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        title: "Sintel - Open Movie Project Trailer",
        channel: "Blender Foundation"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
        title: "Subaru Outback - On Street and Dirt",
        channel: "Auto Review"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        title: "Tears of Steel - Sci-Fi Short",
        channel: "Blender Foundation"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
        title: "Volkswagen GTI Review",
        channel: "Auto Review"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        title: "We Are Going On Bullrun",
        channel: "Roadtrippers"
      },
      {
        file: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
        title: "What car can you get for a grand?",
        channel: "Car Show"
      },
      {
        file: "https://www.w3schools.com/html/mov_bbb.mp4",
        title: "HTML5 Video Test - W3Schools",
        channel: "Web Dev Academy"
      },
      {
        file: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        title: "Beautiful Blooming Flower Timelapse",
        channel: "Nature Vibes"
      },
      {
        file: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
        title: "Friday - Classic Cinema Scene",
        channel: "Classic Cinema"
      },
      {
        file: "uploads/sintel.mp4",
        title: "Cooking Tutorial: Perfect Pasta",
        channel: "Chef's Kitchen"
      },
      {
        file: "uploads/flower.mp4",
        title: "Amazing Nature Documentary",
        channel: "Nature Channel"
      },
      {
        file: "uploads/friday.mp4",
        title: "Welcome to my channel!",
        channel: "Vlog Channel"
      },
      {
        file: "uploads/sample.mp4",
        title: "Learn React in 10 Minutes",
        channel: "Code Academy"
      }
    ];

    const sampleVideos = [];
    
    for (let i = 0; i < 20; i++) {
      const data = videosList[i];
      sampleVideos.push({
        videotitle: data.title,
        filename: data.file.split('/').pop(),
        filetype: "video/mp4",
        filepath: data.file,
        filesize: "2048",
        videochanel: data.channel,
        Like: Math.floor(Math.random() * 10000),
        views: Math.floor(Math.random() * 500000),
        uploader: `user_${(i % 5) + 1}`,
      });
    }

    await video.insertMany(sampleVideos);
    console.log("Successfully seeded 20 completely distinct videos!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDB();
