const fs = require('fs');
const path = require('path');

const targetBlogPosts = path.join('d:\\Personal-Portfolio', 'blog-posts');

if (!fs.existsSync(targetBlogPosts)) {
  console.log('No blog-posts directory found.');
  process.exit(0);
}

const categories = fs.readdirSync(targetBlogPosts);

categories.forEach(cat => {
  const catPath = path.join(targetBlogPosts, cat);
  if (fs.statSync(catPath).isDirectory()) {
    const files = fs.readdirSync(catPath).filter(f => f.endsWith('.md'));
    if (files.length > 1) {
      let mergedContent = `# ${cat} - Combined Guide\n\n`;
      let count = 0;
      files.forEach(file => {
        if (file === `${cat}_merged.md`) return; // Skip if already merged
        const content = fs.readFileSync(path.join(catPath, file), 'utf8');
        mergedContent += `## ${file}\n\n${content}\n\n---\n\n`;
        count++;
      });
      if (count > 0) {
        fs.writeFileSync(path.join(catPath, `${cat}_merged.md`), mergedContent);
        console.log(`Merged ${count} files into ${cat}_merged.md in ${cat}`);
      }
    }
  }
});

console.log('Merge complete.');
