import { useEffect } from 'react';
import { useAppStore } from '@/store';
import { githubService } from '@/services/github';
import { kimiService } from '@/services/kimi';
import { LoginScreen } from '@/components/LoginScreen';
import { MainLayout } from '@/components/MainLayout';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function App() {
  const { 
    isAuthenticated, 
    githubToken, 
    kimiApiKey,
    setAuth, 
    clearAuth 
  } = useAppStore();

  // Initialize services on mount
  useEffect(() => {
    if (githubToken) {
      githubService.initialize(githubToken);
      // Verify token is still valid
      githubService.getUser()
        .then(user => {
          setAuth(githubToken, user);
        })
        .catch(() => {
          clearAuth();
        });
    }
  }, [githubToken]);

  useEffect(() => {
    if (kimiApiKey) {
      kimiService.setApiKey(kimiApiKey);
    }
  }, [kimiApiKey]);

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white overflow-hidden">
      {isAuthenticated ? (
        <MainLayout />
      ) : (
        <LoginScreen />
      )}
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
