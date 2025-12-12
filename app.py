import os
import glob
import re
from datetime import datetime

import frontmatter
import markdown
from flask import Flask, render_template, abort, url_for

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(BASE_DIR, 'content')
RESUME_FILE = os.path.join(BASE_DIR, 'resume.md')

# GitHub Pages subdirectory: change this to match your repo name
GITHUB_PAGES_BASE = os.environ.get('GITHUB_PAGES_BASE', '/Personal-Portfolio')

app = Flask(__name__)


def extract_excerpt(content, length=150):
    """Extract clean excerpt from markdown content (no markdown syntax)"""
    # remove markdown syntax (# ** * [] etc)
    clean = re.sub(r'[#*`\[\]()]+', '', content)
    # get first sentence or truncate
    sentences = clean.split('.')
    excerpt = sentences[0].strip() if sentences[0] else ""
    if len(excerpt) > length:
        excerpt = excerpt[:length].rsplit(' ', 1)[0] + '...'
    return excerpt or "(no excerpt)"


def load_posts(include_drafts=False):
    posts = []
    pattern = os.path.join(CONTENT_DIR, '*.md')
    for path in glob.glob(pattern):
        try:
            fm = frontmatter.load(path)
        except Exception:
            continue
        filename = os.path.basename(path)
        # slug: remove date prefix if exists
        slug = filename
        if filename.count('-') >= 3 and filename[:10].count('-') == 2:
            # likely YYYY-MM-DD-xxx
            slug = filename[11:]
        slug = os.path.splitext(slug)[0]

        # parse date
        date = None
        meta_date = fm.get('date')
        if meta_date:
            try:
                date = datetime.fromisoformat(meta_date)
            except Exception:
                try:
                    date = datetime.strptime(meta_date, '%Y-%m-%d')
                except Exception:
                    date = None

        html = markdown.markdown(fm.content, extensions=['fenced_code', 'codehilite', 'tables'])

        post = {
            'slug': slug,
            'title': fm.get('topic') or fm.get('title') or slug.replace('-', ' ').title(),
            'date': date,
            'meta': dict(fm.metadata),
            'content_html': html,
            'raw_content': fm.content,
            'excerpt': extract_excerpt(fm.content),
            'source_path': path,
        }
        status = fm.get('status', '').lower()
        if status in ('draft', 'in progress', 'in-progress'):
            post['published'] = False
        else:
            post['published'] = True

        if post['published'] or include_drafts:
            posts.append(post)

    # sort by date desc (None dates at bottom)
    posts.sort(key=lambda p: p['date'] or datetime.min, reverse=True)
    return posts


@app.route('/')
def index():
    posts = load_posts()
    return render_template('index.html', posts=posts, base_url=GITHUB_PAGES_BASE)


@app.route('/posts/<slug>')
def post(slug):
    posts = load_posts(include_drafts=True)
    for p in posts:
        if p['slug'] == slug:
            return render_template('post.html', post=p, base_url=GITHUB_PAGES_BASE)
    abort(404)


@app.route('/resume')
def resume():
    if os.path.exists(RESUME_FILE):
        fm = frontmatter.load(RESUME_FILE)
        html = markdown.markdown(fm.content, extensions=['fenced_code', 'codehilite', 'tables'])
        return render_template('resume.html', resume_html=html, base_url=GITHUB_PAGES_BASE)
    return render_template('resume.html', resume_html="<p>Resume not available yet.</p>", base_url=GITHUB_PAGES_BASE)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
