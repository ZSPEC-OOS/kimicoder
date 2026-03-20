# Kimi Coder AI

An AI-powered coding assistant that connects to the Kimi K2.5 API and provides Claude Code-like functionality with deep GitHub integration.

![Kimi Coder AI](https://v4bhwalvz4s6g.ok.kimi.link)

## Features

### Core Features
- **GitHub Integration**: OAuth authentication, repo browsing, file management
- **AI-Powered Chat**: Natural language to code with Kimi K2.5 API
- **Code Editor**: Monaco Editor with syntax highlighting for 20+ languages
- **Terminal**: xterm.js-based terminal for running commands
- **Diff Viewer**: Review changes before committing
- **Agent Mode**: Autonomous task execution with tool calling

### Advanced Features
- **File Explorer**: Tree view of repository structure
- **Auto-Commit**: AI-generated commit messages
- **Branch Management**: Create and switch branches
- **Pull Request Creation**: Generate PRs from AI changes
- **Context Awareness**: @filename mentions for file references

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Terminal**: xterm.js with addons
- **GitHub API**: Octokit
- **AI Backend**: Moonshot AI API (Kimi K2.5)
- **State Management**: Zustand

## Getting Started

### Prerequisites

1. **GitHub Personal Access Token**
   - Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Generate a new token with `repo` scope
   - Copy the token for later use

2. **Kimi API Key**
   - Sign up at [Moonshot AI Platform](https://platform.moonshot.cn/)
   - Generate an API key from your dashboard
   - Copy the key for later use

### Usage

1. **Open the Application**
   ```
   https://v4bhwalvz4s6g.ok.kimi.link
   ```

2. **Configure GitHub**
   - Enter your GitHub Personal Access Token
   - Click "Connect GitHub"

3. **Configure Kimi API**
   - Switch to the "Kimi API" tab
   - Enter your Kimi API Key
   - Click "Save API Key"

4. **Select a Repository**
   - Choose a repository from the list
   - The file tree will load automatically

5. **Start Coding**
   - Open files from the explorer
   - Use the chat panel to ask AI for help
   - Use @filename to reference files
   - Review changes in the diff viewer
   - Commit changes directly to GitHub

## AI Commands

The AI understands natural language requests:

- **Explain code**: "Explain how this function works"
- **Refactor**: "Refactor this to use async/await"
- **Add tests**: "Write unit tests for this component"
- **Find bugs**: "Find potential issues in this code"
- **Generate code**: "Create a React component that..."

### File References
Use `@filename` to reference files in your chat:
```
@App.tsx How can I improve this component?
```

### Agent Mode
Enable Agent Mode for autonomous task execution:
- The AI can read, write, and modify files
- Run terminal commands
- Search across the codebase
- Commit changes automatically

## Architecture

```
Kimi Coder AI
├── src/
│   ├── components/          # React components
│   │   ├── LoginScreen.tsx  # Authentication UI
│   │   ├── MainLayout.tsx   # Main app layout
│   │   ├── FileExplorer.tsx # File tree view
│   │   ├── CodeEditor.tsx   # Monaco editor
│   │   ├── ChatPanel.tsx    # AI chat interface
│   │   ├── TerminalPanel.tsx # xterm terminal
│   │   ├── DiffViewer.tsx   # Diff review
│   │   └── RepoSelector.tsx # Repo selection
│   ├── services/            # API services
│   │   ├── github.ts        # GitHub API
│   │   ├── kimi.ts          # Kimi AI API
│   │   └── filesystem.ts    # Virtual file system
│   ├── store/               # State management
│   │   └── index.ts         # Zustand store
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Type definitions
│   └── App.tsx              # Root component
├── public/                  # Static assets
└── package.json
```

## API Integration

### Moonshot AI (Kimi K2.5)
```
Endpoint: https://api.moonshot.cn/v1/chat/completions
Model: kimi-k2.5
```

### GitHub API
```
Base URL: https://api.github.com
Authentication: Bearer token (Personal Access Token)
```

## Development

### Local Setup

```bash
# Clone the repository
git clone <repo-url>
cd kimi-coder-ai

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file:
```env
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_KIMI_API_KEY=your_kimi_api_key
```

## Security

- All credentials are stored locally in the browser
- No server-side storage of API keys
- GitHub token requires minimal permissions (`repo` scope)
- All API calls are made directly from the client

## Roadmap

### Phase 1 (Current)
- [x] GitHub OAuth integration
- [x] File explorer with repo tree
- [x] Monaco Editor integration
- [x] AI chat with Kimi K2.5
- [x] Terminal emulator
- [x] Diff viewer

### Phase 2 (Planned)
- [ ] Multi-repo management
- [ ] Issue/PR integration
- [ ] Code review mode
- [ ] Documentation agent
- [ ] Deployment hooks

### Phase 3 (Future)
- [ ] Real-time collaboration
- [ ] Plugin system
- [ ] Custom AI models
- [ ] VS Code extension

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Moonshot AI](https://platform.moonshot.cn/) for the Kimi API
- [GitHub](https://github.com/) for the GitHub API
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [xterm.js](https://xtermjs.org/) for the terminal emulator
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
