# CitiSent Mobile Application

React Native + Expo mobile application scaffolded with component-driven architecture, Supabase integration, and real-time civic reporting features.

> For general project background, system architecture, and overall setup, refer to the [Root README](../README.md).

---

## Key Features

* **Quick Issue Reporting:** Select an issue category (such as Traffic Management, Fire Protection, City Agriculture, BPLO, or Public Works), attach photos, and describe the problem.
* **Automatic Location Pinpointing:** Uses your phone's built-in GPS to accurately tag where the issue is located.
* **Live Report Tracking:** Monitor the status of your reports in real time (*Pending*, *In Review*, *Resolved*, or *Rejected*).
* **Live Chat with City Responders:** Communicate directly with city staff inside individual reports to provide additional details or follow up.
* **Instant Notifications:** Receive real-time alerts whenever report statuses update or when responders send messages.
* **Profile & History:** Manage account details, view submission history, and configure notification preferences.


## Setup and Installation

Follow these step-by-step instructions to run the mobile app on your phone, emulator, or browser.

### Prerequisites

1. **Node.js:** Ensure Node.js (LTS version recommended) is installed on your computer. Download from [nodejs.org](https://nodejs.org/).
2. **Expo Go App (for physical devices):**
   * **Android:** Install from the [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).
   * **iPhone:** Install from the [Apple App Store](https://apps.apple.com/app/expo-go/id982107779).
3. **Network Connection:** Ensure your computer and mobile phone are connected to the same Wi-Fi network.

---

### Step 1: Open the Mobile App Directory

Open your terminal or command prompt and navigate to the `CitiSent-Mobile` folder:

```powershell
cd CitiSent-Mobile
```

---

### Step 2: Install Dependencies

Download and install the required npm packages:

```powershell
npm install
```

---

### Step 3: Configure Environment Variables

1. Make a copy of `.env.local.example` and rename it to `.env`:
   ```powershell
   cp .env.local.example .env
   ```
2. Open `.env` and configure your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key_here
   ```

> [!WARNING]
> **Security Reminder:** Never commit your `.env` file to version control or expose secret API keys. Only use publishable anonymous keys (`EXPO_PUBLIC_SUPABASE_KEY`) in the mobile client, and ensure Row Level Security (RLS) policies are enabled in your database.

---

### Step 4: Start the Application

Launch the Expo development server:

```powershell
npx expo start
```

A QR code will appear in your terminal.

---

### Step 5: Open the App on Your Device

* **On Android:** Open the **Expo Go** app and tap **"Scan QR code"**, then scan the QR code in your terminal.
* **On iPhone:** Open the built-in **Camera** app, point it at the terminal QR code, and tap the **"Open in Expo Go"** banner.
* **On Web Browser:** Press `w` in your terminal to launch a preview in your web browser.
* **On Emulator:** Press `a` for Android Emulator or `i` for iOS Simulator (macOS only).

---

## Keyboard Shortcuts

While the Expo server is running in your terminal, you can use these shortcuts:

* `r` — Reload the app on your connected device.
* `m` — Toggle the in-app developer menu.
* `a` — Launch on Android emulator.
* `i` — Launch on iOS simulator.
* `w` — Launch in web browser.
* `c` — Clear cache and restart server.
* `Ctrl + C` — Stop the development server.

---

## Troubleshooting

* **QR Code Connection Timeout / Network Mismatch:**
  Make sure your computer and smartphone are on the same Wi-Fi network. If you are on public, corporate, or university Wi-Fi that isolates devices, start Expo in tunnel mode:
  ```powershell
  npx expo start --tunnel
  ```

* **Stale Cache / Build Glitches:**
  Clear the development cache and restart:
  ```powershell
  npx expo start -c
  ```

* **Permission Prompts:**
  When prompted on your phone, grant access to **Location** (for GPS coordinates) and **Camera / Photos** (for report attachments).

---

## Project Structure

```text
CitiSent-Mobile/
├── app/                  # Application routes and navigation (Expo Router)
│   ├── (tabs)/           # Bottom tab screens (Home, Create Report, My Reports, Profile)
│   ├── auth/             # Login, Registration, OTP, and Password Reset screens
│   ├── create-report/    # Dynamic issue reporting form
│   └── profile/          # User profile editing and notification center
├── assets/               # Static images, icons, and logos
├── components/           # Reusable UI widgets and modular forms
│   ├── auth/             # Auth form inputs and buttons
│   ├── createReport/     # Location pickers and photo upload components
│   ├── home/             # Hotline widgets and emergency cards
│   ├── myReports/        # Report cards and live discussion dialogs
│   └── ui/               # Base UI primitives
├── constants/            # Color palettes, department lists, and layout configs
├── contexts/             # Global session and theme state providers
├── services/             # API services, Supabase client, and Socket.io handlers
├── utils/                # Formatting and helper utilities
├── .env.local.example    # Environment variable template
├── app.json              # Expo application manifest
└── package.json          # Dependencies and scripts
```
