import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// The root of the Velse directory
const ROOT_DIR = path.resolve(process.cwd(), '../Blog-Data');

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const fullPath = path.join(ROOT_DIR, filePath);
    
    // Security check to prevent directory traversal
    if (!fullPath.startsWith(ROOT_DIR)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (filePath.endsWith('.pdf')) {
      const buffer = fs.readFileSync(fullPath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${path.basename(fullPath)}"`,
        },
      });
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
