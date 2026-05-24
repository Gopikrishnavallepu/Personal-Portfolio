import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { mdToPdf } from 'md-to-pdf';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// The root of the Velse directory
const ROOT_DIR = path.resolve(process.cwd(), '../Blog-Data');
const PDF_DIR = path.join(ROOT_DIR, 'PDF_Exports');

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

    if (!fullPath.startsWith(ROOT_DIR) || !fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Invalid or missing file' }, { status: 404 });
    }

    if (!fs.existsSync(PDF_DIR)) {
      fs.mkdirSync(PDF_DIR, { recursive: true });
    }

    const relativePath = path.relative(ROOT_DIR, fullPath);
    const destFile = path.join(PDF_DIR, relativePath).replace(/\.md$/, '.pdf');
    const destFileDir = path.dirname(destFile);

    if (!fs.existsSync(destFileDir)) {
      fs.mkdirSync(destFileDir, { recursive: true });
    }

    await mdToPdf({ path: fullPath }, { dest: destFile });

    // Let's read the generated PDF to send it back
    const pdfBuffer = fs.readFileSync(destFile);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${path.basename(destFile)}"`,
      },
    });

  } catch (error) {
    console.error('Error converting file to PDF:', error);
    return NextResponse.json({ error: 'Failed to convert file' }, { status: 500 });
  }
}
