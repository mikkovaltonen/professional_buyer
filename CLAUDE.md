# Claude Code Instructions

## Project Overview
This is a Procurement AI Agent Evaluator application built with React, TypeScript, and Vite. It provides AI-powered document analysis and procurement intelligence evaluation capabilities with user authentication.

## Development Commands

### Testing & Quality Assurance
```bash
# Run TypeScript type checking
npx tsc --noEmit

# Run linting
npm run lint

# Run tests
npm test
npm run test:openai
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Technologies
- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui components
- **AI Integration**: Google Gemini
- **State Management**: React Hooks
- **Authentication**: Custom auth system
- **File Processing**: Support for PDF, Excel, CSV, Word documents
- **Database**: Firebase Firestore for prompt versioning

## Project Structure
- `src/components/` - React components
- `src/lib/` - Utility functions and services
- `src/pages/` - Page components
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks
- `api/` - API proxy functions
- `docs/` - Project documentation

## Important Notes
- The project uses environment variables for API keys (see .env.example)
- The application uses Google Gemini for AI document analysis
- Authentication is required for most features
- Data processing includes document upload and AI analysis
- System prompt versioning is stored in Firebase Firestore

## Known Issues
- Some TypeScript `any` types need to be properly typed
- ESLint warnings for React hooks dependencies
- Some UI components have empty interface types
- Firebase configuration is required for prompt versioning feature

## Development Guidelines
- Always run type checking before committing
- Fix ESLint errors before creating pull requests
- Follow the established component patterns
- Use proper TypeScript types instead of `any`
- Test AI integrations thoroughly
- Ensure Firebase configuration is properly set up for prompt versioning

## Document Analysis Features

### File Processing
- **Supported formats**: PDF, Excel (.xlsx, .xls), CSV, Word (.doc, .docx)
- **Upload methods**: Drag & drop or file picker
- **File validation**: Type and size checking
- **Preview capability**: For supported document types

### AI Analysis
- **Document intelligence**: Extract key information from procurement documents
- **Structured output**: Format data for easy consumption
- **Interactive chat**: Natural language questions about documents
- **Quick actions**: Pre-built analysis prompts

### System Prompt Versioning
- **Version management**: Automatic versioning with sequential numbers
- **Evaluation tracking**: User notes and assessments for each version
- **History browsing**: View and compare all previous versions
- **Model selection**: Choose different AI models for testing

### Database Schema (Firebase)
- `version` - Sequential version number
- `systemPrompt` - The prompt text
- `evaluation` - User's assessment notes
- `savedDate` - Timestamp of creation
- `aiModel` - AI model used
- `userId` - User identifier