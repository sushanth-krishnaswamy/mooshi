# Tasks & Notes Application

This repository contains the code for a Tasks & Notes application, which is structured as a mono-repo containing three parts:

- `backend`: The backend server written in Python with FastAPI and SQLAlchemy.
- `frontend`: The desktop web application written in React, TypeScript, and Vite.
- `mobile`: The mobile application for iOS and Android, built with React Native and Expo.

## Running the Backend

The backend is built with FastAPI and uses a SQLite database by default.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend server will run at http://localhost:8000. It also provides an interactive API documentation at http://localhost:8000/docs.

## Running the Frontend (Web Desktop App)

The frontend is a React application created with Vite.

```bash
cd frontend
npm install
npm run dev
```

The web application will be accessible at http://localhost:5173.

## Running the Mobile App (iOS / Android)

The mobile application is built using React Native and Expo.

### Prerequisites

To run the mobile app, you will need to have Node.js installed, as well as the Expo Go app on your physical mobile device, or an iOS/Android simulator set up on your machine.

### Installation & Setup

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

### Running on your device/simulator

Once the Expo development server is running, it will display a QR code in the terminal.

- **On a physical device:** Download the Expo Go app from the App Store (iOS) or Google Play Store (Android). Open your phone's camera, scan the QR code, and open the link in Expo Go.
- **On an iOS Simulator:** Press `i` in the terminal to launch the app in the iOS Simulator (Requires Xcode on macOS).
- **On an Android Emulator:** Press `a` in the terminal to launch the app in an Android Emulator (Requires Android Studio).
- **On Web:** Press `w` in the terminal to launch the app in a web browser.

**Note:** Ensure your mobile device or simulator is connected to the same network as your development machine so it can communicate with the backend. You may need to update the API endpoint URL in the mobile app to point to your computer's local IP address instead of `localhost`.
