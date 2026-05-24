import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth/next";
import { uploadToGitHub } from "@/lib/github";

// The root of the Velse directory
const ROOT_DIR = path.resolve(process.cwd(), '../blog-posts');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filePath, content } = await request.json();

    if (!filePath || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const fullPath = path.join(ROOT_DIR, filePath);

    if (!fullPath.startsWith(ROOT_DIR)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    fs.writeFileSync(fullPath, content);

    // Try uploading to GitHub if configured
    const accessToken = (session as any).accessToken;
    if (accessToken && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      try {
        await uploadToGitHub(
          accessToken,
          process.env.GITHUB_OWNER,
          process.env.GITHUB_REPO,
          `blog-posts/${filePath}`,
          content,
          `Update ${filePath} via Velse Editor`
        );
      } catch (err) {
        console.error("Failed to push to GitHub, but saved locally:", err);
      }
    }

    return NextResponse.json({ success: true, message: 'File saved successfully' });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}
