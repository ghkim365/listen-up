/**
 * GitHub Cloud Sync Utility for StudyPlayer
 * Handles reading and writing question data to a private GitHub repository.
 */

const GITHUB_API_BASE = 'https://api.github.com';

export const githubSync = {
  /**
   * Fetch current questions from GitHub
   */
  async fetchData(settings) {
    const { token, owner, repo, path = 'study_data.json' } = settings;
    if (!token || !owner || !repo) return null;

    try {
      const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.status === 404) {
        // File doesn't exist yet
        return { content: [], sha: null };
      }

      const data = await response.json();
      // decode base64 content
      const decodedContent = decodeURIComponent(atob(data.content).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return {
        content: JSON.parse(decodedContent),
        sha: data.sha
      };
    } catch (error) {
      console.error('GitHub Fetch Error:', error);
      throw error;
    }
  },

  /**
   * Push questions to GitHub
   */
  async pushData(settings, questions, sha) {
    const { token, owner, repo, path = 'study_data.json' } = settings;
    if (!token || !owner || !repo) return null;

    try {
      const content = JSON.stringify(questions, null, 2);
      // encode to base64 properly for unicode
      const encodedContent = btoa(encodeURIComponent(content).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));

      const body = {
        message: `Sync study data - ${new Date().toLocaleString()}`,
        content: encodedContent,
      };

      if (sha) {
        body.sha = sha;
      }

      const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Push failed');

      return result.content.sha;
    } catch (error) {
      console.error('GitHub Push Error:', error);
      throw error;
    }
  }
};
