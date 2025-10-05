# AI Website Builder

An AI-powered website builder that allows users to create stunning websites with natural language prompts. Built with Next.js, GrapesJS, and AI integration.

🚀 **Live Demo**: [https://ai-website-builder-derick-tays-projects.vercel.app](https://ai-website-builder-derick-tays-projects.vercel.app)

## Features

- 🤖 **AI-Powered Generation**: Create websites by describing what you want
- 🎨 **Visual Editor**: Drag-and-drop interface powered by GrapesJS
- 📱 **Responsive Design**: Mobile-first approach with responsive templates
- 💾 **Project Management**: Save, edit, and manage multiple projects
- 🚀 **Instant Export**: Export your website as HTML
- 🎯 **Template Library**: Pre-built templates for various use cases
- 🔓 **No Authentication Required**: Start building immediately without sign-up

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Editor**: GrapesJS
- **API**: Next.js API Routes
- **Deployment**: Vercel

## Demo Features

The demo version includes:
- Full website builder functionality
- AI-powered website generation (mock responses)
- Project management with in-memory storage
- Template library
- HTML export functionality

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

The application includes the following API endpoints:

- `POST /api/ai/generate` - Generate website content with AI
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get specific project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `POST /api/projects/[id]/save` - Save project data
- `GET /api/projects/[id]/save` - Get project data
- `GET /api/projects/[id]/export` - Export project as HTML
- `GET /api/templates` - Get website templates

## Usage

1. **Visit the homepage**: Browse features and click "Get Started"
2. **Create Project**: Click "New Project" in the dashboard
3. **AI Generation**: Use the "Generate with AI" button to create content
4. **Edit**: Use the visual editor to customize your design
5. **Save & Export**: Save your project or export as HTML

## Future Enhancements

- Real OpenAI integration for AI generation
- Database persistence (PostgreSQL/MongoDB)
- User authentication with Clerk
- Custom domain support
- Advanced templates
- Collaboration features
- Version control

## License

MIT