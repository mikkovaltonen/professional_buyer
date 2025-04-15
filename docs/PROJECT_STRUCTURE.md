# AI Kysynnänennustus Assistentti - Project Structure

## Core Files and Directories

### Source Code (`src/`)

#### Components
- `src/components/ChatInterface.tsx` - Main chat interface component that handles user interactions and message display
- `src/components/ui/` - Reusable UI components (buttons, inputs, cards) using shadcn/ui
- `src/components/Navigation.tsx` - Main navigation component for the application

#### Pages
- `src/pages/Index.tsx` - Landing page component
- `src/pages/Workbench.tsx` - Main workspace for demand forecasting analysis

#### API and Services
- `src/api/chat.ts` - OpenAI API integration for chat functionality
- `src/lib/env.ts` - Environment variable configuration
- `src/lib/userService.ts` - User authentication service

### Tests
- `tests/openai-test.mjs` - OpenAI API integration test

### Configuration
- `.env` - Environment variables (not in repository)
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

### Public Assets
- `public/` - Static assets like images and icons

## Key Features by File

### Chat Implementation
```ascii
OpenAI API Call Flow:

User Input -> ChatInterface.tsx
       |
       v
    chat.ts
       |
       v
[OpenAI API] gpt-4.1
       |
       v
  Response -> UI
```

### Authentication
- Simple authentication with hardcoded credentials
- Login handled through `src/hooks/useAuth.ts`

### UI Components
- Modern, responsive design using Tailwind CSS
- Shadcn/ui component library integration
- Custom themed components in `src/components/ui/` 