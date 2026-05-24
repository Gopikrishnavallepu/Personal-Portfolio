import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// The root of the Velse directory
const ROOT_DIR = path.resolve(process.cwd(), '../blog-posts');

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface PostItem {
  title: string;
  date: string;
  category: string;
  focus: string;
  excerpt: string;
  path: string;
  type: 'md' | 'pdf';
}

const CATEGORY_MAP: Record<string, string> = {
  'Cloud_Security_Guides': 'CloudSecurity',
  'Container_K8s_Security': 'DevSecOps',
  'Data_Analytics': 'DataAnalytics',
  'Interview_Prep': 'InterviewPrep',
  'container-security': 'DevSecOps',
  'sample-post': 'DevSecOps'
};

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

function getPostsList(dir: string, currentPath: string = ''): PostItem[] {
  const posts: PostItem[] = [];
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'blog-app' || entry.name === 'PDF_Exports' || entry.name === '_build' || entry.name === 'INDEX.md') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(currentPath, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      posts.push(...getPostsList(fullPath, relativePath));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.pdf')) {
      const stats = fs.statSync(fullPath);
      const dateStr = stats.mtime.toISOString().split('T')[0];
      
      const parentDir = path.basename(dir);
      const category = CATEGORY_MAP[parentDir] || parentDir || 'General';

      if (entry.name.endsWith('.pdf')) {
        posts.push({
          title: entry.name.replace('.pdf', '').replace(/_/g, ' '),
          date: dateStr,
          category,
          focus: 'PDF Guide',
          excerpt: `Reference manual in PDF format: ${entry.name}. Click to view or download.`,
          path: relativePath,
          type: 'pdf'
        });
      } else {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const parsed = matter(content);
          
          let title = parsed.data.title;
          if (!title) {
            const h1Match = parsed.content.match(/^#\s+(.+)$/m);
            title = h1Match ? h1Match[1].trim() : entry.name.replace('.md', '').replace(/_/g, ' ');
          }

          title = title.replace(/[\*\_`#]/g, '');

          const fileCategory = parsed.data.category || category;
          const focus = parsed.data.focus || (entry.name.toLowerCase().includes('checklist') ? 'Checklist' : entry.name.toLowerCase().includes('guide') ? 'Study Guide' : 'Cheat Sheet');

          let excerpt = parsed.data.excerpt || parsed.data.description;
          if (!excerpt) {
            const cleanContent = parsed.content
              .replace(/^#+\s+.+$/gm, '')
              .replace(/>\s*/g, '')
              .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
              .replace(/[\*\_`]/g, '')
              .trim();
            excerpt = cleanContent.substring(0, 180).trim();
            if (cleanContent.length > 180) excerpt += '...';
          }

          posts.push({
            title,
            date: parsed.data.date || dateStr,
            category: fileCategory,
            focus,
            excerpt: excerpt || 'No description available.',
            path: relativePath,
            type: 'md'
          });
        } catch (err) {
          console.error(`Error parsing file ${entry.name}:`, err);
        }
      }
    }
  }

  return posts;
}

export async function GET() {
  try {
    const tree = buildFileTree(ROOT_DIR);
    const posts = getPostsList(ROOT_DIR);
    
    // Sort posts by date descending
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

    return NextResponse.json({ tree, flatList, posts });
  } catch (error) {
    console.error('Error reading files:', error);
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
  }
}
