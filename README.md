# 2048 Tilt

A motion-controlled 2048 game built with **React Native** + **Expo**, supporting **Android / iOS**.
Integrated with **Supabase** for user accounts, cloud storage, and global leaderboards.

## Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js**
- **Expo Go App**

## Installation

1. Navigate to the project directory:

   ```bash
   cd 2048_tilt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

Start the development server:

```bash
npx expo start
```

Once the server is running, you have several options to view the app:

- **Physical Device (Recommended)**:

  - Open the **Expo Go** app on your phone.
  - Scan the QR code displayed in the terminal.
  - _Note: Ensure your phone and computer are on the same Wi-Fi network._

- **iOS Simulator (Mac only)**:

  - Press `i`

- **Android Emulator**:
  - Press `a`

## Features

- **Motion Control**: Tilt your device to move tiles (uses device accelerometer).
- **User System**: Sign up/Login, update profile, and upload avatar.
- **Cloud Sync**: Game progress and best scores are saved to the cloud.
- **Leaderboard**: View global rankings and compete with other players.
- **Guest Mode**: Play without an account (scores saved locally).

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Supabase
