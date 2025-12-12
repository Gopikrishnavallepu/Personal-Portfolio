# Personal Blog Project Workflow

## Purpose
This project builds a personal blog and portfolio tailored for a DevSecOps engineer / security analyst. The site will:
- Publish Markdown (`.md`) posts with metadata (the columns from your tracker)
- Show posts ordered by date/time and category
- Make it easy to link out to GitHub, Medium, Hashnode, Dev.to, Substack, Notion, GitBook, and the main personal blog
- Provide a clean, technical, visually attractive layout to showcase projects and skills
- Support local preview and a static export to publish on GitHub Pages (`username.github.io`) or `gh-pages` branch

## Choice of stack
- Primary app: **Flask** (Python)
  - Reason: lightweight, easy to implement Markdown rendering and a static-export pipeline. Flask keeps the repo simple and is fast to iterate on. It also makes generating a static `build/` folder straightforward for GitHub Pages hosting.
  - Note: GitHub Pages serves static sites only. The Flask app will be used for development and for generating static HTML which we then publish to GitHub Pages (via `gh-pages` branch or `username.github.io` repository). If you later want dynamic features (comments, search), you can host the Flask app on a dynamic hosting provider (Heroku, Render, Fly, Azure) and keep GitHub Pages as a fallback.

## High-level features
- Markdown-based posts with a YAML front-matter containing tracker fields
- Auto-generated post list (index) sorted by date/time and category
- Post taxonomy / categories and tags
- Per-post links to external platforms (GitHub, Medium, Hashnode, Dev.to, Substack, Notion, GitBook)
- Static export script: render `.md` -> `.html` into `build/`
- Optionally: GitHub Action to run build and push to `gh-pages`

## Tracker -> Front-matter mapping
Your Excel tracker columns will map to YAML front-matter fields in each `.md` file. Suggested names (examples):

- `date`: ISO date/time (e.g., `2025-12-12T14:30:00+00:00`)
- `month`: `December` (optional, can be derived)
- `week`: `50` (optional)
- `topic`: short title
- `category`: topic focus (e.g., `DevSecOps`, `CloudSecurity`, `SCA`)
- `focus`: topic focus (same as `category` or more granular)
- `activity`: Detailed activity / task to master
- `key_task`: Task identifier or short name
- `tool_concept`: Key tool or concept (e.g., `Terraform`, `OWASP ZAP`)
- `status`: `Draft` / `In Progress` / `Published`
- `links`: (dictionary of external links)
  - `github`, `medium`, `hashnode`, `devto`, `substack`, `notion`, `gitbook`, `personal_blog`

Example YAML front-matter:

---
date: "2025-12-12T09:00:00+00:00"
month: "December"
week: 50
topic: "Automating SCA in CI"
category: "DevSecOps"
focus: "SCA/Automation"
activity: "Add SCA scan to pipeline and triage results"
key_task: "SCA-pipeline"
tool_concept: "OWASP Dependency-Check, GitHub Actions"
status: "Published"
links:
  github: "https://github.com/username/repo"
  medium: ""
  hashnode: ""
  devto: ""
  substack: ""
  notion: ""
  gitbook: ""
  personal_blog: "https://username.github.io/post-slug"
---

# Post title

Write your content here in Markdown.

## File layout (recommended)

- `content/` - place `.md` files here (one per post)
- `templates/` - Jinja2 templates for posts, index, layout
- `static/` - CSS, JS, images
- `app.py` - Flask dev server and renderer
- `export.py` - script to render all `.md` to `build/` static HTML
- `build/` - generated static site (do NOT edit directly)
- `.github/workflows/` - GitHub Actions for CI / deploy (optional)
- `README.md`

## Markdown format & guidelines
- Each post must start with YAML front-matter as shown above.
- Filename should be slugified: `YYYY-MM-DD-post-slug.md` (helps ordering).
- Include an excerpt (first paragraph) used for index previews.
- Images: place under `static/images/<post-slug>/` and reference them with `/static/...` for Flask dev and relative links when exported.

## Development workflow
1. Create a new `.md` in `content/` using the front-matter template.
2. Run the Flask dev server locally to preview posts:
   - `python -m venv .venv` (optional)
   - `pip install -r requirements.txt`
   - `set FLASK_APP=app.py` (on PowerShell: `$env:FLASK_APP='app.py'`)
   - `flask run` (or `python app.py`)
3. When ready to publish, set `status: Published` and run the export script:
   - `python export.py` -> generates `build/` with static HTML
4. Verify `build/` locally: open `build/index.html` in a browser.

## Hosting on GitHub Pages (step-by-step)
There are two main options:

Option A — Use a `username.github.io` repo (recommended for full site root):
- Create a repo named `username.github.io` (replace `username`).
- Add your generated static files to the repository root (or push `build/` contents to `main` branch of that repo).
- Commit and push. GitHub Pages will serve from the `main` branch root for `username.github.io`.

Option B — Use `gh-pages` branch on a project repo:
- Keep your project site in a repo like `username/personal-blog`.
- Add an action or script that pushes the rendered `build/` contents to the `gh-pages` branch.
- In repository Settings > Pages, set source to `gh-pages` branch (root) or `/docs` folder.

Manual deploy (quick):
- Build: `python export.py`
- Create a new orphan branch `gh-pages`, copy `build/` contents to root, commit and push:
  - In PowerShell (example):

```powershell
# from repo root
python export.py
git checkout --orphan gh-pages
git --work-tree "build" add --all
git --work-tree "build" commit -m "Deploy site"
git push origin HEAD:gh-pages --force
# then return to main
git checkout -f main
```

Automated deploy with GitHub Actions (recommended):
- Add a GitHub Action workflow that runs on push to `main`: sets up Python, installs deps, runs `python export.py`, then uses an action like `peaceiris/actions-gh-pages` to publish `build/` to `gh-pages` branch.

Minimal GitHub Actions steps (concept):
- Setup Python
- Install requirements
- Run `python export.py`
- Use `actions/checkout` and `peaceiris/actions-gh-pages@v3` to publish `build/`

## Export script behavior
- Read each `.md` in `content/`, parse YAML front-matter
- Render content using a `post.html` Jinja2 template
- Generate `index.html` by listing all posts with excerpts and link metadata
- Copy `static/` into `build/static/`
- Support RSS feed generation (optional) and sitemap

## Example post file (sample)
`content/2025-12-12-automating-sca.md`

---
date: "2025-12-12T09:00:00+00:00"
month: "December"
week: 50
topic: "Automating SCA in CI"
category: "DevSecOps"
focus: "SCA/Automation"
activity: "Add SCA scan to pipeline and triage results"
key_task: "SCA-pipeline"
tool_concept: "OWASP Dependency-Check, GitHub Actions"
status: "Published"
links:
  github: "https://github.com/username/repo"
  medium: ""
  hashnode: ""
  devto: ""
  substack: ""
  notion: ""
  gitbook: ""
  personal_blog: "https://username.github.io/automating-sca"
---

# Automating SCA in CI

Intro paragraph / excerpt.

More detailed content here.

## Next steps after this document
- If you approve this workflow, I'll scaffold a minimal Flask project with:
  - `app.py` dev server that renders `.md` from `content/`
  - Jinja2 templates (post, index, layout)
  - `export.py` to produce `build/`
  - `requirements.txt` and example `.md` content
  - README with copy-paste hosting commands for GitHub Pages
- I can also add a GitHub Action workflow to auto-build and deploy to `gh-pages`.

---

If you'd like to change anything in the workflow or front-matter mapping, tell me which fields to rename or remove. When you're happy, I can scaffold the Flask project and example content and add the deployment action.