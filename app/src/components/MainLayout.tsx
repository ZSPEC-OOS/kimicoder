import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { githubService } from '@/services/github';
import { fileSystem } from '@/services/filesystem';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { ChatPanel } from './ChatPanel';
import { TerminalPanel } from './TerminalPanel';
import { DiffViewer } from './DiffViewer';
import { RepoSelector } from './RepoSelector';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Terminal, 
  GitBranch, 
  Menu,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';

export function MainLayout() {
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  
  const {
    user,
    currentRepo,
    sidebarVisible,
    chatPanelVisible,
    terminalPanelVisible,
    activePanel,
    isAgentMode,
    setSidebarVisible,
    setChatPanelVisible,
    setTerminalPanelVisible,
    setActivePanel,
    setIsAgentMode,
    setRepoFiles,
    setCurrentRepo,
    setIsLoadingRepo
  } = useAppStore();

  // Load repos on mount if not already loaded
  useEffect(() => {
    if (!currentRepo) {
      setShowRepoSelector(true);
    }
  }, []);

  const handleRepoSelect = async (repo: any) => {
    setIsLoadingRepo(true);
    setShowRepoSelector(false);
    
    try {
      setCurrentRepo(repo);
      
      // Fetch repo tree
      const treeItems = await githubService.getRepoTree(
        repo.owner.login,
        repo.name,
        repo.default_branch
      );
      
      // Build file tree
      const fileTree = githubService.buildFileTree(treeItems);
      setRepoFiles(fileTree);
      fileSystem.setFiles(fileTree);
      
      toast.success(`Loaded ${repo.full_name}`);
    } catch (error) {
      toast.error('Failed to load repository');
      console.error(error);
    } finally {
      setIsLoadingRepo(false);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.max(200, Math.min(400, e.clientX));
        setSidebarWidth(newWidth);
      }
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a]">
      {/* Top Bar */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#0a0a0a]/95 backdrop-blur">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#ff4d00] to-[#ff6b00] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">Kimi Coder</span>
          </div>

          {currentRepo && (
            <Button
              variant="ghost"
              onClick={() => setShowRepoSelector(true)}
              className="text-white/60 hover:text-white hover:bg-white/10 text-sm"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              {currentRepo.full_name}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Agent Mode Toggle */}
          <Button
            variant={isAgentMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsAgentMode(!isAgentMode)}
            className={isAgentMode 
              ? "bg-[#ff4d00] hover:bg-[#ff6b00] text-white" 
              : "text-white/60 hover:text-white hover:bg-white/10"
            }
          >
            <Bot className="w-4 h-4 mr-2" />
            Agent
          </Button>

          {/* Panel Toggles */}
          <Button
            variant={chatPanelVisible ? "default" : "ghost"}
            size="icon"
            onClick={() => {
              setChatPanelVisible(!chatPanelVisible);
              if (!chatPanelVisible) setActivePanel('chat');
            }}
            className={chatPanelVisible 
              ? "bg-white/10 text-white" 
              : "text-white/60 hover:text-white hover:bg-white/10"
            }
          >
            <MessageSquare className="w-4 h-4" />
          </Button>

          <Button
            variant={terminalPanelVisible ? "default" : "ghost"}
            size="icon"
            onClick={() => {
              setTerminalPanelVisible(!terminalPanelVisible);
              if (!terminalPanelVisible) setActivePanel('terminal');
            }}
            className={terminalPanelVisible 
              ? "bg-white/10 text-white" 
              : "text-white/60 hover:text-white hover:bg-white/10"
            }
          >
            <Terminal className="w-4 h-4" />
          </Button>

          {user && (
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-8 h-8 rounded-full border border-white/20"
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarVisible && (
          <>
            <div 
              className="flex-shrink-0 border-r border-white/10 bg-[#0f0f0f] flex flex-col"
              style={{ width: sidebarWidth }}
            >
              <FileExplorer />
            </div>
            <div
              className="w-1 cursor-col-resize hover:bg-[#ff4d00]/50 transition-colors"
              onMouseDown={handleResizeStart}
            />
          </>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
          <CodeEditor />
        </div>

        {/* Right Panel (Chat/Terminal) */}
        {(chatPanelVisible || terminalPanelVisible) && (
          <div className="w-96 border-l border-white/10 bg-[#0f0f0f] flex flex-col">
            {/* Panel Tabs */}
            {(chatPanelVisible && terminalPanelVisible) && (
              <div className="flex border-b border-white/10">
                {chatPanelVisible && (
                  <button
                    onClick={() => setActivePanel('chat')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      activePanel === 'chat'
                        ? 'text-[#ff4d00] border-b-2 border-[#ff4d00]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Chat
                  </button>
                )}
                {terminalPanelVisible && (
                  <button
                    onClick={() => setActivePanel('terminal')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      activePanel === 'terminal'
                        ? 'text-[#ff4d00] border-b-2 border-[#ff4d00]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Terminal
                  </button>
                )}
              </div>
            )}

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activePanel === 'chat' && chatPanelVisible && <ChatPanel />}
              {activePanel === 'terminal' && terminalPanelVisible && <TerminalPanel />}
            </div>
          </div>
        )}
      </div>

      {/* Repo Selector Modal */}
      {showRepoSelector && (
        <RepoSelector 
          onSelect={handleRepoSelect}
          onClose={() => setShowRepoSelector(false)}
        />
      )}

      {/* Diff Viewer */}
      <DiffViewer />
    </div>
  );
}
