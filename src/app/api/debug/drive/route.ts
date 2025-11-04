import { NextResponse } from 'next/server';
import GoogleDriveStorage from '@/lib/googleDrive';

export async function GET() {
  try {
    const driveStorage = new GoogleDriveStorage();
    const status = await driveStorage.debugStatus();
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


