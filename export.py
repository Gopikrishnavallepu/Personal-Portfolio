import os
import shutil
from pathlib import Path

from app import app, load_posts

BASE_DIR = Path(__file__).resolve().parent
BUILD_DIR = BASE_DIR / 'build'


def ensure_build():
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)


def copy_static():
    src = BASE_DIR / 'static'
    dst = BUILD_DIR / 'static'
    if src.exists():
        shutil.copytree(src, dst)


def render_posts(posts):
    with app.app_context():
        for post in posts:
            slug = post['slug']
            out_dir = BUILD_DIR / 'posts' / slug
            out_dir.mkdir(parents=True, exist_ok=True)
            html = app.jinja_env.get_template('post.html').render(post=post)
            (out_dir / 'index.html').write_text(html, encoding='utf-8')


def render_index(posts):
    with app.app_context():
        html = app.jinja_env.get_template('index.html').render(posts=posts)
        (BUILD_DIR / 'index.html').write_text(html, encoding='utf-8')


def render_resume():
    import os
    resume_file = os.path.join(os.path.dirname(__file__), 'resume.md')
    if os.path.exists(resume_file):
        import frontmatter
        import markdown
        fm = frontmatter.load(resume_file)
        html = markdown.markdown(fm.content, extensions=['fenced_code', 'codehilite', 'tables'])
    else:
        html = "<p>Resume not available yet.</p>"
    
    with app.app_context():
        out_dir = BUILD_DIR / 'resume'
        out_dir.mkdir(parents=True, exist_ok=True)
        html = app.jinja_env.get_template('resume.html').render(resume_html=html)
        (out_dir / 'index.html').write_text(html, encoding='utf-8')


def build():
    ensure_build()
    posts = load_posts()
    copy_static()
    render_posts(posts)
    render_index(posts)
    render_resume()
    print('Build complete. Output in:', BUILD_DIR)


if __name__ == '__main__':
    build()
