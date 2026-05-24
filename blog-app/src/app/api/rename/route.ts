import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { renameInGitHub } from "@/lib/github";

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

    // Determine the directory of the old file
    const dir = path.dirname(fullOldPath);
    
    // Ensure the new name has the same extension if the old one had it
    let finalNewName = newName;
    const oldExt = path.extname(fullOldPath);
    if (oldExt && !finalNewName.endsWith(oldExt)) {
        finalNewName += oldExt;
    }

    const fullNewPath = path.join(dir, finalNewName);
    const newRelativePath = path.relative(ROOT_DIR, fullNewPath).replace(/\\/g, '/');

    try {
      if (fs.existsSync(fullOldPath)) {
        // Write the new name locally
        fs.renameSync(fullOldPath, fullNewPath);
      }
    } catch (fsError) {
      console.warn("Local file system rename failed (expected in production):", fsError);
    }

    // Try renaming in GitHub if configured
    const accessToken = (session as any).accessToken;
    if (accessToken && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      try {
        await renameInGitHub(
          accessToken,
          process.env.GITHUB_OWNER,
          process.env.GITHUB_REPO,
          `Blog-Data/${oldPath}`,
          `Blog-Data/${newRelativePath}`,
          `Rename ${oldPath} to ${newRelativePath} via Velse Editor`
        );
      } catch (err) {
        console.error("Failed to rename in GitHub, but processed locally:", err);
      }
    }

    return NextResponse.json({ success: true, newPath: newRelativePath });
  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 });
  }
}
