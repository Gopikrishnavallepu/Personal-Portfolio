import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadToGitHub } from "@/lib/github";

// The root of the Velse directory
const ROOT_DIR = path.resolve(process.cwd(), '../Blog-Data');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, folder, content } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    // Ensure the file has .md extension
    const safeName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    const targetDir = folder ? path.join(ROOT_DIR, folder) : ROOT_DIR;

    // Validate path is within ROOT_DIR
    const resolvedDir = path.resolve(targetDir);
    if (!resolvedDir.startsWith(ROOT_DIR)) {
      return NextResponse.json({ error: 'Invalid folder path' }, { status: 403 });
    }

    const fullPath = path.join(targetDir, safeName);

    // Default content with front-matter
    const defaultContent = content || `---
title: "${safeName.replace('.md', '').replace(/_/g, ' ')}"
date: "${new Date().toISOString().split('T')[0]}"
category: "${folder || 'General'}"
focus: "Guide"
---

# ${safeName.replace('.md', '').replace(/_/g, ' ')}

Start writing your content here...
`;

    // Try local fs operations, but don't fail if in a read-only environment like Vercel
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Don't overwrite existing files locally
      if (fs.existsSync(fullPath)) {
        return NextResponse.json({ error: 'File already exists locally' }, { status: 409 });
      }

      fs.writeFileSync(fullPath, defaultContent);
    } catch (fsError) {
      console.warn("Local file system write failed (expected in production):", fsError);
    }

    // Build relative path for the response
    const relativePath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

    // Try uploading to GitHub if configured
    const accessToken = (session as any).accessToken;
    if (accessToken && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      try {
        await uploadToGitHub(
          accessToken,
          process.env.GITHUB_OWNER,
          process.env.GITHUB_REPO,
          `Blog-Data/${relativePath}`,
          defaultContent,
          `Create ${safeName} via Velse`
        );
      } catch (err) {
        console.error("Failed to push to GitHub, but saved locally:", err);
      }
    }

    return NextResponse.json({ success: true, path: relativePath, message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
