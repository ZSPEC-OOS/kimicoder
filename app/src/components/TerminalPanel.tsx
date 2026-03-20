import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { 
  Terminal as TerminalIcon, 
  Trash2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

export function TerminalPanel() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const { addTerminalCommand } = useAppStore();

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const terminal = new Terminal({
      theme: {
        background: '#0f0f0f',
        foreground: '#e0e0e0',
        cursor: '#ff4d00',
        selectionBackground: '#ff4d0033',
        black: '#0a0a0a',
        red: '#ff4d4d',
        green: '#4dff4d',
        yellow: '#ffff4d',
        blue: '#4d4dff',
        magenta: '#ff4dff',
        cyan: '#4dffff',
        white: '#e0e0e0',
        brightBlack: '#666666',
        brightRed: '#ff6666',
        brightGreen: '#66ff66',
        brightYellow: '#ffff66',
        brightBlue: '#6666ff',
        brightMagenta: '#ff66ff',
        brightCyan: '#66ffff',
        brightWhite: '#ffffff'
      },
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      rows: 20
    });

    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.loadAddon(new WebLinksAddon());

    terminal.open(terminalRef.current);
    fit.fit();

    terminalInstance.current = terminal;
    fitAddon.current = fit;

    // Welcome message
    terminal.writeln('\x1b[1;38;5;208m╔══════════════════════════════════════════════════════════════╗\x1b[0m');
    terminal.writeln('\x1b[1;38;5;208m║\x1b[0m           \x1b[1;38;5;208m🦆 Kimi Coder Terminal\x1b[0m                        \x1b[1;38;5;208m║\x1b[0m');
    terminal.writeln('\x1b[1;38;5;208m╠══════════════════════════════════════════════════════════════╣\x1b[0m');
    terminal.writeln('\x1b[1;38;5;208m║\x1b[0m  \x1b[38;5;245mType commands to run in your project directory\x1b[0m              \x1b[1;38;5;208m║\x1b[0m');
    terminal.writeln('\x1b[1;38;5;208m║\x1b[0m  \x1b[38;5;245mSupported: npm, node, python, git, etc.\x1b[0m                     \x1b[1;38;5;208m║\x1b[0m');
    terminal.writeln('\x1b[1;38;5;208m╚══════════════════════════════════════════════════════════════╝\x1b[0m');
    terminal.writeln('');
    terminal.write('\x1b[38;5;208m$\x1b[0m ');

    // Handle input
    let currentLine = '';
    terminal.onData((data) => {
      const code = data.charCodeAt(0);
      
      // Enter key
      if (code === 13) {
        terminal.writeln('');
        if (currentLine.trim()) {
          handleCommand(currentLine.trim());
        }
        currentLine = '';
        if (!isRunning) {
          terminal.write('\x1b[38;5;208m$\x1b[0m ');
        }
      }
      // Backspace
      else if (code === 127) {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal.write('\b \b');
        }
      }
      // Ctrl+C
      else if (code === 3) {
        terminal.writeln('^C');
        currentLine = '';
        terminal.write('\x1b[38;5;208m$\x1b[0m ');
      }
      // Regular character
      else if (code >= 32 && code <= 126) {
        currentLine += data;
        terminal.write(data);
      }
    });

    // Handle resize
    const handleResize = () => {
      fit.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, []);

  const handleCommand = async (command: string) => {
    setIsRunning(true);
    const terminal = terminalInstance.current;
    if (!terminal) return;

    terminal.writeln(`\x1b[38;5;245mRunning: ${command}\x1b[0m`);
    terminal.writeln('');

    // Mock command responses
    const mockResponses: Record<string, string> = {
      'npm install': '[1/4] Resolving packages...\n[2/4] Fetching packages...\n[3/4] Linking dependencies...\n[4/4] Building fresh packages...\n\nadded 42 packages in 2.3s',
      'npm run build': '> kimi-coder@1.0.0 build\n> vite build\n\nvite v5.0.0 building for production...\n✓ 42 modules transformed.\n✓ built in 1.23s',
      'npm run dev': '> kimi-coder@1.0.0 dev\n> vite\n\n  VITE v5.0.0  ready in 234 ms\n\n  ➜  Local:   http://localhost:5173/\n  ➜  Network: http://192.168.1.100:5173/\n  ➜  press h + enter to show help',
      'git status': 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n\n\tmodified:   src/App.tsx\n\nno changes added to commit (use "git add" and/or "git commit -a")',
      'git log --oneline': 'a1b2c3d feat: add AI chat panel\ne4f5g6h fix: terminal scrolling\ni7j8k9l refactor: file explorer\nm0n1o2p chore: update dependencies',
      'ls': 'README.md\npackage.json\npackage-lock.json\npublic/\nsrc/\ntsconfig.json\nvite.config.ts',
      'ls -la': 'total 128\ndrwxr-xr-x  12 user  staff   384 Jan 15 10:30 .\ndrwxr-xr-x   5 user  staff   160 Jan 15 10:00 ..\n-rw-r--r--   1 user  staff  2145 Jan 15 10:30 README.md\n-rw-r--r--   1 user  staff  2847 Jan 15 10:30 package.json\n-rw-r--r--   1 user  staff  52341 Jan 15 10:30 package-lock.json\ndrwxr-xr-x   4 user  staff   128 Jan 15 10:00 public\ndrwxr-xr-x  12 user  staff   384 Jan 15 10:30 src\n-rw-r--r--   1 user  staff   452 Jan 15 10:00 tsconfig.json\n-rw-r--r--   1 user  staff   389 Jan 15 10:00 vite.config.ts',
      'pwd': '/home/user/projects/kimi-coder',
      'node --version': 'v20.10.0',
      'npm --version': '10.2.3',
      'python --version': 'Python 3.11.6',
      'help': '\x1b[1mAvailable commands:\x1b[0m\n  npm install     - Install dependencies\n  npm run dev     - Start development server\n  npm run build   - Build for production\n  git status      - Check git status\n  git log         - View commit history\n  ls              - List files\n  pwd             - Print working directory\n  node --version  - Check Node.js version\n  python --version- Check Python version\n  clear           - Clear terminal\n  help            - Show this help message'
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const cmd = command.toLowerCase().trim();
    
    if (cmd === 'clear') {
      terminal.clear();
    } else if (mockResponses[cmd]) {
      terminal.writeln(mockResponses[cmd]);
    } else if (cmd.startsWith('git ')) {
      terminal.writeln(`\x1b[33mMock git command: ${command}\x1b[0m`);
      terminal.writeln('In production, this would execute the actual git command.');
    } else if (cmd.startsWith('npm ')) {
      terminal.writeln(`\x1b[33mMock npm command: ${command}\x1b[0m`);
      terminal.writeln('In production, this would execute the actual npm command.');
    } else {
      terminal.writeln(`\x1b[31mCommand not found: ${command}\x1b[0m`);
      terminal.writeln('Type "help" for available commands.');
    }

    // Add to history
    addTerminalCommand({
      id: `cmd-${Date.now()}`,
      command,
      output: mockResponses[cmd] || 'Command executed',
      exitCode: mockResponses[cmd] ? 0 : 1,
      timestamp: Date.now()
    });

    terminal.writeln('');
    terminal.write('\x1b[38;5;208m$\x1b[0m ');
    setIsRunning(false);
  };

  const handleClear = () => {
    terminalInstance.current?.clear();
    terminalInstance.current?.write('\x1b[38;5;208m$\x1b[0m ');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('Terminal content copied');
    toast.success('Terminal content copied');
  };

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-[#ff4d00]" />
          <span className="text-sm font-medium text-white">Terminal</span>
          {isRunning && (
            <span className="px-2 py-0.5 text-xs bg-[#ff4d00]/20 text-[#ff4d00] rounded-full animate-pulse">
              Running
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="w-6 h-6 text-white/50 hover:text-white hover:bg-white/10"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="w-6 h-6 text-white/50 hover:text-white hover:bg-white/10"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 p-2 overflow-hidden">
        <div 
          ref={terminalRef} 
          className="h-full w-full rounded-lg overflow-hidden"
        />
      </div>

      {/* Quick Commands */}
      <div className="px-4 py-2 border-t border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-white/40 whitespace-nowrap">Quick:</span>
          {['npm install', 'npm run dev', 'git status', 'ls'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                const terminal = terminalInstance.current;
                if (terminal) {
                  terminal.write(cmd);
                  // Simulate enter
                  setTimeout(() => {
                    terminal.writeln('');
                    handleCommand(cmd);
                    terminal.write('\x1b[38;5;208m$\x1b[0m ');
                  }, 100);
                }
              }}
              className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded transition-colors whitespace-nowrap"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
