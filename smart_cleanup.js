const fs = require('fs');
const path = require('path');

const BLOG_DATA = path.join('D:\\Personal-Portfolio', 'Blog-Data');

// 1. Delete redundant folders
const foldersToDelete = ['container-security', 'sample-post', 'posts'];
foldersToDelete.forEach(folder => {
  const p = path.join(BLOG_DATA, folder);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(`Deleted redundant folder: ${folder}`);
  }
});

// Helper to merge files
function mergeFiles(directory, sourceFiles, outputFilename, title) {
  let content = `---
title: "${title}"
date: "${new Date().toISOString().split('T')[0]}"
category: "${path.basename(directory)}"
---

# ${title}

`;
  let mergedCount = 0;
  for (const file of sourceFiles) {
    const fullPath = path.join(directory, file);
    if (fs.existsSync(fullPath)) {
      let fileContent = fs.readFileSync(fullPath, 'utf8');
      // Strip out any existing frontmatter so it doesn't break the merged file
      fileContent = fileContent.replace(/^---[\s\S]*?---\n/, '');
      content += `## ${file.replace('.md', '').replace(/_/g, ' ')}\n\n${fileContent}\n\n---\n\n`;
      fs.unlinkSync(fullPath); // delete original to remove duplicates
      mergedCount++;
    }
  }
  
  if (mergedCount > 0) {
    fs.writeFileSync(path.join(directory, outputFilename), content);
    console.log(`Merged ${mergedCount} files into ${outputFilename}`);
  }
}

// 2. Clean Interview_Prep
const interviewDir = path.join(BLOG_DATA, 'Interview_Prep');
if (fs.existsSync(interviewDir)) {
  // Delete the old dumb merged file
  const oldMerged = path.join(interviewDir, 'Interview_Prep_merged.md');
  if (fs.existsSync(oldMerged)) fs.unlinkSync(oldMerged);

  const partFiles = fs.readdirSync(interviewDir).filter(f => f.startsWith('Part') && f.endsWith('.md'));
  if (partFiles.length > 0) {
    // Sort logically
    partFiles.sort((a, b) => a.localeCompare(b));
    mergeFiles(interviewDir, partFiles, 'Comprehensive_SOC_Interview_Guide.md', 'Comprehensive SOC Interview Guide');
  }
}

// 3. Clean Cloud_Security_Guides
const cloudDir = path.join(BLOG_DATA, 'Cloud_Security_Guides');
if (fs.existsSync(cloudDir)) {
  const oldMerged = path.join(cloudDir, 'Cloud_Security_Guides_merged.md');
  if (fs.existsSync(oldMerged)) fs.unlinkSync(oldMerged);

  // Remove .docx if .md exists
  const files = fs.readdirSync(cloudDir);
  files.forEach(file => {
    if (file.endsWith('.docx')) {
      const mdEquivalent = file.replace('.docx', '.md');
      if (files.includes(mdEquivalent) || files.includes(mdEquivalent.toLowerCase())) {
        fs.unlinkSync(path.join(cloudDir, file));
        console.log(`Deleted duplicate docx: ${file}`);
      }
    }
  });

  // Merge CNAPP files
  const cnappFiles = files.filter(f => f.startsWith('CNAPP_') && f.endsWith('.md'));
  mergeFiles(cloudDir, cnappFiles, 'Comprehensive_CNAPP_Guide.md', 'Comprehensive CNAPP Guide');

  // Merge Playbooks/Study Guides
  const playbookFiles = [
    'Cloud_Security_Complete_Playbook.md',
    'Cloud_Security_Study_Guide.md',
    'Cloud_Security_Unified_Mastery_Guide.md',
    'Advanced_Cloud_Security_Study_Guide.md'
  ];
  mergeFiles(cloudDir, playbookFiles, 'Cloud_Security_Mastery_Playbook.md', 'Cloud Security Mastery Playbook');
}

// 4. Clean Container_K8s_Security
const k8sDir = path.join(BLOG_DATA, 'Container_K8s_Security');
if (fs.existsSync(k8sDir)) {
  const oldMerged = path.join(k8sDir, 'Container_K8s_Security_merged.md');
  if (fs.existsSync(oldMerged)) fs.unlinkSync(oldMerged);

  const files = fs.readdirSync(k8sDir);
  files.forEach(file => {
    if (file.endsWith('.docx')) fs.unlinkSync(path.join(k8sDir, file));
  });

  const k8sFiles = files.filter(f => (f.includes('K8s') || f.includes('Container') || f.includes('ECS') || f.includes('EKS')) && f.endsWith('.md') && f !== 'Container_K8s_Security_merged.md');
  mergeFiles(k8sDir, k8sFiles, 'Comprehensive_Container_K8s_Security.md', 'Comprehensive Container & K8s Security');
}

console.log("Cleanup and smart merging complete!");
