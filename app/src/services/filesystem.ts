import type { FileNode, FileDiff } from '@/types';

class FileSystemService {
  private files: Map<string, FileNode> = new Map();
  private rootNodes: FileNode[] = [];

  // Initialize with GitHub repo files
  setFiles(files: FileNode[]) {
    this.rootNodes = files;
    this.files.clear();
    this.indexFiles(files);
  }

  private indexFiles(nodes: FileNode[]) {
    for (const node of nodes) {
      this.files.set(node.path, node);
      if (node.children) {
        this.indexFiles(node.children);
      }
    }
  }

  getRootNodes(): FileNode[] {
    return this.rootNodes;
  }

  getFile(path: string): FileNode | undefined {
    return this.files.get(path);
  }

  getAllFiles(): FileNode[] {
    return Array.from(this.files.values()).filter(f => f.type === 'file');
  }

  updateFileContent(path: string, content: string): FileNode | null {
    const file = this.files.get(path);
    if (file && file.type === 'file') {
      const isModified = file.content !== content;
      file.content = content;
      file.isModified = isModified && !file.isNew;
      return file;
    }
    return null;
  }

  createFile(path: string, content: string = ''): FileNode | null {
    if (this.files.has(path)) {
      return null; // File already exists
    }

    const parts = path.split('/');
    const name = parts[parts.length - 1];
    
    const newFile: FileNode = {
      id: `new-${Date.now()}`,
      name,
      path,
      type: 'file',
      content,
      isNew: true,
      isModified: false,
      language: this.detectLanguage(name)
    };

    this.files.set(path, newFile);

    // Add to parent directory
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = this.files.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(newFile);
        newFile.parent = parent;
      }
    } else {
      this.rootNodes.push(newFile);
    }

    return newFile;
  }

  deleteFile(path: string): boolean {
    const file = this.files.get(path);
    if (!file) return false;

    // Remove from parent
    if (file.parent) {
      const parent = file.parent;
      if (parent.children) {
        parent.children = parent.children.filter(c => c.path !== path);
      }
    } else {
      this.rootNodes = this.rootNodes.filter(n => n.path !== path);
    }

    // Mark as deleted or remove if new
    if (file.isNew) {
      this.files.delete(path);
    } else {
      file.isDeleted = true;
    }

    return true;
  }

  createDirectory(path: string): FileNode | null {
    if (this.files.has(path)) {
      return null;
    }

    const parts = path.split('/');
    const name = parts[parts.length - 1];
    
    const newDir: FileNode = {
      id: `new-dir-${Date.now()}`,
      name,
      path,
      type: 'directory',
      isNew: true,
      children: []
    };

    this.files.set(path, newDir);

    // Add to parent
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = this.files.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(newDir);
        newDir.parent = parent;
      }
    } else {
      this.rootNodes.push(newDir);
    }

    return newDir;
  }

  getModifiedFiles(): FileNode[] {
    return Array.from(this.files.values()).filter(
      f => f.isModified || f.isNew || f.isDeleted
    );
  }

  computeDiff(file: FileNode, originalContent: string): FileDiff {
    const newContent = file.content || '';
    const oldLines = originalContent.split('\n');
    const newLines = newContent.split('\n');
    
    let additions = 0;
    let deletions = 0;

    // Simple diff counting
    const maxLines = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (i >= oldLines.length) {
        additions++;
      } else if (i >= newLines.length) {
        deletions++;
      } else if (oldLines[i] !== newLines[i]) {
        additions++;
        deletions++;
      }
    }

    return {
      path: file.path,
      oldContent: originalContent,
      newContent,
      additions,
      deletions
    };
  }

  searchFiles(query: string): FileNode[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.files.values()).filter(file => {
      return (
        file.name.toLowerCase().includes(lowerQuery) ||
        file.path.toLowerCase().includes(lowerQuery) ||
        (file.content && file.content.toLowerCase().includes(lowerQuery))
      );
    });
  }

  resetFile(path: string): boolean {
    const file = this.files.get(path);
    if (!file) return false;

    if (file.isNew) {
      this.deleteFile(path);
    } else {
      file.isModified = false;
      file.isDeleted = false;
      // Content would need to be re-fetched from GitHub
    }
    return true;
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

export const fileSystem = new FileSystemService();
