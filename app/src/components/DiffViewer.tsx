import { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Check, 
  Undo,
  GitCommit,
  Plus,
  Minus,
  FileCode
} from 'lucide-react';
import { toast } from 'sonner';

interface DiffLineProps {
  line: string;
  type: 'added' | 'removed' | 'context';
  lineNumber: number;
}

function DiffLine({ line, type, lineNumber }: DiffLineProps) {
  const bgColor = {
    added: 'bg-green-500/10',
    removed: 'bg-red-500/10',
    context: 'bg-transparent'
  }[type];

  const borderColor = {
    added: 'border-l-green-500',
    removed: 'border-l-red-500',
    context: 'border-l-transparent'
  }[type];

  const icon = {
    added: <Plus className="w-3 h-3 text-green-500" />,
    removed: <Minus className="w-3 h-3 text-red-500" />,
    context: null
  }[type];

  return (
    <div className={`flex ${bgColor} border-l-2 ${borderColor}`}>
      <div className="w-12 flex-shrink-0 text-right pr-3 py-0.5 text-xs text-white/30 select-none">
        {lineNumber}
      </div>
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        {icon}
      </div>
      <pre className="flex-1 py-0.5 pr-4 text-sm font-mono text-white/90 overflow-x-auto">
        <code>{line || ' '}</code>
      </pre>
    </div>
  );
}

export function DiffViewer() {
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  
  const {
    diffViewOpen,
    diffViewFile,
    pendingChanges,
    setDiffViewOpen,
    setDiffViewFile,
    removePendingChange,
    setPendingChanges,
    currentRepo
  } = useAppStore();

  const currentDiff = pendingChanges.find(c => c.path === diffViewFile);

  const handleAccept = async () => {
    if (!currentDiff || !currentRepo) return;

    setIsCommitting(true);
    try {
      // In a real implementation, this would commit to GitHub
      toast.success(`Changes to ${currentDiff.path} accepted`);
      removePendingChange(currentDiff.path);
      setDiffViewOpen(false);
    } catch (error) {
      toast.error('Failed to accept changes');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReject = () => {
    if (!currentDiff) return;
    
    removePendingChange(currentDiff.path);
    toast.info(`Changes to ${currentDiff.path} rejected`);
    setDiffViewOpen(false);
  };

  const handleCommitAll = async () => {
    if (!currentRepo || pendingChanges.length === 0) return;

    const msg = commitMessage || `Update ${pendingChanges.length} file(s)`;
    setIsCommitting(true);
    
    try {
      // In a real implementation, this would commit all changes to GitHub
      toast.success(`Committed: ${msg}`);
      setPendingChanges([]);
      setCommitMessage('');
    } catch (error) {
      toast.error('Failed to commit changes');
    } finally {
      setIsCommitting(false);
    }
  };

  // Parse diff into lines
  const parseDiff = (oldContent: string, newContent: string) => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const result: Array<{ line: string; type: 'added' | 'removed' | 'context'; lineNumber: number }> = [];
    
    // Simple diff algorithm - in production, use a proper diff library
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      
      if (oldLine === newLine) {
        result.push({ line: oldLine, type: 'context', lineNumber: i + 1 });
      } else {
        if (oldLine !== undefined) {
          result.push({ line: oldLine, type: 'removed', lineNumber: i + 1 });
        }
        if (newLine !== undefined) {
          result.push({ line: newLine, type: 'added', lineNumber: i + 1 });
        }
      }
    }
    
    return result;
  };

  // Empty state if no diff viewer open
  if (!diffViewOpen) {
    // Show pending changes indicator in a floating button
    if (pendingChanges.length > 0) {
      return (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setDiffViewOpen(true)}
            className="bg-[#ff4d00] hover:bg-[#ff6b00] text-white shadow-lg"
          >
            <GitCommit className="w-4 h-4 mr-2" />
            {pendingChanges.length} pending change{pendingChanges.length !== 1 ? 's' : ''}
          </Button>
        </div>
      );
    }
    return null;
  }

  return (
    <Dialog open={diffViewOpen} onOpenChange={setDiffViewOpen}>
      <DialogContent className="max-w-4xl bg-[#0f0f0f] border-white/10 text-white max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GitCommit className="w-6 h-6 text-[#ff4d00]" />
            Review Changes
          </DialogTitle>
        </DialogHeader>

        {/* File Tabs */}
        {pendingChanges.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {pendingChanges.map((change) => (
              <button
                key={change.path}
                onClick={() => setDiffViewFile(change.path)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors
                  ${diffViewFile === change.path
                    ? 'bg-[#ff4d00]/20 text-[#ff4d00] border border-[#ff4d00]/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{change.path.split('/').pop()}</span>
                  <span className="text-xs">
                    <span className="text-green-500">+{change.additions}</span>
                    <span className="text-red-500 ml-1">-{change.deletions}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Diff Content */}
        {currentDiff ? (
          <>
            <div className="flex items-center justify-between mt-4 py-2 px-3 bg-white/5 rounded-t-lg border border-white/10">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-white/50" />
                <span className="text-sm font-medium">{currentDiff.path}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-500 flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  {currentDiff.additions} additions
                </span>
                <span className="text-red-500 flex items-center gap-1">
                  <Minus className="w-3 h-3" />
                  {currentDiff.deletions} deletions
                </span>
              </div>
            </div>

            <ScrollArea className="flex-1 border border-t-0 border-white/10 rounded-b-lg bg-[#0a0a0a]">
              <div className="py-2">
                {parseDiff(currentDiff.oldContent, currentDiff.newContent).map((line, index) => (
                  <DiffLine
                    key={index}
                    line={line.line}
                    type={line.type}
                    lineNumber={line.lineNumber}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={handleReject}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Undo className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAccept}
                  disabled={isCommitting}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept Changes
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <GitCommit className="w-12 h-12 text-white/20 mb-4" />
            <p className="text-white/50">No changes to review</p>
          </div>
        )}

        {/* Commit All Section */}
        {pendingChanges.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Commit message (optional)"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-[#ff4d00] focus:outline-none"
              />
              <Button
                onClick={handleCommitAll}
                disabled={isCommitting}
                className="bg-[#ff4d00] hover:bg-[#ff6b00] text-white"
              >
                <GitCommit className="w-4 h-4 mr-2" />
                Commit All ({pendingChanges.length})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
