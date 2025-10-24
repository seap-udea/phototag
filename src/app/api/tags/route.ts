import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const TAGS_FILE = path.join(process.cwd(), 'data', 'tags.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// GET /api/tags - Load tags from disk
export async function GET() {
  try {
    await ensureDataDirectory();
    
    try {
      const data = await fs.readFile(TAGS_FILE, 'utf8');
      const parsedData = JSON.parse(data);
      // Handle both old format (array) and new format (object with tags property)
      const tags = Array.isArray(parsedData) ? parsedData : parsedData.tags || [];
      return NextResponse.json({ success: true, tags });
    } catch (error) {
      // File doesn't exist yet, return empty array
      return NextResponse.json({ success: true, tags: [] });
    }
  } catch (error) {
    console.error('Error loading tags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load tags' },
      { status: 500 }
    );
  }
}

// POST /api/tags - Save tags to disk
export async function POST(request: NextRequest) {
  try {
    await ensureDataDirectory();
    
    const { tags } = await request.json();
    
    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { success: false, error: 'Tags must be an array' },
        { status: 400 }
      );
    }

    // Add timestamp for when tags were saved
    const dataToSave = {
      tags,
      lastUpdated: new Date().toISOString(),
      version: 1
    };

    await fs.writeFile(TAGS_FILE, JSON.stringify(dataToSave, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tags saved successfully',
      lastUpdated: dataToSave.lastUpdated
    });
  } catch (error) {
    console.error('Error saving tags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save tags' },
      { status: 500 }
    );
  }
}
