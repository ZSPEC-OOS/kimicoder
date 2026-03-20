import { useState } from 'react';
import { useAppStore } from '@/store';
import { githubService } from '@/services/github';
import { kimiService } from '@/services/kimi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Github, Key, Code2, Sparkles, Terminal, GitBranch } from 'lucide-react';
import { toast } from 'sonner';

export function LoginScreen() {
  const [githubToken, setGithubToken] = useState('');
  const [kimiKey, setKimiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth, setKimiApiKey } = useAppStore();

  const handleGitHubLogin = async () => {
    if (!githubToken.trim()) {
      toast.error('Please enter a GitHub personal access token');
      return;
    }

    setIsLoading(true);
    try {
      githubService.initialize(githubToken);
      const user = await githubService.getUser();
      setAuth(githubToken, user);
      toast.success(`Welcome, ${user.login}!`);
    } catch (error) {
      toast.error('Invalid GitHub token. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKimiSetup = () => {
    if (!kimiKey.trim()) {
      toast.error('Please enter your Kimi API key');
      return;
    }
    kimiService.setApiKey(kimiKey);
    setKimiApiKey(kimiKey);
    toast.success('Kimi API key configured!');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff4d00]/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff4d00]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 77, 0, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 77, 0, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl px-6">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff4d00] to-[#ff6b00] mb-6 shadow-2xl shadow-[#ff4d00]/30">
            <Code2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Kimi Coder AI
          </h1>
          <p className="text-xl text-white/60 max-w-lg mx-auto">
            Describe a task. Watch the AI code. Review. Commit.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
            <Sparkles className="w-6 h-6 text-[#ff4d00] mx-auto mb-2" />
            <p className="text-sm text-white/70">AI-Powered Coding</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
            <Terminal className="w-6 h-6 text-[#ff4d00] mx-auto mb-2" />
            <p className="text-sm text-white/70">Built-in Terminal</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
            <GitBranch className="w-6 h-6 text-[#ff4d00] mx-auto mb-2" />
            <p className="text-sm text-white/70">GitHub Integration</p>
          </div>
        </div>

        {/* Auth Tabs */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <Tabs defaultValue="github" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5">
              <TabsTrigger value="github" className="data-[state=active]:bg-[#ff4d00]">
                <Github className="w-4 h-4 mr-2" />
                GitHub Login
              </TabsTrigger>
              <TabsTrigger value="kimi" className="data-[state=active]:bg-[#ff4d00]">
                <Key className="w-4 h-4 mr-2" />
                Kimi API
              </TabsTrigger>
            </TabsList>

            <TabsContent value="github" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-token" className="text-white/80">
                  GitHub Personal Access Token
                </Label>
                <Input
                  id="github-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#ff4d00] focus:ring-[#ff4d00]/20"
                />
                <p className="text-xs text-white/50">
                  Create a token at{' '}
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#ff4d00] hover:underline"
                  >
                    github.com/settings/tokens
                  </a>
                  {' '}with 'repo' scope
                </p>
              </div>
              <Button
                onClick={handleGitHubLogin}
                disabled={isLoading}
                className="w-full bg-[#ff4d00] hover:bg-[#ff6b00] text-white"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Github className="w-4 h-4 mr-2" />
                    Connect GitHub
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="kimi" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kimi-key" className="text-white/80">
                  Kimi API Key
                </Label>
                <Input
                  id="kimi-key"
                  type="password"
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
                  value={kimiKey}
                  onChange={(e) => setKimiKey(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#ff4d00] focus:ring-[#ff4d00]/20"
                />
                <p className="text-xs text-white/50">
                  Get your API key from{' '}
                  <a 
                    href="https://platform.moonshot.cn/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#ff4d00] hover:underline"
                  >
                    platform.moonshot.cn
                  </a>
                </p>
              </div>
              <Button
                onClick={handleKimiSetup}
                className="w-full bg-[#ff4d00] hover:bg-[#ff6b00] text-white"
              >
                <Key className="w-4 h-4 mr-2" />
                Save API Key
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm mt-8">
          Your credentials are stored locally in your browser
        </p>
      </div>
    </div>
  );
}
