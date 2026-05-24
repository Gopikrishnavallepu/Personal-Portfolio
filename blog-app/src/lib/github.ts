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

export async function deleteFromGitHub(token: string, owner: string, repo: string, path: string, message: string) {
  const octokit = getOctokit(token);
  
  try {
    // We need the file's SHA to delete it
    let sha;
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });
    if (!Array.isArray(response.data) && response.data.type === 'file') {
      sha = response.data.sha;
    } else {
      throw new Error("Target is not a file or does not exist.");
    }

    const res = await octokit.repos.deleteFile({
      owner,
      repo,
      path,
      message,
      sha,
    });
    return res.data;
  } catch (error) {
    console.error("Error deleting from GitHub:", error);
    throw error;
  }
}

export async function renameInGitHub(token: string, owner: string, repo: string, oldPath: string, newPath: string, message: string) {
  const octokit = getOctokit(token);
  
  try {
    // 1. Get the content of the old file
    const getResponse = await octokit.repos.getContent({
      owner,
      repo,
      path: oldPath,
    });

    if (Array.isArray(getResponse.data) || getResponse.data.type !== 'file' || !getResponse.data.content) {
      throw new Error("Old file not found or is not a file.");
    }

    const sha = getResponse.data.sha;
    
    // 2. Create the new file with the same content (the content is already base64 encoded)
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: newPath,
      message: `Create ${newPath} (Rename part 1)`,
      content: getResponse.data.content, // Already base64 from getContent
    });

    // 3. Delete the old file
    await octokit.repos.deleteFile({
      owner,
      repo,
      path: oldPath,
      message: `Delete ${oldPath} (Rename part 2)`,
      sha,
    });

    return true;
  } catch (error) {
    console.error("Error renaming in GitHub:", error);
    throw error;
  }
}
