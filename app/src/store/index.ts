import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  GitHubUser, 
  GitHubRepo, 
  FileNode, 
  OpenFile, 
  ChatMessage, 
  FileDiff,
  TerminalCommand 
} from '@/types';

interface AppStore {
  // Auth State
  isAuthenticated: boolean;
  user: GitHubUser | null;
  githubToken: string | null;
  kimiApiKey: string | null;
  
  // Repo State
  currentRepo: GitHubRepo | null;
  repoFiles: FileNode[];
  isLoadingRepo: boolean;
  
  // Editor State
  openFiles: OpenFile[];
  activeFilePath: string | null;
  
  // Chat State
  chatMessages: ChatMessage[];
  isAIResponding: boolean;
  chatContext: string[];
  
  // Terminal State
  terminalHistory: TerminalCommand[];
  
  // Diff State
  pendingChanges: FileDiff[];
  diffViewOpen: boolean;
  diffViewFile: string | null;
  
  // UI State
  sidebarVisible: boolean;
  chatPanelVisible: boolean;
  terminalPanelVisible: boolean;
  activePanel: 'chat' | 'terminal' | null;
  isAgentMode: boolean;
  
  // Actions
  setAuth: (token: string, user: GitHubUser) => void;
  clearAuth: () => void;
  setKimiApiKey: (key: string) => void;
  clearKimiApiKey: () => void;
  
  setCurrentRepo: (repo: GitHubRepo | null) => void;
  setRepoFiles: (files: FileNode[]) => void;
  setIsLoadingRepo: (loading: boolean) => void;
  
  openFile: (node: FileNode) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  markFileDirty: (path: string, isDirty: boolean) => void;
  
  addChatMessage: (message: ChatMessage) => void;
  updateChatMessage: (id: string, content: string) => void;
  setIsAIResponding: (responding: boolean) => void;
  clearChat: () => void;
  setChatContext: (context: string[]) => void;
  
  addTerminalCommand: (command: TerminalCommand) => void;
  clearTerminal: () => void;
  
  setPendingChanges: (changes: FileDiff[]) => void;
  addPendingChange: (change: FileDiff) => void;
  removePendingChange: (path: string) => void;
  setDiffViewOpen: (open: boolean) => void;
  setDiffViewFile: (path: string | null) => void;
  
  setSidebarVisible: (visible: boolean) => void;
  setChatPanelVisible: (visible: boolean) => void;
  setTerminalPanelVisible: (visible: boolean) => void;
  setActivePanel: (panel: 'chat' | 'terminal' | null) => void;
  setIsAgentMode: (isAgent: boolean) => void;
  
  // File operations
  createFile: (path: string, content?: string) => void;
  deleteFile: (path: string) => void;
  createDirectory: (path: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial State
      isAuthenticated: false,
      user: null,
      githubToken: null,
      kimiApiKey: null,
      
      currentRepo: null,
      repoFiles: [],
      isLoadingRepo: false,
      
      openFiles: [],
      activeFilePath: null,
      
      chatMessages: [],
      isAIResponding: false,
      chatContext: [],
      
      terminalHistory: [],
      
      pendingChanges: [],
      diffViewOpen: false,
      diffViewFile: null,
      
      sidebarVisible: true,
      chatPanelVisible: true,
      terminalPanelVisible: false,
      activePanel: 'chat',
      isAgentMode: false,
      
      // Auth Actions
      setAuth: (token, user) => set({ 
        isAuthenticated: true, 
        githubToken: token, 
        user 
      }),
      
      clearAuth: () => set({ 
        isAuthenticated: false, 
        githubToken: null, 
        user: null,
        currentRepo: null,
        repoFiles: []
      }),
      
      setKimiApiKey: (key) => set({ kimiApiKey: key }),
      clearKimiApiKey: () => set({ kimiApiKey: null }),
      
      // Repo Actions
      setCurrentRepo: (repo) => set({ currentRepo: repo }),
      setRepoFiles: (files) => set({ repoFiles: files }),
      setIsLoadingRepo: (loading) => set({ isLoadingRepo: loading }),
      
      // Editor Actions
      openFile: (node) => {
        const { openFiles } = get();
        const existingIndex = openFiles.findIndex(f => f.node.path === node.path);
        
        if (existingIndex >= 0) {
          // File already open, just activate it
          set({ 
            activeFilePath: node.path,
            openFiles: openFiles.map((f, i) => ({
              ...f,
              isActive: i === existingIndex
            }))
          });
        } else {
          // Open new file
          const newOpenFile: OpenFile = {
            node,
            isActive: true,
            isDirty: false,
            originalContent: node.content
          };
          set({
            openFiles: [
              ...openFiles.map(f => ({ ...f, isActive: false })),
              newOpenFile
            ],
            activeFilePath: node.path
          });
        }
      },
      
      closeFile: (path) => {
        const { openFiles, activeFilePath } = get();
        const newOpenFiles = openFiles.filter(f => f.node.path !== path);
        
        // If we closed the active file, activate another one
        let newActivePath = activeFilePath;
        if (activeFilePath === path && newOpenFiles.length > 0) {
          newActivePath = newOpenFiles[newOpenFiles.length - 1].node.path;
          newOpenFiles[newOpenFiles.length - 1].isActive = true;
        } else if (newOpenFiles.length === 0) {
          newActivePath = null;
        }
        
        set({ 
          openFiles: newOpenFiles,
          activeFilePath: newActivePath
        });
      },
      
      setActiveFile: (path) => {
        const { openFiles } = get();
        set({
          openFiles: openFiles.map(f => ({
            ...f,
            isActive: f.node.path === path
          })),
          activeFilePath: path
        });
      },
      
      updateFileContent: (path, content) => {
        const { openFiles, repoFiles } = get();
        
        // Update in open files
        const newOpenFiles = openFiles.map(f => {
          if (f.node.path === path) {
            const isDirty = f.originalContent !== content;
            return {
              ...f,
              node: { ...f.node, content },
              isDirty
            };
          }
          return f;
        });
        
        // Update in repo files
        const updateRepoFiles = (files: FileNode[]): FileNode[] => {
          return files.map(file => {
            if (file.path === path) {
              return { ...file, content };
            }
            if (file.children) {
              return { ...file, children: updateRepoFiles(file.children) };
            }
            return file;
          });
        };
        
        set({
          openFiles: newOpenFiles,
          repoFiles: updateRepoFiles(repoFiles)
        });
      },
      
      markFileDirty: (path, isDirty) => {
        const { openFiles } = get();
        set({
          openFiles: openFiles.map(f => 
            f.node.path === path ? { ...f, isDirty } : f
          )
        });
      },
      
      // Chat Actions
      addChatMessage: (message) => {
        const { chatMessages } = get();
        set({ chatMessages: [...chatMessages, message] });
      },
      
      updateChatMessage: (id, content) => {
        const { chatMessages } = get();
        set({
          chatMessages: chatMessages.map(m =>
            m.id === id ? { ...m, content: m.content + content } : m
          )
        });
      },
      
      setIsAIResponding: (responding) => set({ isAIResponding: responding }),
      
      clearChat: () => set({ chatMessages: [] }),
      
      setChatContext: (context) => set({ chatContext: context }),
      
      // Terminal Actions
      addTerminalCommand: (command) => {
        const { terminalHistory } = get();
        set({ terminalHistory: [...terminalHistory, command] });
      },
      
      clearTerminal: () => set({ terminalHistory: [] }),
      
      // Diff Actions
      setPendingChanges: (changes) => set({ pendingChanges: changes }),
      
      addPendingChange: (change) => {
        const { pendingChanges } = get();
        const existingIndex = pendingChanges.findIndex(c => c.path === change.path);
        if (existingIndex >= 0) {
          const newChanges = [...pendingChanges];
          newChanges[existingIndex] = change;
          set({ pendingChanges: newChanges });
        } else {
          set({ pendingChanges: [...pendingChanges, change] });
        }
      },
      
      removePendingChange: (path) => {
        const { pendingChanges } = get();
        set({ pendingChanges: pendingChanges.filter(c => c.path !== path) });
      },
      
      setDiffViewOpen: (open) => set({ diffViewOpen: open }),
      
      setDiffViewFile: (path) => set({ diffViewFile: path }),
      
      // UI Actions
      setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
      
      setChatPanelVisible: (visible) => set({ chatPanelVisible: visible }),
      
      setTerminalPanelVisible: (visible) => set({ terminalPanelVisible: visible }),
      
      setActivePanel: (panel) => set({ activePanel: panel }),
      
      setIsAgentMode: (isAgent) => set({ isAgentMode: isAgent }),
      
      // File Operations
      createFile: (path, content = '') => {
        const { repoFiles } = get();
        
        const newFile: FileNode = {
          id: `new-${Date.now()}`,
          name: path.split('/').pop() || path,
          path,
          type: 'file',
          content,
          isNew: true,
          language: path.split('.').pop()
        };
        
        // Add to root for now (simplified)
        set({ repoFiles: [...repoFiles, newFile] });
        
        // Open the new file
        get().openFile(newFile);
      },
      
      deleteFile: (path) => {
        const { repoFiles, openFiles } = get();
        
        // Remove from repo files
        const removeFile = (files: FileNode[]): FileNode[] => {
          return files.filter(f => f.path !== path).map(f => {
            if (f.children) {
              return { ...f, children: removeFile(f.children) };
            }
            return f;
          });
        };
        
        set({ 
          repoFiles: removeFile(repoFiles),
          openFiles: openFiles.filter(f => f.node.path !== path)
        });
      },
      
      createDirectory: (path) => {
        const { repoFiles } = get();
        
        const newDir: FileNode = {
          id: `new-dir-${Date.now()}`,
          name: path.split('/').pop() || path,
          path,
          type: 'directory',
          isNew: true,
          children: []
        };
        
        set({ repoFiles: [...repoFiles, newDir] });
      }
    }),
    {
      name: 'kimi-coder-storage',
      partialize: (state) => ({
        githubToken: state.githubToken,
        kimiApiKey: state.kimiApiKey,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
