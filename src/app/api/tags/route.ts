import { NextRequest, NextResponse } from 'next/server';
import GoogleDriveStorage from '@/lib/googleDrive';

// Initialize Google Drive storage
const driveStorage = new GoogleDriveStorage();

// GET /api/tags - Load tags from Google Drive
export async function GET() {
  try {
    const tags = await driveStorage.loadTags();
    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error('Error loading tags from Google Drive:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load tags from Google Drive' },
      { status: 500 }
    );
  }
}

// POST /api/tags - Save tags to Google Drive
export async function POST(request: NextRequest) {
  try {
    const { tags } = await request.json();
    
    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { success: false, error: 'Tags must be an array' },
        { status: 400 }
      );
    }

    const success = await driveStorage.saveTags(tags);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Tags saved successfully to Google Drive',
        lastUpdated: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save tags to Google Drive' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving tags to Google Drive:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save tags to Google Drive' },
      { status: 500 }
    );
  }
}
