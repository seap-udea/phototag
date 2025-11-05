# Google Drive API Setup Guide (Service Account)

This guide explains how to set up Google Drive API using a **Service Account** for persistent tag storage in the Photo Tagging App. Service Accounts are recommended for server-side applications as they don't require user interaction.

## 🔧 **Step 1: Create Google Cloud Project**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable Google Drive API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

## 🔑 **Step 2: Create Service Account**

1. **Go to "APIs & Services" > "Credentials"**
2. **Click "Create Credentials" > "Service account"**
3. **Fill in the service account details**:
   - Service account name: `phototag` (or any name you prefer)
   - Service account ID: `phototag` (auto-generated)
   - Description: "Service account for Photo Tagging App"
   - Click "Create and Continue"
4. **Skip the optional steps** (Grant access, Grant users access) and click "Done"

## 📥 **Step 3: Create and Download Service Account Key**

1. **Click on the service account you just created**
2. **Go to the "Keys" tab**
3. **Click "Add Key" > "Create new key"**
4. **Select "JSON" format**
5. **Click "Create"** - This will download a JSON file containing your credentials

## 📋 **Step 4: Extract Service Account Credentials**

Open the downloaded JSON file. You'll need these values:

- **`client_email`**: The service account email (e.g., `phototag@phototag-476119.iam.gserviceaccount.com`)
- **`private_key`**: The private key (starts with `-----BEGIN PRIVATE KEY-----`)

## 📁 **Step 5: Create Google Drive File**

**IMPORTANT**: Service Accounts don't have storage quota, so you must use an existing file created by a human user.

1. **Go to Google Drive**: https://drive.google.com/
2. **Create a new file** named `phototag-tags.json` (or `phototags-data` if you prefer)
3. **Open the file** and copy the **File ID** from the URL:
   - URL format: `https://drive.google.com/file/d/FILE_ID_HERE/view`
   - The FILE_ID is the long string after `/d/` and before `/view`
4. **Share the file with the Service Account**:
   - Click "Share" button
   - Add the Service Account email (from Step 4) as an **Editor**
   - **IMPORTANT**: "Everyone" permissions may not work - you must explicitly add the Service Account email
   - Click "Done"

## 🔒 **Step 6: Prepare Private Key**

You have two options for the private key:

### Option A: Base64-encoded (Recommended for Render)

1. **Base64-encode the entire private key**:
   ```bash
   cat service-account-key.json | jq -r '.private_key' | base64
   ```
   Or use an online base64 encoder: https://www.base64encode.org/
   - Copy the entire private key (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - Encode it to base64
   - Copy the result

### Option B: Plain text with escaped newlines

Use the private key directly, but ensure newlines are properly escaped:
- The key should start with `-----BEGIN PRIVATE KEY-----`
- Each `\n` should remain as `\n` (not converted to actual newlines)
- The key should end with `-----END PRIVATE KEY-----`

## 🌐 **Step 7: Configure Environment Variables**

Add these environment variables to your deployment platform (Render) and local `.env.local`:

```bash
# Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL=phototag@phototag-476119.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64=YOUR_BASE64_ENCODED_KEY_HERE

# OR use plain text (if using Option B):
# GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_CONTENT\n-----END PRIVATE KEY-----\n"

# Google Drive Configuration
GOOGLE_FOLDER_ID=your_folder_id_here
GOOGLE_DRIVE_FILE_ID=your_file_id_here
```

**Notes:**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: The service account email from the JSON file
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64`: The base64-encoded private key (Option A, recommended)
- `GOOGLE_FOLDER_ID`: Optional - the folder ID where you want to store files (from URL: `https://drive.google.com/drive/folders/FOLDER_ID`)
- `GOOGLE_DRIVE_FILE_ID`: **Required** - The file ID of the `phototag-tags.json` file you created and shared (from Step 5)

## 🚀 **Step 8: Deploy to Render**

1. **Go to Render dashboard**
2. **Create new Web Service** (or update existing)
3. **Connect your GitHub repository**
4. **Configure as Docker service**
5. **Add environment variables** in Render dashboard:
   - Go to your service settings > "Environment"
   - Add each environment variable from Step 7
   - Make sure to use the **exact values** (no extra spaces or quotes)
6. **Deploy!**

## 🔍 **Step 9: Verify Setup**

1. **Open your deployed app** (or local dev server)
2. **Visit the debug endpoint**: `http://your-app-url/api/debug/drive`
   - You should see `accessTokenOk: true`
   - You should see the file in the `files` array
3. **Add a test tag** in the app
4. **Check Google Drive** - the file should be updated
5. **Refresh the page** - tags should persist

## 🛠️ **Troubleshooting**

### Common Issues:

1. **"File not found: [FILE_ID]"**:
   - **Verify the file is shared**: Open the file in Google Drive, click "Share", and ensure the Service Account email is listed as Editor
   - **Check the file ID**: Make sure `GOOGLE_DRIVE_FILE_ID` matches the ID in the file URL
   - **Verify the scope**: The app uses `https://www.googleapis.com/auth/drive` scope (not `drive.file`)

2. **"No key or keyFile set"**:
   - **Check base64 encoding**: Ensure the key is properly base64-encoded
   - **Check environment variable name**: Use `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64` (not `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`)
   - **Verify key format**: The original key should start with `-----BEGIN PRIVATE KEY-----`

3. **"Service Accounts do not have storage quota"**:
   - **Solution**: You must use an existing file created by a human user
   - Create the file manually in Google Drive
   - Share it with the Service Account
   - Set `GOOGLE_DRIVE_FILE_ID` to that file's ID

4. **"Accessible files: []" (empty array)**:
   - **Check sharing**: The file must be explicitly shared with the Service Account email
   - **Verify scope**: The app should use `drive` scope (not `drive.file`)
   - **Check folder ID**: If using `GOOGLE_FOLDER_ID`, ensure the folder is also shared with the Service Account

5. **"UNAUTHENTICATED" or "Login Required"**:
   - **Verify Service Account email**: Check that `GOOGLE_SERVICE_ACCOUNT_EMAIL` matches the email in your JSON file
   - **Verify private key**: Ensure the key is correctly formatted and encoded
   - **Check authorization**: The Service Account must be authorized (this happens automatically)

### Testing Locally:

1. **Create `.env.local` file** in the project root:
   ```bash
   GOOGLE_SERVICE_ACCOUNT_EMAIL=phototag@phototag-476119.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64=YOUR_BASE64_KEY
   GOOGLE_FOLDER_ID=your_folder_id
   GOOGLE_DRIVE_FILE_ID=your_file_id
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Test the debug endpoint**: `http://localhost:3000/api/debug/drive`

## 📊 **Benefits of Service Account**

- ✅ **No user interaction required**: Perfect for server-side applications
- ✅ **Persistent**: Data survives container restarts
- ✅ **Secure**: Private key stored in environment variables
- ✅ **Reliable**: No token expiration issues
- ✅ **Simple**: No OAuth consent screen or refresh tokens needed

## 🔒 **Security Notes**

- **Never commit** the service account JSON file or private key to Git
- Store credentials securely in environment variables
- The Service Account only has access to files you explicitly share with it
- Use base64-encoding for private keys to avoid newline escaping issues
- Consider rotating Service Account keys periodically

## 🔄 **Migration from OAuth**

If you were previously using OAuth, you can switch to Service Account by:

1. Following Steps 1-7 above
2. Removing OAuth environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
3. Adding Service Account environment variables (from Step 7)
4. Restarting the application

---

**Need help?** Check the Google Drive API documentation: https://developers.google.com/drive/api
