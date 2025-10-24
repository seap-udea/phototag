import { google } from 'googleapis';

interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId: string;
  // Service account credentials
  serviceAccountEmail: string;
  privateKey: string;
}

class GoogleDriveStorage {
  private auth: any;
  private drive: any;
  private config: GoogleDriveConfig;
  private fileId: string | null = null;

  constructor() {
    this.config = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
      folderId: process.env.GOOGLE_FOLDER_ID || '',
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
      privateKey: process.env.GOOGLE_PRIVATE_KEY || '',
    };

    // Only initialize if we have all required credentials
    if (this.isConfigured()) {
      this.initializeAuth();
    }
  }

  private isConfigured(): boolean {
    // Check for OAuth credentials
    const hasOAuth = !!(
      this.config.clientId &&
      this.config.clientSecret &&
      this.config.refreshToken &&
      this.config.folderId
    );
    
    // Check for service account credentials
    const hasServiceAccount = !!(
      this.config.serviceAccountEmail &&
      this.config.privateKey &&
      this.config.folderId
    );
    
    return hasOAuth || hasServiceAccount;
  }

  private initializeAuth() {
    // Check if we have service account credentials
    if (this.config.serviceAccountEmail && this.config.privateKey) {
      // Use service account authentication
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: this.config.serviceAccountEmail,
          private_key: this.config.privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
    } else {
      // Use OAuth2 authentication
      this.auth = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      this.auth.setCredentials({
        refresh_token: this.config.refreshToken,
      });
    }

    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async saveTags(tags: any[]): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Google Drive not configured, using fallback storage');
      return this.fallbackSave(tags);
    }

    try {
      const dataToSave = {
        tags,
        lastUpdated: new Date().toISOString(),
        version: 1
      };

      const jsonString = JSON.stringify(dataToSave, null, 2);
      const buffer = Buffer.from(jsonString, 'utf8');

      if (this.fileId) {
        // Update existing file
        await this.drive.files.update({
          fileId: this.fileId,
          media: {
            mimeType: 'application/json',
            body: buffer,
          },
        });
      } else {
        // Create new file
        const response = await this.drive.files.create({
          requestBody: {
            name: 'phototag-tags.json',
            parents: [this.config.folderId],
          },
          media: {
            mimeType: 'application/json',
            body: buffer,
          },
        });
        this.fileId = response.data.id;
      }

      return true;
    } catch (error) {
      console.error('Error saving to Google Drive:', error);
      return this.fallbackSave(tags);
    }
  }

  async loadTags(): Promise<any[]> {
    if (!this.isConfigured()) {
      console.warn('Google Drive not configured, using fallback storage');
      return this.fallbackLoad();
    }

    try {
      if (!this.fileId) {
        // Try to find existing file
        const response = await this.drive.files.list({
          q: `name='phototag-tags.json' and parents in '${this.config.folderId}' and trashed=false`,
          fields: 'files(id, name)',
        });

        if (response.data.files && response.data.files.length > 0) {
          this.fileId = response.data.files[0].id;
        } else {
          return [];
        }
      }

      // Download file content
      const response = await this.drive.files.get({
        fileId: this.fileId,
        alt: 'media',
      });

      const content = response.data as string;
      const parsedData = JSON.parse(content);
      
      // Handle both old format (array) and new format (object with tags property)
      return Array.isArray(parsedData) ? parsedData : parsedData.tags || [];
    } catch (error) {
      console.error('Error loading from Google Drive:', error);
      return this.fallbackLoad();
    }
  }

  // Fallback to local storage when Google Drive is not configured
  private async fallbackSave(tags: any[]): Promise<boolean> {
    try {
      const { promises: fs } = await import('fs');
      const path = await import('path');
      
      const dataDir = path.join(process.cwd(), 'data');
      const tagsFile = path.join(dataDir, 'tags.json');
      
      // Ensure data directory exists
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }

      const dataToSave = {
        tags,
        lastUpdated: new Date().toISOString(),
        version: 1
      };

      await fs.writeFile(tagsFile, JSON.stringify(dataToSave, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving to fallback storage:', error);
      return false;
    }
  }

  private async fallbackLoad(): Promise<any[]> {
    try {
      const { promises: fs } = await import('fs');
      const path = await import('path');
      
      const tagsFile = path.join(process.cwd(), 'data', 'tags.json');
      
      const data = await fs.readFile(tagsFile, 'utf8');
      const parsedData = JSON.parse(data);
      
      // Handle both old format (array) and new format (object with tags property)
      return Array.isArray(parsedData) ? parsedData : parsedData.tags || [];
    } catch (error) {
      console.warn('No fallback data found, returning empty array');
      return [];
    }
  }
}

export default GoogleDriveStorage;
