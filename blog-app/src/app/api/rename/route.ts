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

    const { oldPath, newName } = await request.json();

    if (!oldPath || !newName) {
      return NextResponse.json({ error: 'oldPath and newName are required' }, { status: 400 });
    }



    const fullOldPath = path.join(ROOT_DIR, oldPath);
    if (!fullOldPath.startsWith(ROOT_DIR)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    if (!fs.existsSync(fullOldPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Determine the directory of the old file
    const dir = path.dirname(fullOldPath);
    
    // Ensure the new name has the same extension if the old one had it
    let finalNewName = newName;
    const oldExt = path.extname(fullOldPath);
    if (oldExt && !finalNewName.endsWith(oldExt)) {
        finalNewName += oldExt;
    }

    const fullNewPath = path.join(dir, finalNewName);

    // Write the new name
    fs.renameSync(fullOldPath, fullNewPath);

    return NextResponse.json({ success: true, newPath: path.relative(ROOT_DIR, fullNewPath).replace(/\\/g, '/') });
  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 });
  }
}
