# Android Deployment Guide

## Method 1: Direct Deployment via USB (Recommended for Testing)
This is the fastest way to get the app on your phone for testing.

### 1. Enable Developer Mode on your Phone
1.  Open **Settings** on your Android device.
2.  Go to **About Phone**.
3.  Scroll down to **Build Number** and tap it **7 times** rapidly.
4.  You will see a message saying "You are now a developer!".

### 2. Enable USB Debugging
1.  Go back to **Settings** > **System** > **Developer Options**.
2.  Scroll down and enable **USB Debugging**.

### 3. Connect and Run
1.  Connect your phone to your Mac via USB cable.
2.  On your phone, a popup will ask "Allow USB debugging?". Check "Always allow" and tap **Allow**.
3.  Open **Android Studio** on your Mac.
4.  In the top toolbar, look at the device dropdown (where it likely says "Pixel 7 API 33").
5.  Click it and select your **physical device** (e.g., "Samsung S21").
6.  Click the green **Play (▶)** button.
7.  The app will build and install directly onto your phone.

---

## Method 2: Build an APK File (For Sharing)
If you want to send the app file to yourself or a friend to install manually.

### 1. Build the APK
1.  Open **Android Studio**.
2.  Go to the top menu bar: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3.  Wait for the build to finish (progress bar at bottom right).
4.  A popup will appear saying "APK(s) generated successfully". Click **locate**.
    *   *Path:* `android/app/build/outputs/apk/debug/app-debug.apk`

### 2. Install the APK
1.  Transfer this `app-debug.apk` file to your phone (via Google Drive, USB, or email).
2.  Open the file on your phone.
3.  You may be asked to allow installation from "unknown sources". Allow it.
4.  The app will replace the previous version.

---

## Method 3: Build for Google Play Store (Production)
To publish to the store, you need a signed bundle (`.aab`).

1.  Go to **Build** > **Generate Signed Bundle / APK**.
2.  Select **Android App Bundle**.
3.  Create a new **Key store path** (keep this file safe! passwords and all).
4.  Fill in the certificate details.
5.  Select **Release** build variant.
6.  Upload the generated `.aab` file to the Google Play Console.
