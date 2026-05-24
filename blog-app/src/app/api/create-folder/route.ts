import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// The root of the Velse directory
const ROOT_DIR = path.resolve(process.cwd(), '../Blog-Data');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderName, parentFolder } = await request.json();

    if (!folderName || !folderName.trim()) {
      return NextResponse.json({ error: 'folderName is required' }, { status: 400 });
    }

    // Sanitize folder name
    const safeName = folderName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_');
    
    const targetDir = parentFolder
      ? path.join(ROOT_DIR, parentFolder, safeName)
      : path.join(ROOT_DIR, safeName);

    // Validate path is within ROOT_DIR
    const resolvedDir = path.resolve(targetDir);
    if (!resolvedDir.startsWith(ROOT_DIR)) {
      return NextResponse.json({ error: 'Invalid folder path' }, { status: 403 });
    }

    if (fs.existsSync(targetDir)) {
      return NextResponse.json({ error: 'Folder already exists' }, { status: 409 });
    }

    fs.mkdirSync(targetDir, { recursive: true });

    const relativePath = path.relative(ROOT_DIR, targetDir).replace(/\\/g, '/');

    return NextResponse.json({ success: true, path: relativePath, message: 'Folder created successfully' });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
