# Deployment Guide - Photo Tagging App

This guide covers deploying the Photo Tagging App using Docker and Render.

## 🐳 Docker Setup

### Prerequisites
- Docker installed on your system
- Git repository with the application code

### Local Docker Testing

1. **Build the Docker image:**
   ```bash
   docker build -t phototag-app .
   ```

2. **Run the container locally:**
   ```bash
   docker run -d -p 3000:3000 --name phototag-app phototag-app
   ```

3. **Test the application:**
   - Open http://localhost:3000 in your browser
   - The application should load with the photo tagging interface

4. **Stop and clean up:**
   ```bash
   docker stop phototag-app
   docker rm phototag-app
   ```

### Docker Compose (Alternative)

You can also use Docker Compose for easier management:

```bash
docker-compose up -d
```

This will:
- Build the image
- Start the container on port 3000
- Set up proper environment variables

## 🚀 Render Deployment

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add Docker configuration for deployment"
   git push origin main
   ```

2. **Verify all files are included:**
   - `Dockerfile`
   - `docker-compose.yml`
   - `.dockerignore`
   - `next.config.ts` (with standalone output)
   - All source code

### Step 2: Deploy to Render

1. **Create a Render account:**
   - Go to https://render.com
   - Sign up or log in with your GitHub account

2. **Create a new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your Photo Tagging App

3. **Configure the service:**
   - **Name:** `phototag-app` (or your preferred name)
   - **Runtime:** `Docker`
   - **Build Command:** (leave empty - Docker will handle this)
   - **Start Command:** (leave empty - Docker will handle this)
   - **Port:** `3000`

4. **Environment Variables:**
   - `NODE_ENV=production`
   - `PORT=3000`

5. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

### Step 3: Verify Deployment

1. **Check the build logs:**
   - Monitor the build process in the Render dashboard
   - Ensure the build completes successfully

2. **Test the application:**
   - Visit the provided Render URL
   - Verify the photo tagging interface loads correctly
   - Test adding, editing, and deleting tags
   - Test the download/upload functionality

## 🔧 Configuration Details

### Docker Configuration

The `Dockerfile` is optimized for production deployment:

- **Base Image:** Node.js 20 Alpine (lightweight and secure)
- **Multi-stage Build:** Separates dependencies, build, and runtime
- **Security:** Runs as non-root user (`nextjs`)
- **Performance:** Uses Next.js standalone output for smaller image size
- **Port:** Exposes port 3000 as required

### Persistent Storage

The application supports two storage methods:

1. **Google Drive Storage (Recommended for Production)**:
   - Persistent across container restarts
   - Accessible from anywhere
   - Automatic backup
   - Multi-user collaboration
   - See `GOOGLE_DRIVE_SETUP.md` for detailed setup

2. **Local Storage (Fallback)**:
   - Works without external configuration
   - Data lost on container restart
   - Good for development/testing

### Next.js Configuration

The `next.config.ts` includes:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};
```

- **Standalone Output:** Creates a self-contained application
- **Unoptimized Images:** Ensures compatibility with static hosting

### Environment Variables

**Required for all deployments:**
- `NODE_ENV=production`
- `PORT=3000`
- `NEXT_TELEMETRY_DISABLED=1` (optional, for privacy)

**Required for Google Drive storage (recommended):**
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
- `GOOGLE_REFRESH_TOKEN` - Your Google OAuth refresh token
- `GOOGLE_FOLDER_ID` - Your Google Drive folder ID

**Note:** If Google Drive credentials are not provided, the app will use local storage (data will be lost on container restart).

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures:**
   - Ensure Node.js 20+ is used (Next.js 16 requirement)
   - Check that all dependencies are properly installed
   - Verify TypeScript configuration

2. **Port Issues:**
   - Ensure port 3000 is correctly exposed
   - Check that no other services are using the port

3. **Image Loading:**
   - Verify the image file is in the `public` directory
   - Check that the image path is correct in the code

4. **Render Deployment Issues:**
   - Check build logs for specific error messages
   - Ensure the repository is properly connected
   - Verify environment variables are set correctly

### Performance Optimization

The application is already optimized with:
- React `useCallback` and `useMemo` hooks
- Image optimization with blur placeholders
- Efficient state management
- Minimal re-renders

## 📋 Deployment Checklist

Before deploying to Render:

- [ ] Docker image builds successfully locally
- [ ] Application runs correctly in Docker container
- [ ] All features work (tagging, editing, downloading, uploading)
- [ ] Code is pushed to GitHub repository
- [ ] Render service is configured with correct settings
- [ ] Environment variables are set
- [ ] Build completes without errors
- [ ] Application is accessible via Render URL

## 🔄 Updates and Maintenance

### Updating the Application

1. **Make changes to your code**
2. **Test locally with Docker:**
   ```bash
   docker build -t phototag-app .
   docker run -d -p 3000:3000 phototag-app
   ```
3. **Push changes to GitHub:**
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   ```
4. **Render will automatically redeploy**

### Monitoring

- Check Render dashboard for deployment status
- Monitor application logs for any issues
- Test functionality after each deployment

## 📞 Support

If you encounter issues:

1. Check the Render build logs
2. Test the Docker image locally
3. Verify all configuration files are correct
4. Ensure all dependencies are properly specified

The application is now ready for production deployment on Render! 🎉
