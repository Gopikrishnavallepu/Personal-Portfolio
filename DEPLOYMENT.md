# GitHub Pages Deployment Checklist & Instructions

This guide walks you step-by-step through deploying your DevSecOps blog to GitHub Pages.

---

## Pre-Deployment Checklist

Before you deploy, ensure:

- [ ] All posts in `content/` have `status: Published` (or leave blank for draft)
- [ ] Your `resume.md` is updated with your real information
- [ ] You've tested locally: `python app.py` and `python export.py` run without errors
- [ ] You have a GitHub account and have generated a personal access token (optional, for private repos)
- [ ] `git` is installed on your computer

---

## Step 1: Initialize Git Repository (First Time Only)

```powershell
cd "d:\DEVOPS\DevSecOps  Projects\Personal Blog"

# Initialize git
git init

# Configure your identity (use your real name and email)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: DevSecOps blog scaffold"
```

---

## Step 2: Create GitHub Repository

1. Go to **https://github.com/new**
2. Enter repository name: `personal-blog`
3. Choose "Private" or "Public" (your choice)
4. **Do NOT initialize with README, .gitignore, or license** (you already have these)
5. Click **Create repository**

You'll see a page with commands. Look for the HTTPS or SSH URL.

---

## Step 3: Connect Local Repo to GitHub

Replace `username` with your actual GitHub username:

```powershell
cd "d:\DEVOPS\DevSecOps  Projects\Personal Blog"

# Add GitHub as the remote
git remote add origin https://github.com/username/personal-blog.git

# Rename branch to 'main' (if using 'master')
git branch -M main

# Push everything to GitHub
git push -u origin main
```

You may be prompted to log in to GitHub. Use your username and personal access token (or password).

---

## Step 4: Enable GitHub Pages

1. Go to your GitHub repo: **https://github.com/username/personal-blog**
2. Click **Settings** (top right)
3. Click **Pages** (left sidebar)
4. Under "Build and deployment":
   - **Source**: Select `Deploy from a branch`
   - **Branch**: Select `gh-pages` from the dropdown, then `(root)`
   - Click **Save**

GitHub Pages is now active. The first deployment will happen when you push code.

---

## Step 5: Deploy with GitHub Actions

The GitHub Action workflow (`.github/workflows/deploy.yml`) runs automatically:

1. **On every push to `main` branch**, the action:
   - Sets up Python 3.x
   - Installs dependencies from `requirements.txt`
   - Runs `python export.py` to generate `build/`
   - Deploys the `build/` folder to the `gh-pages` branch
   - GitHub Pages serves it at `https://username.github.io/personal-blog`

2. **To trigger a deployment**, just push your changes:

```powershell
cd "d:\DEVOPS\DevSecOps  Projects\Personal Blog"

# Make changes (edit posts, resume, etc.)
# ...

# Stage, commit, and push
git add .
git commit -m "Add new post: my first blog post"
git push origin main
```

3. **Check deployment status**:
   - Go to your repo on GitHub
   - Click **Actions** (top)
   - Watch the workflow run in real-time
   - Once "Build and Deploy" completes (green checkmark), your site is live!

---

## Step 6: View Your Live Blog

Your blog is now live at:

```
https://username.github.io/personal-blog
```

Replace `username` with your GitHub username.

**Note:** If you just enabled Pages, it may take a few minutes before the site is accessible. Refresh after 2-3 minutes if you see a 404.

---

## Ongoing Workflow

After the initial setup, here's your daily blogging workflow:

```powershell
# 1. Create/edit a post
# Edit content/2025-12-13-new-post.md
# Edit resume.md if needed

# 2. Test locally (optional)
python app.py
# Visit http://127.0.0.1:5000

# 3. Push to GitHub (auto-deploys via GitHub Action)
git add .
git commit -m "Add post: New Topic"
git push origin main

# Done! Site updates automatically.
```

---

## Troubleshooting

### Issue: GitHub Action fails with "ModuleNotFoundError"
**Solution:** Check `requirements.txt` has all dependencies. Run `python export.py` locally to verify it works first.

### Issue: Site shows 404 error
**Solution:** 
- Wait 2-3 minutes after pushing (Pages is building)
- Go to repo → Settings → Pages → verify branch is `gh-pages` and root is selected
- Check Actions tab to see if workflow completed successfully

### Issue: Posts don't appear
**Solution:**
- Verify post files are in `content/` folder with `.md` extension
- Check YAML front-matter is valid (look for syntax errors like unmatched quotes)
- Verify `status: Published` is set in front-matter

### Issue: Theme/CSS looks broken
**Solution:**
- Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Verify `static/style.css` exists in `build/` folder

### Issue: GitHub Action logs show a secret error
**Solution:**
- The action uses the built-in `GITHUB_TOKEN` (automatically provided)
- You don't need to add any secrets manually
- If the error persists, check `.github/workflows/deploy.yml` has correct syntax

---

## Alternative: Deploy Without GitHub Actions (Manual)

If you prefer to skip the GitHub Action and deploy manually:

### Create `gh-pages` branch with static files

```powershell
# Build locally
python export.py

# Create orphan gh-pages branch
git checkout --orphan gh-pages

# Remove all tracked files
git rm -rf .

# Copy build contents to root
Get-ChildItem build -Recurse | ForEach-Object {
  if (-not $_.PSIsContainer) {
    $dest = $_.FullName -Replace "build\\", ""
    New-Item -Path $(Split-Path $dest) -ItemType Directory -Force | Out-Null
    Copy-Item $_.FullName $dest
  }
}

# Commit and push
git add .
git commit -m "Deploy static site to gh-pages"
git push origin HEAD:gh-pages --force

# Go back to main
git checkout main
```

Then configure Pages (Step 4) to use the `gh-pages` branch.

---

## Useful Links

- **GitHub Pages docs:** https://docs.github.com/en/pages
- **Flask docs:** https://flask.palletsprojects.com/
- **Markdown guide:** https://www.markdownguide.org/
- **YAML syntax:** https://yaml.org/

---

## Summary

| Step | Action | Command |
|------|--------|---------|
| 1 | Initialize git | `git init` |
| 2 | Configure user | `git config user.name "Your Name"` |
| 3 | Add files | `git add .` |
| 4 | Commit | `git commit -m "Initial commit"` |
| 5 | Add GitHub remote | `git remote add origin https://github.com/username/personal-blog.git` |
| 6 | Push to GitHub | `git push -u origin main` |
| 7 | Enable Pages | Go to Settings → Pages → Deploy from `gh-pages` |
| 8 | Verify | Visit `https://username.github.io/personal-blog` |

---

**You're done!** 🎉 Your DevSecOps blog is live and automatically deploys on every push.
