import video from "../Modals/video.js";

export const uploadvideo = async (req, res) => {
  if (req.file === undefined) {
    return res
      .status(404)
      .json({ message: "plz upload a mp4 video file only" });
  } else {
    try {
      const file = new video({
        videotitle: req.body.videotitle,
        filename: req.file.originalname,
        filepath: req.file.path.replace(/\\/g, "/"),
        filetype: req.file.mimetype,
        filesize: req.file.size,
        videochanel: req.body.videochanel,
        uploader: req.body.uploader,
      });
      await file.save();
      return res.status(201).json("file uploaded successfully");
    } catch (error) {
      console.error(" error:", error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};
export const getallvideo = async (req, res) => {
  try {
    const files = await video.find();
    return res.status(200).send(files);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const seedvideo = async (req, res) => {
  try {
    await video.deleteMany({});
    const videosList = [
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        title: "Big Buck Bunny - Animated Short",
        channel: "Blender Foundation"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        title: "Elephants Dream - Short Film",
        channel: "Blender Foundation"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        title: "Google Chromecast - For Bigger Blazes",
        channel: "Google TV"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        title: "Google Chromecast - For Bigger Escapes",
        channel: "Google TV"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        title: "Google Chromecast - For Bigger Fun",
        channel: "Google TV"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        title: "Google Chromecast - For Bigger Joyrides",
        channel: "Google TV"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        title: "Google Chromecast - For Bigger Meltdowns",
        channel: "Google TV"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        title: "Sintel - Open Movie Project Trailer",
        channel: "Blender Foundation"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
        title: "Subaru Outback - On Street and Dirt",
        channel: "Auto Review"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        title: "Tears of Steel - Sci-Fi Short",
        channel: "Blender Foundation"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
        title: "Volkswagen GTI Review",
        channel: "Auto Review"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        title: "We Are Going On Bullrun",
        channel: "Roadtrippers"
      },
      {
        file: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
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
      }
    ];

    const sampleVideos = [];
    for (let i = 0; i < videosList.length; i++) {
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
    return res.status(200).json({ message: "Successfully seeded videos!" });
  } catch (error) {
    console.error("Seeding error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
