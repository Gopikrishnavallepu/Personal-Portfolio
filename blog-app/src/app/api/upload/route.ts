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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const TARGET_DIR = path.join(ROOT_DIR, folder);
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    const savePath = path.join(TARGET_DIR, filename);
    
    // Save locally
    fs.writeFileSync(savePath, buffer);

    // Try uploading to GitHub if configured
    const accessToken = (session as any).accessToken;
    if (accessToken && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      try {
        await uploadToGitHub(
          accessToken,
          process.env.GITHUB_OWNER,
          process.env.GITHUB_REPO,
          `blog-posts/${folder}/${filename}`.replace('//', '/'),
          buffer.toString('utf-8'), // assuming text/markdown
          `Upload ${filename} via Velse`
        );
      } catch (err) {
        console.error("Failed to push to GitHub, but saved locally:", err);
      }
    }

    return NextResponse.json({ success: true, message: 'File uploaded successfully', filename });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
