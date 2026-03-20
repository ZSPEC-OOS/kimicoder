import { useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import { githubService } from '@/services/github';
import { fileSystem } from '@/services/filesystem';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  RefreshCw,
  GitBranch
} from 'lucide-react';
import type { FileNode } from '@/types';
import { toast } from 'sonner';

interface FileTreeItemProps {
  node: FileNode;
  level: number;
  onToggle: (node: FileNode) => void;
  onSelect: (node: FileNode) => void;
  expandedPaths: Set<string>;
}

function FileTreeItem({ node, level, onToggle, onSelect, expandedPaths }: FileTreeItemProps) {
  const { activeFilePath } = useAppStore();
  const isExpanded = expandedPaths.has(node.path);
  const isActive = activeFilePath === node.path;
  const isModified = node.isModified || node.isNew || node.isDeleted;

  const handleClick = () => {
    if (node.type === 'directory') {
      onToggle(node);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-1 px-2 py-1 cursor-pointer text-sm select-none
          transition-colors duration-150
          ${isActive 
            ? 'bg-[#ff4d00]/20 text-white' 
            : 'text-white/70 hover:bg-white/5 hover:text-white'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {/* Expand/Collapse Icon */}
        <span className="w-4 h-4 flex items-center justify-center">
          {node.type === 'directory' && (
            isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )
          )}
        </span>

        {/* File/Folder Icon */}
        {node.type === 'directory' ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-[#ff4d00]" />
          ) : (
            <Folder className="w-4 h-4 text-[#ff4d00]" />
          )
        ) : (
          <File className={`w-4 h-4 ${isActive ? 'text-[#ff4d00]' : 'text-white/50'}`} />
        )}

        {/* Name */}
        <span className={`truncate flex-1 ${isModified ? 'italic' : ''}`}>
          {node.name}
        </span>

        {/* Modified Indicator */}
        {isModified && (
          <span className="w-2 h-2 rounded-full bg-[#ff4d00]" />
        )}
      </div>

      {/* Render Children */}
      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onSelect={onSelect}
              expandedPaths={expandedPaths}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer() {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    repoFiles,
    currentRepo,
    isLoadingRepo,
    openFile
  } = useAppStore();

  const handleToggle = useCallback((node: FileNode) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.path)) {
        newSet.delete(node.path);
      } else {
        newSet.add(node.path);
      }
      return newSet;
    });
  }, []);

  const handleSelect = useCallback(async (node: FileNode) => {
    if (node.type !== 'file') return;

    // If file content is not loaded, fetch it
    if (!node.content && currentRepo) {
      try {
        const fileData = await githubService.getFileContent(
          currentRepo.owner.login,
          currentRepo.name,
          node.path,
          currentRepo.default_branch
        );
        
        if (fileData.content) {
          const content = atob(fileData.content.replace(/\n/g, ''));
          node.content = content;
          node.sha = fileData.sha;
        }
      } catch (error) {
        toast.error(`Failed to load ${node.name}`);
        return;
      }
    }

    openFile(node);
  }, [currentRepo, openFile]);

  const handleRefresh = async () => {
    if (!currentRepo) return;
    
    setIsRefreshing(true);
    try {
      const treeItems = await githubService.getRepoTree(
        currentRepo.owner.login,
        currentRepo.name,
        currentRepo.default_branch
      );
      
      const fileTree = githubService.buildFileTree(treeItems);
      useAppStore.getState().setRepoFiles(fileTree);
      fileSystem.setFiles(fileTree);
      
      toast.success('Repository refreshed');
    } catch (error) {
      toast.error('Failed to refresh repository');
    } finally {
      setIsRefreshing(false);
    }
  };

  const expandAll = () => {
    const allPaths = new Set<string>();
    const collectPaths = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'directory') {
          allPaths.add(node.path);
          if (node.children) {
            collectPaths(node.children);
          }
        }
      }
    };
    collectPaths(repoFiles);
    setExpandedPaths(allPaths);
  };

  const collapseAll = () => {
    setExpandedPaths(new Set());
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-6 h-6 text-white/50 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={expandAll}
            className="w-6 h-6 text-white/50 hover:text-white hover:bg-white/10"
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={collapseAll}
            className="w-6 h-6 text-white/50 hover:text-white hover:bg-white/10"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        {isLoadingRepo ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#ff4d00]/30 border-t-[#ff4d00] rounded-full animate-spin" />
          </div>
        ) : repoFiles.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-white/40">
              No repository loaded
            </p>
          </div>
        ) : (
          <div className="py-2">
            {repoFiles.map((node) => (
              <FileTreeItem
                key={node.path}
                node={node}
                level={0}
                onToggle={handleToggle}
                onSelect={handleSelect}
                expandedPaths={expandedPaths}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Status Bar */}
      {currentRepo && (
        <div className="px-3 py-2 border-t border-white/10 text-xs text-white/40">
          <div className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {currentRepo.default_branch}
          </div>
        </div>
      )}
    </div>
  );
}
