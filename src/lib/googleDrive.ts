import { google } from 'googleapis';

interface GoogleDriveConfig {
  // OAuth (legacy)
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  // Service Account
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
  // Common
  folderId: string;
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
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SA_EMAIL || '',
      serviceAccountPrivateKey: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_SA_PRIVATE_KEY || '')
        // Render and many hosts store newlines escaped; fix formatting
        .replace(/\\n/g, '\n'),
      folderId: process.env.GOOGLE_FOLDER_ID || '',
    };

    // Only initialize if we have all required credentials
    if (this.isConfigured()) {
      this.initializeAuth();
    }
  }

  private isConfigured(): boolean {
    return this.isServiceAccountConfigured() || this.isOAuthConfigured();
  }

  private isServiceAccountConfigured(): boolean {
    return !!(this.config.serviceAccountEmail && this.config.serviceAccountPrivateKey && this.config.folderId);
  }

  private isOAuthConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret && this.config.refreshToken && this.config.folderId);
  }

  private initializeAuth() {
    if (this.isServiceAccountConfigured()) {
      // Prefer Service Account when available
      const scopes = ['https://www.googleapis.com/auth/drive.file'];
      this.auth = new google.auth.JWT(
        this.config.serviceAccountEmail,
        undefined,
        this.config.serviceAccountPrivateKey,
        scopes
      );
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      console.log('Initialized Google Drive with Service Account');
    } else if (this.isOAuthConfigured()) {
      // Fallback to OAuth client credentials
      this.auth = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      this.auth.setCredentials({
        refresh_token: this.config.refreshToken,
      });

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      console.log('Initialized Google Drive with OAuth client');
    } else {
      throw new Error('Google Drive not configured');
    }
  }

  async saveTags(tags: any[]): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Google Drive not configured, using fallback storage');
      return this.fallbackSave(tags);
    }

    try {
      console.log('Saving tags to Google Drive...', { tagsCount: tags.length, folderId: this.config.folderId });
      
      const dataToSave = {
        tags,
        lastUpdated: new Date().toISOString(),
        version: 1
      };

      const jsonString = JSON.stringify(dataToSave, null, 2);

      if (!this.fileId) {
        // Attempt to find existing file first to avoid duplicates across serverless instances
        try {
          const search = await this.drive.files.list({
            q: `name='phototag-tags.json' and parents in '${this.config.folderId}' and trashed=false`,
            fields: 'files(id, name)',
          });
          if (search.data.files && search.data.files.length > 0) {
            this.fileId = search.data.files[0].id;
            console.log('Found existing file to update:', this.fileId);
          }
        } catch (searchError) {
          console.warn('Could not search for existing file before save, will fallback to create:', searchError);
        }
      }

      if (this.fileId) {
        // Update existing file
        await this.drive.files.update({
          fileId: this.fileId,
          media: {
            mimeType: 'application/json',
            body: jsonString,
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
            body: jsonString,
          },
        });
        this.fileId = response.data.id;
        console.log('File created in Google Drive:', this.fileId);
      }

      console.log('Successfully saved to Google Drive');
      return true;
    } catch (error: any) {
      const details = error?.response?.data || error?.message || error;
      console.error('Error saving to Google Drive:', details);
      // Propagate detailed error so API can surface it to the client
      const message = typeof details === 'string' ? details : JSON.stringify(details);
      throw new Error(message);
    }
  }

  async loadTags(): Promise<any[]> {
    if (!this.isConfigured()) {
      console.warn('Google Drive not configured, using fallback storage');
      return this.fallbackLoad();
    }

    try {
      console.log('Loading tags from Google Drive...', { folderId: this.config.folderId });
      
      if (!this.fileId) {
        // Try to find existing file
        console.log('Searching for existing file in Google Drive...');
        const response = await this.drive.files.list({
          q: `name='phototag-tags.json' and parents in '${this.config.folderId}' and trashed=false`,
          fields: 'files(id, name)',
        });

        console.log('Search results:', response.data.files);
        
        if (response.data.files && response.data.files.length > 0) {
          this.fileId = response.data.files[0].id;
          console.log('Found existing file:', this.fileId);
        } else {
          console.log('No existing file found, returning empty array');
          return [];
        }
      }

      // Download file content
      const response = await this.drive.files.get({
        fileId: this.fileId,
        alt: 'media',
      });

      console.log('Google Drive response:', typeof response.data, response.data);
      
      // Handle different response formats
      let content: string;
      if (typeof response.data === 'string') {
        content = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's already parsed, use it directly
        const parsedData = response.data;
        console.log('Using parsed data directly:', parsedData);
        return Array.isArray(parsedData) ? parsedData : parsedData.tags || [];
      } else {
        content = JSON.stringify(response.data);
      }
      
      console.log('Content to parse:', content);
      const parsedData = JSON.parse(content);
      
      // Handle both old format (array) and new format (object with tags property)
      return Array.isArray(parsedData) ? parsedData : parsedData.tags || [];
    } catch (error: any) {
      const details = error?.response?.data || error?.message || error;
      console.error('Error loading from Google Drive:', details);
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
