# DevSecOps Blog Setup & Quick Start Guide

Your Flask-based personal blog is **fully functional** and ready to deploy! Here's everything you need to know.

---

## 📋 What's Included

✅ **Flask development server** for local preview
✅ **Markdown-to-HTML renderer** with YAML front-matter support
✅ **Static site export** to GitHub Pages (`build/` directory)
✅ **Dark mode toggle** with localStorage persistence
✅ **Category filtering** on the blog index
✅ **Learning tracker cards** on each post (Activity, Tool/Concept, Status)
✅ **External links** (GitHub, Medium, Hashnode, Dev.to, Substack, Notion, GitBook)
✅ **Resume/CV page** (edit `resume.md`)
✅ **GitHub Actions workflow** for auto-deploy to `gh-pages`
✅ **Responsive design** (mobile-friendly)

---

## 🚀 Quick Start (Local Development)

### 1. Create virtual environment
```powershell
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies
```powershell
pip install -r requirements.txt
```

### 3. Run dev server
```powershell
python app.py
```
Open browser to **http://127.0.0.1:5000**

### 4. Write a new blog post
Create a new `.md` file in the `content/` folder:

**Example:** `content/2025-12-12-my-first-post.md`

```markdown
---
date: "2025-12-12T10:00:00+00:00"
month: "December"
week: 50
topic: "Learning SCA Tools"
category: "DevSecOps"
focus: "SCA/Tooling"
activity: "Set up Dependency-Check and run first scan"
key_task: "sca-setup"
tool_concept: "OWASP Dependency-Check"
status: "Published"
links:
  github: "https://github.com/yourusername/repo"
  medium: ""
  hashnode: ""
  devto: ""
  substack: ""
  notion: ""
  gitbook: ""
---

# Learning SCA Tools

First paragraph becomes the excerpt on the blog index.

## Goals

- Set up dependency scanning
- Learn the output format

## What I learned

Detailed content here...
```

**Front-matter fields** (all optional except `topic` and `date`):
- `date`: ISO date/time (e.g., `2025-12-12T10:00:00+00:00`)
- `topic`: Post title
- `category`: Category for filtering (e.g., "DevSecOps", "CloudSecurity")
- `focus`: Topic focus (e.g., "SCA/Automation")
- `activity`: Task/activity description
- `key_task`: Task identifier
- `tool_concept`: Key tools or concepts used
- `status`: `Published`, `Draft`, or `In Progress`
- `links`: Dictionary of external links (github, medium, hashnode, etc.)

### 5. Build static site
```powershell
python export.py
```

This generates `build/` with all static HTML. Open `build/index.html` in your browser to preview.

---

## 📝 How to Use Features

### **Dark Mode**
Click the 🌙 icon in the header. Your preference is saved in browser localStorage.

### **Category Filtering**
On the blog index, click category buttons to filter posts. "All" shows everything.

### **Excerpt Display**
The first paragraph of your post appears on the index (markdown syntax is stripped). The `excerpt` is extracted automatically.

### **Tracker Fields on Posts**
When you publish a post with `activity`, `tool_concept`, or `status` fields, they appear in a "Learning Tracker" card below the content.

### **External Links**
If you add links to your front-matter (GitHub, Medium, Hashnode, etc.), they appear as clickable buttons on the post.

### **Resume Page**
Edit `resume.md` to customize your resume. The `/resume` route renders it as a styled page.

---

## 🌐 Deploy to GitHub Pages

### **Option A: Using GitHub Actions (Recommended)**

1. **Create a GitHub repo** (e.g., `username/personal-blog`):
   ```powershell
   cd "d:\DEVOPS\DevSecOps  Projects\Personal Blog"
   git init
   git add .
   git commit -m "Initial commit: DevSecOps blog"
   git remote add origin https://github.com/username/personal-blog.git
   git branch -M main
   git push -u origin main
   ```

2. **In GitHub repo → Settings → Pages:**
   - Source: `Deploy from a branch`
   - Branch: `gh-pages` / `(root)`
   - Save

3. **Push changes anytime:**
   ```powershell
   git add .
   git commit -m "Update blog post"
   git push origin main
   ```
   The GitHub Action runs automatically and deploys to `https://username.github.io/personal-blog`

### **Option B: Manual Deployment**

1. **Build locally:**
   ```powershell
   python export.py
   ```

2. **Create orphan `gh-pages` branch and push `build/` contents:**
   ```powershell
   git checkout --orphan gh-pages
   git rm -rf .
   xcopy build\* . /E /I
   git add .
   git commit -m "Deploy static site"
   git push origin gh-pages --force
   git checkout main
   ```

3. **Configure Pages:**
   - Go to repo → Settings → Pages
   - Set branch to `gh-pages` (root)

---

## 📁 File Structure

```
Personal Blog/
├── app.py                      # Flask dev server
├── export.py                   # Static site generator
├── resume.md                   # Your resume (edit this)
├── requirements.txt            # Python dependencies
├── project_workflow.md         # Workflow documentation
├── README.md                   # Quick reference
├── .gitignore                  # Git ignore rules
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── content/                    # Your blog posts (.md files)
│   └── 2025-12-12-sample-post.md
├── templates/                  # Jinja2 HTML templates
│   ├── layout.html             # Base layout
│   ├── index.html              # Blog index
│   ├── post.html               # Single post page
│   └── resume.html             # Resume page
├── static/                     # CSS, JS, images
│   └── style.css               # Stylesheet (with dark mode)
└── build/                      # Generated static site (don't edit)
    ├── index.html
    ├── posts/
    ├── resume/
    └── static/
```

---

## ✏️ Common Tasks

### Add a new post
1. Create `content/YYYY-MM-DD-slug.md` with YAML front-matter
2. Run `python app.py` locally to preview
3. Set `status: Published` when ready
4. Run `python export.py` to regenerate the static site
5. Commit and push: `git add . && git commit -m "Add post" && git push origin main`

### Update resume
1. Edit `resume.md` (it's markdown)
2. Run `python export.py` to regenerate
3. Commit and push

### Customize styling
1. Edit `static/style.css`
2. The CSS uses CSS variables (`:root` and `[data-theme="dark"]`)
3. Changes appear immediately in dev server

### Add images
1. Create folder: `static/images/<post-slug>/`
2. Add your image: `static/images/<post-slug>/image.png`
3. In your markdown, reference: `![alt text](/static/images/<post-slug>/image.png)`

### Change colors/theme
Edit CSS variables in `static/style.css`:
```css
:root {
  --accent: #0a66c2;        /* Primary blue */
  --bg: #fff;                /* Light background */
  --fg: #111;                /* Dark text */
}

[data-theme="dark"] {
  --bg: #0d1117;             /* Dark background */
  --fg: #e6edf3;             /* Light text */
}
```

---

## 🔍 Troubleshooting

**Issue:** "ModuleNotFoundError: No module named 'frontmatter'"
- **Solution:** Activate venv and install deps: `. .\.venv\Scripts\Activate.ps1 && pip install -r requirements.txt`

**Issue:** Posts don't appear
- **Solution:** Check post YAML front-matter is valid (use `date: "YYYY-MM-DD..."` format)

**Issue:** Static site breaks when deployed
- **Solution:** Ensure `export.py` runs without errors locally. Check `build/` folder for generated files.

**Issue:** Dark mode not working
- **Solution:** Browser must support localStorage. Check browser console for JS errors.

---

## 📚 Next Steps

1. **Customize your resume** in `resume.md`
2. **Add your first posts** in `content/` folder
3. **Deploy to GitHub Pages** following Option A or B above
4. **Share your blog** at `https://username.github.io/personal-blog`

---

## 🎯 Learning Path (Suggested)

Use your blog to document your DevSecOps journey:

- **Week 1:** SCA tools (Dependency-Check, Snyk)
- **Week 2:** SAST integration (SonarQube, Checkmarx)
- **Week 3:** Container security (Trivy, Anchore)
- **Week 4:** IaC security (Terraform, CloudFormation)
- **Week 5:** Secret management (Vault, AWS Secrets Manager)

Log each topic with:
- `topic`: What you're learning
- `activity`: What you did
- `tool_concept`: Tool or concept
- `links`: Links to your code/articles

---

## Questions?

Refer to `project_workflow.md` for architecture and design decisions.

Happy blogging! 🚀
