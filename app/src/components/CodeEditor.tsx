import { useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Circle, 
  Save,
  FileCode
} from 'lucide-react';
import { toast } from 'sonner';

export function CodeEditor() {
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    openFiles,
    activeFilePath,
    closeFile,
    setActiveFile,
    updateFileContent
  } = useAppStore();

  const activeFile = openFiles.find(f => f.node.path === activeFilePath);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile.node.path, value);
    }
  }, [activeFile, updateFileContent]);

  const handleCloseFile = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    
    const file = openFiles.find(f => f.node.path === path);
    if (file?.isDirty) {
      const confirmed = window.confirm(`Save changes to ${file.node.name}?`);
      if (confirmed) {
        // Save logic would go here
      }
    }
    
    closeFile(path);
  };

  const handleSave = async () => {
    if (!activeFile) return;
    
    setIsSaving(true);
    try {
      // In a real implementation, this would save to GitHub
      toast.success(`Saved ${activeFile.node.name}`);
    } catch (error) {
      toast.error('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'js': '📜',
      'ts': '📘',
      'tsx': '⚛️',
      'jsx': '⚛️',
      'py': '🐍',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'yml': '⚙️',
      'yaml': '⚙️',
      'dockerfile': '🐳',
      'sh': '⌨️'
    };
    return iconMap[ext || ''] || '📄';
  };

  // Empty State
  if (openFiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
            <FileCode className="w-12 h-12 text-white/20" />
          </div>
          <h3 className="text-xl font-semibold text-white/60 mb-2">
            No file open
          </h3>
          <p className="text-sm text-white/40 max-w-xs">
            Select a file from the explorer to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      {/* Tab Bar */}
      <div className="flex items-center border-b border-white/10 bg-[#0f0f0f] overflow-x-auto">
        <div className="flex">
          {openFiles.map((file) => (
            <div
              key={file.node.path}
              onClick={() => setActiveFile(file.node.path)}
              className={`
                group flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] 
                cursor-pointer border-r border-white/5 text-sm select-none
                transition-colors duration-150
                ${file.node.path === activeFilePath
                  ? 'bg-[#0a0a0a] text-white border-t-2 border-t-[#ff4d00]'
                  : 'bg-[#0f0f0f] text-white/60 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <span className="text-base">{getFileIcon(file.node.name)}</span>
              <span className={`truncate flex-1 ${file.isDirty ? 'italic' : ''}`}>
                {file.node.name}
              </span>
              {file.isDirty && (
                <Circle className="w-2 h-2 fill-[#ff4d00] text-[#ff4d00]" />
              )}
              <button
                onClick={(e) => handleCloseFile(e, file.node.path)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        {activeFile && (
          <div className="flex items-center gap-1 px-2 border-l border-white/10 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              disabled={!activeFile.isDirty || isSaving}
              className="w-7 h-7 text-white/50 hover:text-white hover:bg-white/10"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {/* Editor */}
      {activeFile && (
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={activeFile.node.language || 'plaintext'}
            value={activeFile.node.content || ''}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
              padding: { top: 16 },
              folding: true,
              renderWhitespace: 'selection',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              }
            }}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-[#ff4d00]/30 border-t-[#ff4d00] rounded-full animate-spin" />
              </div>
            }
          />
        </div>
      )}

      {/* Status Bar */}
      {activeFile && (
        <div className="h-6 flex items-center justify-between px-3 bg-[#0f0f0f] border-t border-white/10 text-xs text-white/50">
          <div className="flex items-center gap-4">
            <span>{activeFile.node.language || 'Plain Text'}</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Ln {(activeFile.node.content?.split('\n').length || 1)}</span>
            <span>Col 1</span>
            {activeFile.isDirty && <span className="text-[#ff4d00]">Modified</span>}
          </div>
        </div>
      )}
    </div>
  );
}
