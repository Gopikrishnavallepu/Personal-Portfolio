# Velse — Personal Portfolio & Blog Platform

Velse is a premium, interactive personal portfolio, learning journal, and project tracker built with Next.js (app router), React 19, Tailwind CSS, and NextAuth.

## 🚀 Key Features

- **Dynamic Interactive Tree**: File system explorer to navigate categorised `.md` and `.pdf` documents.
- **Native PDF Viewer**: Render PDF manuals and documents directly within the browser view.
- **Integrated Markdown Editor**: Edit, rename, delete, or upload posts directly from the UI (persisted locally and synced with GitHub).
- **NextAuth Integration**: Secure GitHub Authentication to authorize only you to edit your content.
- **Export to PDF**: Native compilation of markdown documentation into professional PDF layouts.
- **Dual Theme Support**: Beautiful, animated light and dark modes.

---

## 🛠️ Local Setup Guide

### 1. Install Dependencies
Run the install command inside the `blog-app` directory:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file inside the `blog-app` directory:
```env
# GitHub OAuth Credentials
GITHUB_ID=your_github_oauth_app_client_id
GITHUB_SECRET=your_github_oauth_app_client_secret

# NextAuth Secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a8f8d67290eb4ea6bfb0cd3f972b21c4b8e21727

# GitHub Repository details
GITHUB_OWNER=Gopikrishnavallepu
GITHUB_REPO=Personal-Portfolio
```

### 3. Register a GitHub OAuth App
To enable OAuth login:
1. Go to your **GitHub Settings** -> **Developer Settings** -> **OAuth Apps** -> **Register a new application**.
2. **Application name**: `Velse Dev` (or any name you choose)
3. **Homepage URL**: `http://localhost:3000`
4. **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
5. Click **Register application**.
6. Generate a new **Client Secret** and copy both the **Client ID** and **Client Secret** into your `.env.local`.

---

## 💻 Running the App

Start the Next.js development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view your blog.

---

## 🌐 Production Deployment

### 1. Deploying to Vercel (Recommended)
1. Go to [Vercel](https://vercel.com) and create an account.
2. Import your GitHub repository `Gopikrishnavallepu/Personal-Portfolio`.
3. Set the root directory to `Blog-Data/blog-app`.
4. Configure the **Environment Variables** in Vercel (similar to `.env.local` but use your production URL for `NEXTAUTH_URL` and register a separate production OAuth App in GitHub Developer settings pointing to your Vercel URL).

### 2. Automated Deployment with GitHub Actions
If you wish to deploy automatically using GitHub Actions, a CI/CD workflow is configured in `.github/workflows/deploy.yml` to automatically build and verify your blog app on every push to the `main` branch.
