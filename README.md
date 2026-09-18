# Bazaar - Multi-Vendor Marketplace 

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/5704c45a-e3f8-4d70-86cf-37b294dee2ba" />


## Project live 
Live : https://bazaar-sable.vercel.app

Nepal's leading multi-vendor marketplace connecting local artisans and international brands with buyers across the globe.

## Admin Access

The application uses **Firebase Authentication**. Administrative privileges are automatically granted to the following account:

- **Admin Email:** `sales@bazaar.com`
- **Admin Password:** `Bazaar@2082`

## App Password 
- supportbazaar@gmail.com
- qmow mohr etng lsav

## Gemini API Key : 
AIzaSyBDyh3I65r6cGyWXggM5zel4rYhlpaZvmk
For FAQ chat bot working 

### How to access the Admin Panel:
1. Go to the [Login Page](/login).
2. Click **"Email & Password"**.
3. Enter the admin email and password above.
4. Once logged in, an **"Admin"** link will appear in the navigation bar.
5. You can also navigate directly to `/admin`.

> **Note:** You can also use "Sign in with Google" with the same email if you prefer, but the specific admin password `aayush123` is configured for the Email login method.

## Features
- **Vendor Registration**: Users can apply to become vendors by providing store details and KYC documents (PAN card, etc.).
- **Admin Dashboard**: Admins can review, approve, or reject vendor applications.
- **AI Image Generator**: Vendors can generate product images using the integrated AI Studio.
- **Real-time Marketplace**: Real-time updates for products and applications using Firestore.
- **Automated Chatbot**: Product-specific chatbot that responds based on seller-defined "getaway messages" when offline.
- **Vendor Store Pages**: Dedicated pages for each vendor displaying their products and information.
- **AI Semantic Search**: Natural language search powered by Gemini embeddings for intuitive product discovery.
- **Landed Cost Calculator**: Real-time calculation of international shipping, export duties, and import taxes (DDP).
- **AR 'View in Room'**: Augmented Reality visualization using `<model-viewer>` to place products in the user's physical space.
- **Video-First Discovery**: TikTok-style vertical video feed for immersive product exploration and engagement.

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React & TypeScript** | A type-safe, component-based UI designed for a high-performance multi-vendor experience. |
| **Backend** | **Firebase (Serverless)** | A scalable, serverless infrastructure handling Authentication, Cloud Functions, and security. |
| **Database** | **Cloud Firestore** | A real-time, NoSQL document database optimized for live inventory and global data syncing. |
| **Storage** | **Firebase Storage** | Secure cloud bucket for hosting high-resolution product images and vendor PAN/VAT documents. |
| **Logic** | **Cloud Functions** | Event-driven Node.js environments for backend tasks like document verification and automated workflows. |

## 🚀 How to Run Locally (Step-by-Step for Beginners)

Follow these simple steps to get the project running on your own computer using **Visual Studio Code**.

### Step 1: Install the Required Tools
Before you start, you need two main tools installed on your computer:
1.  **Node.js**: This is the engine that runs the project. 
    *   Download it from [nodejs.org](https://nodejs.org/). 
    *   Choose the version labeled **"LTS"** (Long Term Support).
2.  **Visual Studio Code (VS Code)**: This is the code editor where you will work.
    *   Download it from [code.visualstudio.com](https://code.visualstudio.com/).

### Step 2: Prepare the Project Folder
1.  **Download the project**: If you have a ZIP file, right-click it and select **"Extract All..."** to unzip it into a folder.
2.  **Open VS Code**: Launch the Visual Studio Code application.
3.  **Open the Folder**: 
    *   Go to `File` > `Open Folder...` (on Windows) or `File` > `Open...` (on Mac).
    *   Select the folder you just extracted and click **Open**.

### Step 3: Open the Terminal
The terminal is where you type commands to run the project.
1.  In VS Code, go to the top menu and click **Terminal** > **New Terminal**.
2.  A small window will open at the bottom of your screen. This is your command line.

### Step 4: Install Project Dependencies
You need to download the "libraries" that make the project work.
1.  In the terminal window at the bottom, type the following command and press **Enter**:
    ```bash
    npm install
    ```
2.  Wait for it to finish. You will see a progress bar, and it might take a minute or two.

### Step 5: Set Up Environment Variables
The project needs some "keys" to connect to Firebase and AI services.
1.  In the left sidebar of VS Code (the file explorer), right-click in the empty space and select **New File**.
2.  Name the file exactly `.env` (don't forget the dot at the beginning).
3.  Copy and paste the following code into your new `.env` file:

```env
# Firebase Configuration (Already set up for you)
VITE_FIREBASE_API_KEY=AIzaSyB7Nra1NRLUtRxtqY5RKfziAlztkOlD1ak
VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0891362162.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gen-lang-client-0891362162
VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0891362162.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=366317225799
VITE_FIREBASE_APP_ID=1:366317225799:web:6c108949f763e10f452e62
VITE_FIRESTORE_DATABASE_ID=ai-studio-7c7aa8b1-ab0f-4e1c-be62-d90f60b798dc

# Gemini AI Configuration (REQUIRED for the Chatbot)
# 1. Go to https://aistudio.google.com/
# 2. Click on "Get API key"
# 3. Create a free API key and paste it below:
VITE_GEMINI_API_KEY=your_actual_api_key_here
GEMINI_API_KEY=your_actual_api_key_here
```
4.  **Save the file** (Ctrl + S or Cmd + S).

### Step 6: Start the Project
Now you are ready to run the app!
1.  Go back to the terminal window and type:
    ```bash
    npm run dev
    ```
2.  Press **Enter**.
3.  You should see a message like `Local: http://localhost:3000/`.

### Step 7: View the App
1.  Open your web browser (Chrome, Edge, or Safari).
2.  Type `http://localhost:3000` in the address bar and press **Enter**.
3.  **Congratulations!** Your local version of Bazaar is now running.
