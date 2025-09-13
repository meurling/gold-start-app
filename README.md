# DAIRO - Q&A Platform

DAIRO is a modern Q&A platform built with React, TypeScript, and local storage. It provides a clean interface for managing questions and answers with project-based organization.

## Features

- **Project Management**: Create and switch between multiple projects
- **Q&A System**: Ask questions and provide answers
- **Local Storage**: All data stored locally in your browser
- **AI Integration**: OpenAI integration for enhanced Q&A capabilities
- **Modern UI**: Built with shadcn/ui and Tailwind CSS

## Project info

**URL**: https://lovable.dev/projects/43fd5e9e-d19d-4728-9b3f-cca420cb9401

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/43fd5e9e-d19d-4728-9b3f-cca420cb9401) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables (optional, for AI features)
cp .env.example .env
# Edit .env and add your OpenAI API key

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Setup

### OpenAI Integration (Optional)

To enable AI-powered features, you'll need to set up your OpenAI API key:

1. **Copy the environment template:**
   ```sh
   cp .env.example .env
   ```

2. **Get your OpenAI API key:**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key

3. **Update your .env file:**
   ```env
   VITE_OPENAI_API_KEY=your_actual_api_key_here
   ```

4. **Restart the development server:**
   ```sh
   npm run dev
   ```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_OPENAI_API_KEY` | Your OpenAI API key for AI features | No | - |
| `VITE_OPENAI_BASE_URL` | Custom OpenAI base URL (for Azure OpenAI, etc.) | No | `https://api.openai.com/v1` |
| `VITE_OPENAI_DEFAULT_MODEL` | Default model to use | No | `gpt-3.5-turbo` |

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library with hooks
- **shadcn/ui** - Modern UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Local Storage** - Client-side data persistence
- **OpenAI API** - AI-powered features (optional)

## Usage

### Creating Projects

1. Click on the project selector in the sidebar
2. Select "Create New" from the dropdown
3. Enter a project name and optional description
4. Click "Create Project"

### Managing Questions and Answers

- Navigate to the "Questions" or "Answers" sections in the sidebar
- Create, edit, and manage your Q&A content
- All data is automatically saved to local storage

### AI Features (with OpenAI API key)

- Generate questions from content
- Get AI-powered answers
- Summarize content
- Enhanced Q&A capabilities

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/43fd5e9e-d19d-4728-9b3f-cca420cb9401) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
