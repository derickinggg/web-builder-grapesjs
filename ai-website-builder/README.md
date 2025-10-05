# AI Website Builder

An AI-powered website builder that allows users to create stunning websites with natural language prompts. Built with Next.js, GrapesJS, and AI integration.

## Features

- 🤖 **AI-Powered Generation**: Create websites by describing what you want
- 🎨 **Visual Editor**: Drag-and-drop interface powered by GrapesJS
- 🔐 **User Authentication**: Secure authentication with Clerk
- 📱 **Responsive Design**: Mobile-first approach with responsive templates
- 💾 **Project Management**: Save, edit, and manage multiple projects
- 🚀 **Instant Deployment**: One-click deployment to Vercel
- 🎯 **Template Library**: Pre-built templates for various use cases

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Editor**: GrapesJS
- **Authentication**: Clerk
- **AI**: OpenAI API (or mock for demo)
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment

The app is configured for easy deployment to Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the environment variables
4. Deploy!

## Usage

1. **Sign Up/Sign In**: Create an account or sign in
2. **Create Project**: Click "New Project" to start
3. **AI Generation**: Use the "Generate with AI" button to describe your website
4. **Edit**: Use the visual editor to customize your design
5. **Save & Export**: Save your project or export as HTML

## License

MIT