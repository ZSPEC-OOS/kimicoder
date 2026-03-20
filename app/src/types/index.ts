// GitHub Types
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  owner: GitHubUser;
  language?: string;
  stargazers_count?: number;
  updated_at?: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  html_url?: string;
  download_url?: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

// File System Types
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  sha?: string;
  isModified?: boolean;
  isNew?: boolean;
  isDeleted?: boolean;
  children?: FileNode[];
  parent?: FileNode;
  language?: string;
}

// Editor Types
export interface OpenFile {
  node: FileNode;
  isActive: boolean;
  isDirty: boolean;
  originalContent?: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

// AI Types
export interface AIRequest {
  messages: ChatMessage[];
  context?: string[];
  files?: string[];
}

export interface AIResponse {
  content: string;
  toolCalls?: ToolCall[];
}

// Diff Types
export interface FileDiff {
  path: string;
  oldContent: string;
  newContent: string;
  additions: number;
  deletions: number;
}

// Terminal Types
export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: number;
}

// App State
export interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: GitHubUser | null;
  token: string | null;
  
  // Repo
  currentRepo: GitHubRepo | null;
  repoFiles: FileNode[];
  
  // Editor
  openFiles: OpenFile[];
  activeFile: OpenFile | null;
  
  // Chat
  chatMessages: ChatMessage[];
  isAIResponding: boolean;
  
  // Terminal
  terminalHistory: TerminalCommand[];
  
  // UI
  sidebarVisible: boolean;
  chatPanelVisible: boolean;
  terminalPanelVisible: boolean;
  diffPanelVisible: boolean;
  
  // Agent
  isAgentMode: boolean;
  pendingChanges: FileDiff[];
}

// Tool Types for Agent
export type ToolName = 
  | 'read_file' 
  | 'write_file' 
  | 'run_command' 
  | 'search_code' 
  | 'commit_changes'
  | 'create_branch'
  | 'create_pull_request';

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}
