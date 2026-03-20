import { useState, useEffect } from 'react';
import { githubService } from '@/services/github';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  GitBranch, 
  Star, 
  Lock, 
  Globe,
  RefreshCw,
  ExternalLink,
  FolderGit
} from 'lucide-react';
import { toast } from 'sonner';
import type { GitHubRepo } from '@/types';

interface RepoSelectorProps {
  onSelect: (repo: GitHubRepo) => void;
  onClose: () => void;
}

export function RepoSelector({ onSelect, onClose }: RepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  useEffect(() => {
    loadRepos();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = repos.filter(repo => 
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRepos(filtered);
    } else {
      setFilteredRepos(repos);
    }
  }, [searchQuery, repos]);

  const loadRepos = async () => {
    setIsLoading(true);
    try {
      const userRepos = await githubService.getRepos();
      setRepos(userRepos);
      setFilteredRepos(userRepos);
    } catch (error) {
      toast.error('Failed to load repositories');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
  };

  const handleConfirm = () => {
    if (selectedRepo) {
      onSelect(selectedRepo);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0f0f0f] border-white/10 text-white max-h-[80vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FolderGit className="w-6 h-6 text-[#ff4d00]" />
            Select Repository
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative mt-4 px-6 shrink-0">
          <Search className="absolute left-9 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#ff4d00] focus:ring-[#ff4d00]/20"
          />
        </div>

        {/* Repo List */}
        <ScrollArea className="flex-1 mt-4 px-6 min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#ff4d00]/30 border-t-[#ff4d00] rounded-full animate-spin mb-4" />
              <p className="text-white/50">Loading repositories...</p>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FolderGit className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/50">
                {searchQuery ? 'No repositories found' : 'No repositories available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => handleSelect(repo)}
                  className={`
                    p-4 rounded-xl cursor-pointer transition-all duration-200
                    ${selectedRepo?.id === repo.id
                      ? 'bg-[#ff4d00]/20 border border-[#ff4d00]/50'
                      : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">
                          {repo.name}
                        </h3>
                        {repo.private ? (
                          <Lock className="w-3 h-3 text-white/40" />
                        ) : (
                          <Globe className="w-3 h-3 text-white/40" />
                        )}
                      </div>
                      <p className="text-sm text-white/50 mt-1 line-clamp-2">
                        {repo.description || 'No description'}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {repo.default_branch}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {formatNumber(repo.stargazers_count || 0)}
                        </span>
                      </div>
                    </div>
                    
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRepos}
              disabled={isLoading}
              className="text-white/50 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <span className="text-sm text-white/40">
              {filteredRepos.length} repositories
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedRepo}
              className="bg-[#ff4d00] hover:bg-[#ff6b00] text-white disabled:opacity-50"
            >
              Open Repository
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
