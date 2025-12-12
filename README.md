# Personal DevSecOps Blog (Flask scaffold)

This repository contains a minimal Flask-based blog scaffold that:

- Renders Markdown posts with YAML front-matter
- Provides a development server (`app.py`) for preview
- Exports a static site into `build/` (`export.py`) for GitHub Pages
- Includes a GitHub Actions workflow to publish `build/` to `gh-pages`

Quick start (PowerShell):

```powershell
# create a venv
python -m venv .venv
.
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

# Run dev server
python app.py

# Build static site
python export.py

# Serve build/index.html locally (open in browser)
start build\index.html
```

GitHub Pages deployment:

- This repo includes a GitHub Action (`.github/workflows/deploy.yml`) that runs on push to `main` and publishes `build/` to the `gh-pages` branch.
- To use the action, push this repo to `username/personal-blog` and ensure Pages is configured to use the `gh-pages` branch (root).
