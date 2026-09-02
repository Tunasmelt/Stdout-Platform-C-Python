# Stdout

An interactive coding education platform for learning Python and C/C++ with real-time WASM-based code execution, offline capabilities, and a comprehensive lesson management system.

## 🚀 Features

- **Real-time Code Execution**: Run Python and C/C++ code directly in your browser using WebAssembly (Pyodide for Python, Emscripten for C/C++)
- **Offline-First Architecture**: Learn anywhere with Dexie.js/IndexedDB local caching and automatic sync when online
- **Interactive Lessons**: Structured lesson content with embedded code examples and exercises
- **Teacher CMS**: Comprehensive content management system for creating and managing educational content
- **Assessment System**: Hybrid quiz + self-report assessment for personalized learning paths
- **Monaco Editor**: Professional code editing experience with syntax highlighting and IntelliSense
- **Responsive Design**: Beautiful, accessible UI built with Tailwind CSS
- **PWA Support**: Install as a desktop app for offline access

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + RLS) as system of record
- **Local Storage**: Dexie.js / IndexedDB for offline caching and write queue
- **Code Execution**: 
  - Primary: WebAssembly (Pyodide for Python, Emscripten for C/C++)
  - Fallback: Stateless serverless execution harness
- **UI**: Tailwind CSS (no component libraries)
- **Editor**: Monaco Editor
- **State Management**: Zustand
- **Package Manager**: pnpm
- **Authentication**: Supabase Auth (email/password confirmed)

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn
- Supabase account and project

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "C++ Platform"
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations**
   - Set up your Supabase database tables following the schema in `supabase/migrations/`
   - Configure Row Level Security (RLS) policies as documented in the architecture specs

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Usage

### For Students

1. **Sign up**: Create an account using email/password authentication
2. **Take assessment**: Complete the initial quiz and self-report to get personalized recommendations
3. **Start learning**: Browse lessons, write code, and see results instantly
4. **Track progress**: Your progress is automatically synced when online

### For Teachers

1. **Request teacher role**: Contact admin to be promoted to teacher role
2. **Access CMS**: Use the teacher dashboard to create and manage lessons
3. **Create content**: Write lessons with embedded code examples and exercises
4. **Monitor students**: Track student progress and engagement

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # Reusable React components
├── lib/                    # Utility functions and shared logic
├── stores/                 # Zustand state management stores
├── types/                  # TypeScript type definitions
├── supabase/              # Database migrations and Supabase config
├── public/                # Static assets and service worker
└── ui/                    # Design mockups and UI components
```

## 🔧 Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier

### Code Style

- TypeScript strict mode enabled
- No `any` types without explanatory comments
- Tailwind CSS for styling (no external component libraries)
- Follow existing code patterns and conventions

## 🏗 Architecture

The platform follows a phase-based development approach:

- **Phase 1**: Core infrastructure (Next.js setup, Supabase integration, authentication)
- **Phase 2**: Lesson system with basic content delivery
- **Phase 3**: Assessment and personalization
- **Phase 4**: Teacher CMS for content management
- **Phase H**: Execution harness (stateless serverless fallback)
- **Phase O**: Offline-first capabilities with Dexie.js sync

Key architectural principles:
- WASM-primary execution (no server-side code runners)
- Local DB as cache + outbox, never source of truth
- Execution harness is stateless and database-free
- Solution code and quiz answers never sent to client

## 🧪 Testing

Manual testing is required for:
- WASM runner functionality before phase completion
- Offline → online transitions and queue draining
- PWA installation and offline caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (following commit message conventions)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Never commit directly to main/master
- Follow the existing code style and patterns
- Add tests for new features when applicable
- Update documentation as needed
- Respect the phase-based development order

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📸 Screenshots

### Platform Views

**Dashboard**
![Dashboard](screenshots/dashboard.png)
*Main student dashboard showing progress, available lessons, and recommended content*

**Lesson Interface**
![Lesson View](screenshots/lesson-view.png)
*Interactive lesson view with Monaco code editor, real-time execution, and lesson content*

**Assessment Flow**
![Assessment](screenshots/assessment.png)
*Initial assessment quiz and self-report for personalized learning paths*

**Teacher CMS**
![Teacher Dashboard](screenshots/teacher-cms.png)
*Teacher content management system for creating and managing lessons*

**Offline Mode**
![Offline Mode](screenshots/offline-mode.png)
*Offline capability indicator and local queue management*

> *Note: Screenshots will be added as the platform develops. The placeholder views above represent the key user experiences planned for Stdout.*

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Auth and database powered by [Supabase](https://supabase.com/)
- Code execution via [Pyodide](https://pyodide.org/) and [Emscripten](https://emscripten.org/)
- Editor courtesy of [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For support, email support@stdout.dev or open an issue in the repository.

---

**Built with ❤️ for the coding education community**
