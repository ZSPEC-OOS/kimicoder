import { Octokit } from 'octokit';
import type { 
  GitHubUser, 
  GitHubRepo, 
  GitHubFile, 
  GitHubTreeItem,
  FileNode 
} from '@/types';

class GitHubService {
  private octokit: Octokit | null = null;

  initialize(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  isInitialized(): boolean {
    return this.octokit !== null;
  }

  async getUser(): Promise<GitHubUser> {
    if (!this.octokit) throw new Error('GitHub service not initialized');
    const { data } = await this.octokit.rest.users.getAuthenticated();
    return data as GitHubUser;
  }

  async getRepos(): Promise<GitHubRepo[]> {
    if (!this.octokit) throw new Error('GitHub service not initialized');
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    });
    return data as GitHubRepo[];
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    if (!this.octokit) throw new Error('GitHub service not initialized');
    const { data } = await this.octokit.rest.repos.get({ owner, repo });
    return data as GitHubRepo;
  }

  async getRepoTree(owner: string, repo: string, branch: string = 'main'): Promise<GitHubTreeItem[]> {
    if (!this.octokit) throw new Error('GitHub service not initialized');
    
    // Get the commit SHA for the branch
    const { data: refData } = await this.octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`
    });

    // Get the tree recursively
    const { data: treeData } = await this.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: refData.object.sha,
      recursive: '1'
    });

    return treeData.tree as GitHubTreeItem[];
  }

  async getFileContent(owner: string, repo: string, path: string, branch: string = 'main'): Promise<GitHubFile> {
    if (!this.octokit) throw new Error('GitHub service not initialized');
    const { data } = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });
    return data as GitHubFile;
  }

  async createOrUpdateFile(
    owner: string, 
    repo: string, 
    path: string, 
    content: string, 
    message: string,
    branch: string = 'main',
    sha?: string
  ): Promise<void> {
    if (!this.octokit) throw new Error('GitHub service not initialized');
    
    const contentEncoded = btoa(unescape(encodeURIComponent(content)));
    
    await this.octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: contentEncoded,
      branch,
      sha
    });
  }

  async createBranch(owner: string, repo: string, newBranch: string, fromBranch: string = 'main'): Promise<void> {
    if (!this.octokit) throw new Error('GitHub service not initialized');
    
    // Get the SHA of the latest commit on the source branch
    const { data: refData } = await this.octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${fromBranch}`
    });

    // Create the new branch
    await this.octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha: refData.object.sha
    });
  }

  async createPullRequest(
    owner: string, 
    repo: string, 
    title: string, 
    head: string, 
    base: string, 
    body: string
  ): Promise<void> {
    if (!this.octokit) throw new Error('GitHub service not initialized');
    
    await this.octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body
    });
  }

  // Convert GitHub tree to FileNode tree
  buildFileTree(treeItems: GitHubTreeItem[]): FileNode[] {
    const root: FileNode[] = [];
    const map = new Map<string, FileNode>();

    // Sort items by path to ensure parents are created before children
    const sortedItems = [...treeItems].sort((a, b) => a.path.localeCompare(b.path));

    for (const item of sortedItems) {
      const parts = item.path.split('/');
      const name = parts[parts.length - 1];
      
      const node: FileNode = {
        id: item.sha,
        name,
        path: item.path,
        type: item.type === 'tree' ? 'directory' : 'file',
        sha: item.sha,
        children: item.type === 'tree' ? [] : undefined,
        language: item.type === 'blob' ? this.detectLanguage(name) : undefined
      };

      map.set(item.path, node);

      if (parts.length === 1) {
        // Top-level item
        root.push(node);
      } else {
        // Nested item
        const parentPath = parts.slice(0, -1).join('/');
        const parent = map.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
          node.parent = parent;
        }
      }
    }

    // Sort: directories first, then alphabetically
    const sortNodes = (nodes: FileNode[]) => {
      nodes.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      });
      nodes.forEach(node => {
        if (node.children) sortNodes(node.children);
      });
    };
    sortNodes(root);

    return root;
  }

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'jsx': 'javascript',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'cs': 'csharp',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'r': 'r',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'dockerfile': 'dockerfile',
      'tf': 'terraform',
      'vue': 'vue',
      'svelte': 'svelte',
      'astro': 'astro'
    };
    return languageMap[ext || ''] || 'plaintext';
  }
}

export const githubService = new GitHubService();
