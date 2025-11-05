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
  fixedFileId?: string; // Optional: existing file to update
}

class GoogleDriveStorage {
  private auth: any;
  private drive: any;
  private config: GoogleDriveConfig;
  private fileId: string | null = null;

  constructor() {
    // Prefer base64 private key env to avoid newline escaping issues
    const saKeyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 || process.env.GOOGLE_SA_PRIVATE_KEY_BASE64 || '';
    let saKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_SA_PRIVATE_KEY || '';
    if (saKeyBase64) {
      try {
        saKey = Buffer.from(saKeyBase64, 'base64').toString('utf8');
      } catch {}
    }
    // Normalize quotes and newlines
    saKey = saKey.trim();
    if ((saKey.startsWith('"') && saKey.endsWith('"')) || (saKey.startsWith("'") && saKey.endsWith("'"))) {
      saKey = saKey.slice(1, -1);
    }
    saKey = saKey.replace(/\\n/g, '\n');

    this.config = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SA_EMAIL || '',
      serviceAccountPrivateKey: saKey,
      folderId: process.env.GOOGLE_FOLDER_ID || '',
      fixedFileId: (process.env.GOOGLE_DRIVE_FILE_ID || process.env.GOOGLE_FILE_ID || '').trim() || undefined,
    };

    // Only initialize if we have all required credentials
    if (this.isConfigured()) {
      this.initializeAuth();
    }
  }

  // List files accessible to the Service Account
  public async listFiles(): Promise<{ id: string; name: string; mimeType: string }[]> {
    if (!this.isConfigured() || !this.drive) {
      return [];
    }

    try {
      // List files in the configured folder
      const response = await this.drive.files.list({
        q: this.config.folderId 
          ? `'${this.config.folderId}' in parents and trashed=false`
          : 'trashed=false',
        fields: 'files(id, name, mimeType)',
        pageSize: 50,
      });

      return (response.data.files || []).map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType || 'unknown',
      }));
    } catch (error: any) {
      console.error('Error listing files:', error?.response?.data || error?.message || error);
      return [];
    }
  }

  // Expose minimal debug information safely (no secrets)
  public async debugStatus(): Promise<{ 
    isServiceAccountConfigured: boolean; 
    isOAuthConfigured: boolean; 
    folderIdSet: boolean; 
    authType: 'service_account' | 'oauth' | 'none';
    accessTokenOk: boolean; 
    message?: string;
    diagnostics?: {
      saEmailPresent: boolean;
      saKeyLength: number;
    }
  }> {
    const sa = this.isServiceAccountConfigured();
    const oa = this.isOAuthConfigured();
    const authType = sa ? 'service_account' : (oa ? 'oauth' : 'none');
    let accessTokenOk = false;
    let message: string | undefined;
    try {
      if (this.auth && typeof this.auth.getAccessToken === 'function') {
        const tokenResp = await this.auth.getAccessToken();
        if (typeof tokenResp === 'string') {
          accessTokenOk = tokenResp.length > 0;
        } else if (tokenResp && typeof tokenResp === 'object') {
          const token = (tokenResp as any).token || (tokenResp as any).access_token;
          accessTokenOk = !!token;
        }
      } else if (this.auth && typeof this.auth.authorize === 'function') {
        await this.auth.authorize();
        accessTokenOk = true;
      }
    } catch (e: any) {
      message = e?.response?.data || e?.message || String(e);
    }

    return {
      isServiceAccountConfigured: sa,
      isOAuthConfigured: oa,
      folderIdSet: !!this.config.folderId,
      authType,
      accessTokenOk,
      message,
      diagnostics: {
        saEmailPresent: !!this.config.serviceAccountEmail,
        saKeyLength: this.config.serviceAccountPrivateKey ? this.config.serviceAccountPrivateKey.length : 0,
        saKeyStartsWithBegin: this.config.serviceAccountPrivateKey ? this.config.serviceAccountPrivateKey.includes('-----BEGIN PRIVATE KEY-----') : false,
        saKeyEndsWithEnd: this.config.serviceAccountPrivateKey ? this.config.serviceAccountPrivateKey.trim().endsWith('-----END PRIVATE KEY-----') : false,
      }
    };
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
      // Prefer Service Account when available (object-based constructor)
      this.auth = new google.auth.JWT({
        email: this.config.serviceAccountEmail,
        key: this.config.serviceAccountPrivateKey,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
      // Ensure we obtain an access token before using the client
      this.auth.authorize().catch((e: any) => {
        console.error('Service Account authorize() failed:', e?.response?.data || e?.message || e);
      });
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      console.log('Initialized Google Drive with Service Account:', this.config.serviceAccountEmail);
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
        // Prefer fixed file ID when provided (shared by a human account)
        if (this.config.fixedFileId) {
          this.fileId = this.config.fixedFileId.trim();
          console.log('Using fixed Google Drive file ID for updates:', this.fileId, 'Length:', this.fileId.length);
        }
      }

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
        // Create new file – may fail for Service Accounts without shared drive quota
        try {
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
        } catch (createErr: any) {
          // Surface clear guidance for SA quota limitations
          const createMsg = createErr?.response?.data || createErr?.message || String(createErr);
          throw new Error(`Drive create failed. If using a Service Account, either:
 - Use a Shared Drive and add the Service Account as Content manager, or
 - Create an empty phototag-tags.json in your Drive, share with the Service Account (Editor), and set GOOGLE_DRIVE_FILE_ID to its ID.
Original error: ${typeof createMsg === 'string' ? createMsg : JSON.stringify(createMsg)}`);
        }
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
        // Use fixed file ID if provided
        if (this.config.fixedFileId) {
          this.fileId = this.config.fixedFileId.trim();
          console.log('Using fixed Google Drive file ID for load:', this.fileId, 'Length:', this.fileId.length, 'First char:', this.fileId.charCodeAt(0), 'Last char:', this.fileId.charCodeAt(this.fileId.length - 1));
          
          // Verify file exists and is accessible before trying to load
          try {
            const verifyResponse = await this.drive.files.get({
              fileId: this.fileId,
              fields: 'id, name, permissions',
            });
            console.log('File verified:', { id: verifyResponse.data.id, name: verifyResponse.data.name });
          } catch (verifyError: any) {
            const verifyDetails = verifyError?.response?.data || verifyError?.message || verifyError;
            console.error('File verification failed:', verifyDetails);
            console.error('Service Account email:', this.config.serviceAccountEmail);
            console.error('IMPORTANT: The file must be explicitly shared with the Service Account email above as Editor.');
            console.error('"Everyone" permissions may not work for Service Accounts. You must:');
            console.error('1. Open the file in Google Drive');
            console.error('2. Click "Share"');
            console.error(`3. Add "${this.config.serviceAccountEmail}" as Editor`);
            console.error('4. Make sure the file is NOT in a Shared Drive (or add Service Account to Shared Drive)');
            
            // Try to list files to see what the Service Account can access
            try {
              console.log('Attempting to list accessible files...');
              const listResponse = await this.drive.files.list({
                q: `name='phototag-tags.json' and trashed=false`,
                fields: 'files(id, name, permissions)',
                pageSize: 10,
              });
              console.log('Accessible files:', listResponse.data.files);
              if (!listResponse.data.files || listResponse.data.files.length === 0) {
                console.error('Service Account cannot see ANY files. This confirms the file is not shared with the Service Account.');
              }
            } catch (listError: any) {
              console.error('Could not list files:', listError?.response?.data || listError?.message || listError);
            }
            
            throw verifyError;
          }
        }
      }

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
