This is the [assistant-ui](https://github.com/Yonom/assistant-ui) starter project.

## Features

- 🤖 **AI-Powered Agents**: Sales and Support agents with specialized tools
- 📁 **File Upload Support**: Upload and analyze images and documents
- 💬 **Real-time Chat**: Stream responses with tool calling
- 🔐 **Authentication**: Secure user authentication with NextAuth
- 👥 **Admin System**: Simple environment-based admin management

## Code Style & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting to maintain consistent code style.

### Standards
- **Quotes**: Double quotes (`"`)
- **Trailing commas**: Always
- **Indentation**: 2 spaces
- **Line endings**: LF (Unix-style)
- **Semicolons**: Always

### Editor Setup

We recommend installing the Biome extension for your editor:
- **VS Code**: The project includes VS Code settings that will prompt you to install the Biome extension
- **Other editors**: Install the EditorConfig plugin to respect `.editorconfig` settings

### Running Linter

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

All code is automatically formatted according to `biome.json` configuration.

## Getting Started

First, add your OpenAI API key to `.env.local` file:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## File Upload

The application supports file uploads for images and documents. Users can:
- Upload files by clicking the "+" button in the chat
- Drag and drop files onto the composer
- Attach multiple files to a single message
- The AI (powered by GPT-4o) can analyze images and extract text from documents

For more details, see [File Upload Documentation](docs/FILE_UPLOAD.md).

## Documentation

- [File Upload Guide](docs/FILE_UPLOAD.md) - User guide for file uploads
- [File Upload Implementation](docs/FILE_UPLOAD_IMPLEMENTATION.md) - Developer guide
- [Admin Setup](docs/ADMIN_SETUP.md) - Setting up admin users
