# Google Drive API Setup Guide

This guide explains how to set up Google Drive API for persistent tag storage in the Photo Tagging App.

## 🔧 **Step 1: Create Google Cloud Project**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable Google Drive API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

## 🔑 **Step 2: Create OAuth 2.0 Credentials**

### Option A: Quick Setup (Recommended)

1. **Go to "APIs & Services" > "Credentials"**
2. **Click "Create Credentials" > "OAuth client ID"**
3. **If prompted to configure OAuth consent screen**:
   - Choose "External" user type
   - Fill in required fields (App name, User support email, Developer contact)
   - **IMPORTANT**: Add your email to test users in the "Test users" section
   - **Publishing Status**: For testing, keep it in "Testing" mode
   - **Scopes**: Add `https://www.googleapis.com/auth/drive.file` scope
4. **Create OAuth client ID**:
   - Application type: "Desktop application"
   - Name: "Photo Tag App"
   - Click "Create"

### Option B: Service Account Method (Recommended - Easier Setup)

Service accounts are often easier to set up and don't require OAuth consent screen configuration:

#### **Step B1: Create Service Account**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to**: APIs & Services > Credentials
3. **Click "Create Credentials" > "Service account"**
4. **Fill in the service account details**:
   - **Service account name**: `phototag-storage`
   - **Service account ID**: `phototag-storage` (auto-generated)
   - **Description**: `Service account for Photo Tag app storage`
5. **Click "Create and Continue"**
6. **Skip the "Grant access" step** (click "Continue")
7. **Click "Done"**

#### **Step B2: Create and Download Key**

1. **Find your service account** in the credentials list
2. **Click on the service account email**
3. **Go to "Keys" tab**
4. **Click "Add Key" > "Create new key"**
5. **Choose "JSON" format**
6. **Click "Create"**
7. **Download the JSON file** (keep it secure!)

#### **Step B3: Share Google Drive Folder**

1. **Go to Google Drive**: https://drive.google.com/
2. **Create a new folder** (e.g., "Photo Tag App Data")
3. **Right-click the folder > "Share"**
4. **Add the service account email** (found in the JSON file as `client_email`)
5. **Set permission to "Editor"**
6. **Click "Send"**
7. **Copy the folder ID** from the URL (the long string after `/folders/`)

#### **Step B4: Extract Credentials from JSON**

1. **Open the downloaded JSON file**
2. **Find these values**:
   - `client_email` → This is your service account email
   - `private_key` → This is your private key
   - `project_id` → Your Google Cloud project ID

#### **Step B5: Configure Environment Variables**

Instead of OAuth credentials, use these environment variables:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_FOLDER_ID=your_folder_id_here
```

**Important Notes**:
- The private key should include the `\n` characters as shown above
- The private key should be wrapped in quotes
- Make sure to include the full private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

#### **Step B6: Example JSON Structure**

Your downloaded JSON file should look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "phototag-storage@your-project.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/phototag-storage%40your-project.iam.gserviceaccount.com"
}
```

**Extract**:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY`

## 🤔 **Which Method Should I Use?**

### **OAuth Method (Option A)**
- ✅ **Pros**: More secure, user-specific access
- ❌ **Cons**: Requires OAuth consent screen setup, test users configuration
- 🎯 **Best for**: Production apps with many users

### **Service Account Method (Option B) - RECOMMENDED**
- ✅ **Pros**: Easier setup, no OAuth consent screen needed, server-to-server
- ✅ **Cons**: Less secure (shared credentials), but fine for this use case
- 🎯 **Best for**: Personal projects, internal tools, quick setup

**For your Photo Tag app, we recommend the Service Account method** because:
- No OAuth consent screen configuration needed
- No test users to manage
- Simpler setup process
- Perfect for a photo tagging application

## 📋 **Step 3: Get Refresh Token**

1. **Download the credentials JSON file**
2. **Install Google API tools**:
   ```bash
   npm install -g googleapis
   ```
3. **Run the OAuth flow**:
   ```bash
   node -e "
   const { google } = require('googleapis');
   const oauth2Client = new google.auth.OAuth2(
     'YOUR_CLIENT_ID',
     'YOUR_CLIENT_SECRET',
     'urn:ietf:wg:oauth:2.0:oob'
   );
   const authUrl = oauth2Client.generateAuthUrl({
     access_type: 'offline',
     scope: ['https://www.googleapis.com/auth/drive.file']
   });
   console.log('Visit this URL:', authUrl);
   "
   ```
4. **Visit the URL and authorize the app**
5. **Get the authorization code from the browser**
6. **Exchange for refresh token**:
   ```bash
   node -e "
   const { google } = require('googleapis');
   const oauth2Client = new google.auth.OAuth2(
     'YOUR_CLIENT_ID',
     'YOUR_CLIENT_SECRET',
     'urn:ietf:wg:oauth:2.0:oob'
   );
   oauth2Client.getToken('AUTHORIZATION_CODE', (err, tokens) => {
     if (err) return console.error(err);
     console.log('Refresh Token:', tokens.refresh_token);
   });
   "
   ```

## 📁 **Step 4: Create Google Drive Folder**

1. **Go to Google Drive**: https://drive.google.com/
2. **Create a new folder** (e.g., "Photo Tag App Data")
3. **Right-click the folder > "Share"**
4. **Set permissions to "Anyone with the link can view"**
5. **Copy the folder ID from the URL**:
   - URL format: `https://drive.google.com/drive/folders/FOLDER_ID`
   - The FOLDER_ID is the long string after `/folders/`

## 🌐 **Step 5: Configure Environment Variables**

Add these environment variables to your deployment platform (Render):

```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
GOOGLE_FOLDER_ID=your_folder_id_here
```

## 🚀 **Step 6: Deploy to Render**

1. **Go to Render dashboard**
2. **Create new Web Service**
3. **Connect your GitHub repository**
4. **Configure as Docker service**
5. **Add environment variables** in Render dashboard:
   - Go to your service settings
   - Add each environment variable
6. **Deploy!**

## 🔍 **Step 7: Verify Setup**

1. **Open your deployed app**
2. **Add a test tag**
3. **Check Google Drive folder** - you should see `phototag-tags.json`
4. **Refresh the page** - tags should persist

## 🛠️ **Troubleshooting**

### Common Issues:

1. **"Error 403: access_denied" or "App not verified"**:
   
   **IMMEDIATE FIX:**
   - **Go to Google Cloud Console**: https://console.cloud.google.com/
   - **Navigate to**: APIs & Services > OAuth consent screen
   - **Scroll down to "Test users" section**
   - **Click "ADD USERS"**
   - **Add your email address** (the same one you're using to test)
   - **Click "SAVE"**
   - **Wait 5-10 minutes** for changes to propagate
   - **Try the OAuth flow again**
   
   **Additional checks:**
   - **Make sure the app is in "Testing" mode** (not "In production")
   - **Verify you're using the same email** that you added as a test user
   - **Check that the required scopes are added**: `https://www.googleapis.com/auth/drive.file`

2. **"Invalid credentials"**:
   - Check that all environment variables are set correctly
   - Verify the refresh token is valid

3. **"Folder not found"**:
   - Ensure the folder ID is correct
   - Check that the folder is shared publicly

4. **"Permission denied"**:
   - Verify the OAuth scope includes `https://www.googleapis.com/auth/drive.file`
   - Check that the app has access to the folder

### Testing Locally:

1. **Create `.env.local` file**:
   ```bash
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REFRESH_TOKEN=your_refresh_token
   GOOGLE_FOLDER_ID=your_folder_id
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📊 **Benefits of Google Drive Storage**

- ✅ **Persistent**: Data survives container restarts
- ✅ **Accessible**: Can be accessed from anywhere
- ✅ **Backup**: Automatic Google Drive backup
- ✅ **Collaborative**: Multiple users can access the same data
- ✅ **Scalable**: No storage limits for the app
- ✅ **Reliable**: Google's infrastructure

## 🔒 **Security Notes**

- The refresh token provides long-term access
- Store credentials securely in environment variables
- The app only accesses the specific folder you create
- Consider rotating credentials periodically

---

**Need help?** Check the Google Drive API documentation: https://developers.google.com/drive/api
