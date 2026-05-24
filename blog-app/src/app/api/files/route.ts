import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// The root of the Velse directory
const ROOT_DIR = path.resolve(process.cwd(), '../blog-posts');

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

function buildFileTree(dir: string, currentPath: string = ''): FileNode[] {
  const result: FileNode[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'blog-app' || entry.name === 'PDF_Exports' || entry.name === '_build') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(currentPath, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      const children = buildFileTree(fullPath, relativePath);
      if (children.length > 0) {
        result.push({
          name: entry.name,
          path: relativePath,
          isDirectory: true,
          children,
        });
      }
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.pdf')) {
      result.push({
        name: entry.name,
        path: relativePath,
        isDirectory: false,
      });
    }
  }

  return result;
}

export async function GET() {
  try {
    const tree = buildFileTree(ROOT_DIR);

    // Generate flat list for next/prev navigation
    const flatList: string[] = [];
    const flatten = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.isDirectory) {
          if (node.children) flatten(node.children);
        } else {
          flatList.push(node.path);
        }
      }
    };
    flatten(tree);

    return NextResponse.json({ tree, flatList });
  } catch (error) {
    console.error('Error reading files:', error);
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
  }
}
