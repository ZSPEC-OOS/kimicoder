import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { kimiService } from '@/services/kimi';
import { fileSystem } from '@/services/filesystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Code, 
  Terminal,
  FileEdit,
  Search,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import type { ChatMessage, FileNode } from '@/types';

interface MessageProps {
  message: ChatMessage;
}

function ChatMessageItem({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Parse code blocks
  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/);
        if (match) {
          const [, lang, path, code] = match;
          return (
            <div key={index} className="my-3 rounded-lg overflow-hidden bg-[#1a1a1a] border border-white/10">
              {(lang || path) && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Code className="w-3 h-3 text-[#ff4d00]" />
                    <span className="text-xs text-white/60">{path || lang || 'code'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(code.trim());
                      toast.success('Copied to clipboard');
                    }}
                    className="h-6 text-xs text-white/50 hover:text-white"
                  >
                    Copy
                  </Button>
                </div>
              )}
              <pre className="p-3 overflow-x-auto">
                <code className="text-sm font-mono text-white/90">{code.trim()}</code>
              </pre>
            </div>
          );
        }
      }
      
      // Regular text with markdown-like formatting
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((text, i) => {
            if (text.startsWith('**') && text.endsWith('**')) {
              return <strong key={i} className="text-white">{text.slice(2, -2)}</strong>;
            }
            if (text.startsWith('*') && text.endsWith('*')) {
              return <em key={i} className="text-white/80">{text.slice(1, -1)}</em>;
            }
            if (text.startsWith('`') && text.endsWith('`')) {
              return <code key={i} className="px-1.5 py-0.5 bg-white/10 rounded text-sm font-mono text-[#ff4d00]">{text.slice(1, -1)}</code>;
            }
            return text;
          })}
        </span>
      );
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-white/40 bg-white/5 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-4`}>
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${isUser 
          ? 'bg-[#ff4d00]' 
          : 'bg-gradient-to-br from-[#ff4d00]/20 to-[#ff6b00]/20 border border-[#ff4d00]/30'
        }
      `}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-[#ff4d00]" />
        )}
      </div>
      
      <div className={`
        max-w-[85%] rounded-2xl px-4 py-3
        ${isUser 
          ? 'bg-[#ff4d00] text-white rounded-tr-sm' 
          : 'bg-white/5 text-white/90 rounded-tl-sm border border-white/10'
        }
      `}>
        <div className="text-sm leading-relaxed">
          {renderContent(message.content)}
        </div>
        
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 bg-[#ff4d00] animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}

// Quick action buttons
const QUICK_ACTIONS = [
  { icon: FileEdit, label: 'Explain code', prompt: 'Explain this code to me:' },
  { icon: Code, label: 'Refactor', prompt: 'Refactor this code to improve readability:' },
  { icon: Terminal, label: 'Add tests', prompt: 'Write unit tests for this code:' },
  { icon: Search, label: 'Find bugs', prompt: 'Find potential bugs in this code:' },
];

export function ChatPanel() {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    chatMessages,
    activeFilePath,
    openFiles,
    addChatMessage,
    updateChatMessage,
    setIsAIResponding,
    clearChat,
    isAgentMode
  } = useAppStore();

  const activeFile = openFiles.find(f => f.node.path === activeFilePath);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    if (!kimiService.isConfigured()) {
      toast.error('Please configure your Kimi API key first');
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    addChatMessage(userMessage);
    setInput('');
    setIsStreaming(true);
    setIsAIResponding(true);

    // Prepare context files
    const contextFiles: FileNode[] = [];
    if (activeFile?.node.content) {
      contextFiles.push(activeFile.node);
    }

    // Add relevant files based on mentions
    const mentionRegex = /@(\S+)/g;
    const mentions = input.match(mentionRegex);
    if (mentions) {
      for (const mention of mentions) {
        const fileName = mention.slice(1);
        const file = fileSystem.getFile(fileName) || 
                    fileSystem.getAllFiles().find(f => f.name === fileName);
        if (file && file.content && !contextFiles.find(f => f.path === file.path)) {
          contextFiles.push(file);
        }
      }
    }

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    addChatMessage(assistantMessage);

    try {
      const stream = kimiService.streamChat(
        [...chatMessages, userMessage],
        contextFiles
      );

      for await (const chunk of stream) {
        updateChatMessage(assistantMessage.id, chunk);
      }

      // Mark streaming as complete
      const finalMessages = useAppStore.getState().chatMessages;
      const lastMessage = finalMessages[finalMessages.length - 1];
      if (lastMessage) {
        lastMessage.isStreaming = false;
      }

      // Parse and apply any code changes if in agent mode
      if (isAgentMode) {
        const lastContent = finalMessages[finalMessages.length - 1]?.content || '';
        const codeBlocks = kimiService.extractCodeBlocks(lastContent);
        
        for (const block of codeBlocks) {
          if (block.path) {
            // In agent mode, suggest file changes
            toast.info(`Agent suggests changes to ${block.path}`);
          }
        }
      }

    } catch (error) {
      toast.error('Failed to get AI response');
      console.error(error);
    } finally {
      setIsStreaming(false);
      setIsAIResponding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    if (activeFile) {
      setInput(`${prompt}\n\nFile: ${activeFile.node.path}`);
    } else {
      setInput(prompt);
    }
    inputRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#ff4d00]" />
          <span className="font-medium text-white">Kimi Assistant</span>
          {isAgentMode && (
            <span className="px-2 py-0.5 text-xs bg-[#ff4d00]/20 text-[#ff4d00] rounded-full border border-[#ff4d00]/30">
              Agent
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            className="w-7 h-7 text-white/50 hover:text-white hover:bg-white/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff4d00]/20 to-[#ff6b00]/20 flex items-center justify-center mb-4 border border-[#ff4d00]/20">
              <Sparkles className="w-8 h-8 text-[#ff4d00]" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              How can I help you code?
            </h3>
            <p className="text-sm text-white/50 max-w-xs mb-6">
              Ask me to write, explain, refactor, or debug code. I can also help with Git operations.
            </p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors"
                >
                  <action.icon className="w-4 h-4 text-[#ff4d00]" />
                  <span className="text-sm text-white/70">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {chatMessages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        {/* Context Hint */}
        {activeFile && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-white/5 rounded-lg text-xs text-white/50">
            <Code className="w-3 h-3" />
            <span className="truncate">Context: {activeFile.node.name}</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAgentMode 
              ? "Describe a task for the agent..." 
              : "Ask about code, request changes..."
            }
            disabled={isStreaming}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#ff4d00] focus:ring-[#ff4d00]/20"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="bg-[#ff4d00] hover:bg-[#ff6b00] text-white disabled:opacity-50"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-white/30 mt-2">
          Use @filename to reference files • Enter to send
        </p>
      </div>
    </div>
  );
}
