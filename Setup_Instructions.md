# YouTube Clone - Full Stack Internship Project

## Overview
This project is a complete full-stack YouTube clone. The UI and user experience have been strictly preserved from the original React/Next.js template. 
The static data and API have been completely replaced with a custom **Node.js, Express, and MongoDB** backend.

## Tech Stack
- **Frontend:** React, Next.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication:** Firebase Auth

## Implemented Features (MongoDB Connected)
- **Navbar & Routing:** Fully functional navigation.
- **Home Page (Video Grid):** Dynamic fetching of videos from MongoDB.
- **Search Page:** Queries the database to filter videos by title and channel.
- **Video Page & Playback:** Fetches individual video details and plays the video file.
- **Channel Page & Dialogue:** Allows users to create a channel and view their channel profile.
- **Video Upload:** Uploads video files to the backend and saves metadata to MongoDB.
- **Like / Dislike System:** Interacts with the backend to securely record user likes/dislikes.
- **Watch Later & History:** Saves user viewing history and watch-later preferences to the database.
- **Comments:** Full CRUD functionality for video comments connected to MongoDB.

## Setup Instructions

### 1. Prerequisites
- Install **Node.js** (v16+)
- Install **MongoDB** (Ensure the MongoDB service is running locally on port `27017`)

### 2. Backend Setup
1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Ensure your `server/.env` file exists with the following variable:
   ```env
   PORT=5000
   DB_URL=mongodb://127.0.0.1:27017/yourtube
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   *The server should run on http://localhost:5000 and log "database connected".*

### 3. Frontend Setup
1. Open a second terminal and navigate to the `yourtube` directory:
   ```bash
   cd yourtube
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Ensure your `yourtube/.env.local` file exists with the following variable:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend should run on http://localhost:3000.*

### 4. Testing the Application
- Open your browser to `http://localhost:3000`.
- Click **Sign In** to authenticate via Firebase.
- Click your profile avatar to **Create a Channel**.
- Once a channel is created, go to **Your channel** and upload a video.
- The video will now dynamically appear on the Home Page and in Search Results!
