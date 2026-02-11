# Celtic 2011 Manager - Setup Guide

This guide details how to set up the development environment and configure Firebase for the application.

## 1. Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- `npm` (comes with Node.js)

### Installation & Running
1.  **Install Dependencies**:
    Open your terminal in the project directory and run:
    ```bash
    npm install
    ```
    *(Note: You likely already did this during initialization).*

2.  **Start the Development Server**:
    To see the app in your browser (with live reloading):
    ```bash
    npm run dev
    ```
    The terminal will show a local URL (usually `http://localhost:5173`). Ctrl+Click it to open.

3.  **Add Your Crest**:
    Save your team crest image as `crest.png` inside the `src/assets/` folder to replacing the placeholder.

---

## 2. Firebase Configuration (Required)

To make the app functional (login, database), you need to link it to a Firebase project.

### Step A: Create a Firebase Project
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"**.
3.  Name it (e.g., `celtic-2011-manager`).
4.  Disable Google Analytics for now (simpler setup), then click **"Create project"**.

### Step B: Register the Web App
1.  On the project overview page, click the **Web icon (`</>`)** to add an app.
2.  Register the app with a nickname (e.g., "Web App").
3.  You don't need "Firebase Hosting" checked yet (we can do that later).
4.  Click **"Register app"**.
5.  **Copy the `firebaseConfig` object** shown in the code block. It looks like this:
    ```javascript
    const firebaseConfig = {
      apiKey: "...",
      authDomain: "...",
      projectId: "...",
      ...
    };
    ```

### Step C: Enable Features
1.  **Authentication**:
    - Go to **Build > Authentication** in the sidebar.
    - Click **"Get started"**.
    - Select **"Email/Password"** as a Sign-in method and enable it.
    - (Optional) Enable **"Google"** if you want social login.
2.  **Firestore Database**:
    - Go to **Build > Firestore Database**.
    - Click **"Create database"**.
    - Choose a location (e.g., `eur3` for Europe/Ireland is usually best for latency).
    - Start in **Test mode** (allows read/write for 30 days) – we will secure this later.

### Step D: Connect App to Firebase
1.  Open the file `src/firebase.ts` in your code editor.
2.  Replace the placeholder `firebaseConfig` object with the real one you copied in **Step B**.
3.  **Install Firebase SDK** (if not already installed):
    ```bash
    npm install firebase
    ```

## 3. What Information Do We Need?
For the app to fully work, populate `src/firebase.ts` with these values from your Firebase Console:

- `apiKey`: The secret key identifying your project.
- `authDomain`: For authentication handling.
- `projectId`: Uniquely identifies your database.
- `storageBucket`: For storing files (like player photos).
- `messagingSenderId`: For notifications (future use).
- `appId`: Unique ID for this specific web app.

Once `src/firebase.ts` is updated, the app can be modified to start saving player data and sessions directly to the cloud!
