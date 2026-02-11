# Remote Deployment Guide (Over-the-Air)

Deploying your app to a device without a USB cable (Remote/Over-the-Air) differs significantly between Android and iOS.

## 🤖 Android (Easiest)

Android allows you to install application files (`.apk`) directly from a web link or email.

### Steps:
1.  **Build the APK**:
    *   Open **Android Studio**.
    *   Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
    *   Locate the file: `android/app/build/outputs/apk/debug/app-debug.apk`.
2.  **Cloud Sharing**:
    *   Upload this file to **Google Drive**, **Dropbox**, or use a free service like **[Diawi](https://www.diawi.com/)** or **[WeTransfer](https://wetransfer.com/)**.
3.  **Install on Device**:
    *   Send the link to your phone via email or messaging app.
    *   Open the link on your phone.
    *   Download the `.apk` file.
    *   Tap to install (you may need to allow "Unknown Sources" in settings).

---

## 🍎 iOS (Requires Apple Developer Account)

Apple is stricter. You cannot simply email an app file to an iPhone unless the device is registered to your developer account or you use TestFlight.

### Option A: TestFlight (Best & Official)
*Requires: Paid Apple Developer Program ($99/year).*

1.  **Archive the App**:
    *   In Xcode, select "Any iOS Device" (arm64) as target.
    *   Go to **Product** > **Archive**.
2.  **Upload**:
    *   Once archived, click **Distribute App** > **App Store Connect** > **Upload**.
3.  **Invite Testers**:
    *   Go to [App Store Connect](https://appstoreconnect.apple.com/).
    *   Go to **TestFlight** tab.
    *   Add "Internal Testing" group and add your email (or others).
4.  **Install**:
    *   Download the **TestFlight** app from the App Store on the device.
    *   Accept the email invitation.
    *   Install your app.

### Option B: Ad Hoc Distribution (For Specific Devices)
*Requires: Paid Apple Developer Program.*

1.  **Register Device**:
    *   Get the **UDID** of the target iPhone (plug into Mac > Finder > Click phone info).
    *   Add this UDID to your Apple Developer Account portal.
2.  **Build IPA**:
    *   In Xcode: **Product** > **Archive** > **Distribute App** > **Ad Hoc**.
    *   Select your signing certificate.
    *   Export the `.ipa` file.
3.  **Deploy**:
    *   Upload the `.ipa` file to a service like **[Diawi](https://www.diawi.com/)**.
    *   Send the installation link to the device.

### Option C: Personal WiFi Sync (Semi-Remote)
*Requires: NO Paid Account (Free), but requires initial cable setup.*

1.  Plug in device to Mac.
2.  In Xcode: **Window** > **Devices and Simulators**.
3.  Check **"Connect via Network"**.
4.  Unplug cable.
5.  As long as Mac and iPhone are on the same WiFi, you can press **Play (▶)** in Xcode and it will install wirelessly.
