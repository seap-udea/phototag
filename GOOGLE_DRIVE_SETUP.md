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

1. **Go to "APIs & Services" > "Credentials"**
2. **Click "Create Credentials" > "OAuth client ID"**
3. **Configure OAuth consent screen** (if not done already):
   - Choose "External" user type
   - Fill in required fields (App name, User support email, Developer contact)
   - Add your email to test users
4. **Create OAuth client ID**:
   - Application type: "Desktop application"
   - Name: "Photo Tag App"
   - Click "Create"

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

1. **"Invalid credentials"**:
   - Check that all environment variables are set correctly
   - Verify the refresh token is valid

2. **"Folder not found"**:
   - Ensure the folder ID is correct
   - Check that the folder is shared publicly

3. **"Permission denied"**:
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
