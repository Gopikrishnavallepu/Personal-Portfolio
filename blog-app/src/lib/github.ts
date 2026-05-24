import { Octokit } from '@octokit/rest';

export function getOctokit(token: string) {
  return new Octokit({ auth: token });
}

export async function uploadToGitHub(token: string, owner: string, repo: string, path: string, content: string, message: string) {
  const octokit = getOctokit(token);
  
  try {
    // Check if file exists to get its SHA for updating
    let sha;
    try {
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      if (!Array.isArray(response.data) && response.data.type === 'file') {
        sha = response.data.sha;
      }
    } catch (e: any) {
      if (e.status !== 404) throw e;
    }

    const res = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    });
    return res.data;
  } catch (error) {
    console.error("Error uploading to GitHub:", error);
    throw error;
  }
}
