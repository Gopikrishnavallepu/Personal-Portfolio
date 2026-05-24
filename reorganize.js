const fs = require('fs');
const path = require('path');

const root = 'd:\\Personal-Portfolio';
const sourceBlogData = path.join(root, 'Blog-Data');
const sourcePosts = path.join(root, 'posts');
const targetBlogPosts = path.join(root, 'blog-posts');

if (!fs.existsSync(targetBlogPosts)) {
  fs.mkdirSync(targetBlogPosts, { recursive: true });
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    // Only copy md and pdf files, skip other extensions if not needed
    if (src.endsWith('.md') || src.endsWith('.pdf')) {
      fs.copyFileSync(src, dest);
    }
  }
}

// Copy from Blog-Data (excluding blog-app itself)
if (fs.existsSync(sourceBlogData)) {
  const categories = fs.readdirSync(sourceBlogData);
  categories.forEach(cat => {
    if (cat === 'blog-app') return;
    const src = path.join(sourceBlogData, cat);
    if (fs.statSync(src).isDirectory()) {
      copyRecursiveSync(src, path.join(targetBlogPosts, cat));
    }
  });
}

// Copy from posts
if (fs.existsSync(sourcePosts)) {
  const categories = fs.readdirSync(sourcePosts);
  categories.forEach(cat => {
    const src = path.join(sourcePosts, cat);
    if (fs.statSync(src).isDirectory()) {
      copyRecursiveSync(src, path.join(targetBlogPosts, cat));
    }
  });
}

console.log('Restructuring complete.');
