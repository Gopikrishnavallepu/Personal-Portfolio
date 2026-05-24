import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { deleteFromGitHub } from "@/lib/github";

// The root of the Velse directory
const ROOT_DIR = path.resolve(process.cwd(), '../Blog-Data');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json({ error: 'filePath is required' }, { status: 400 });
    }


    const fullPath = path.join(ROOT_DIR, filePath);
    if (!fullPath.startsWith(ROOT_DIR)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (fsError) {
      console.warn("Local file system delete failed (expected in production):", fsError);
    }

    // Try deleting from GitHub if configured
    const accessToken = (session as any).accessToken;
    if (accessToken && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      try {
        await deleteFromGitHub(
          accessToken,
          process.env.GITHUB_OWNER,
          process.env.GITHUB_REPO,
          `Blog-Data/${filePath}`,
          `Delete ${filePath} via Velse Editor`
        );
      } catch (err) {
        console.error("Failed to delete from GitHub, but processed locally:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
