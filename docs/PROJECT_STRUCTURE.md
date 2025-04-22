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
- `src/api/chat.ts` - Gemini API integration for chat functionality
- `src/lib/env.ts` - Environment variable configuration
- `src/lib/` - Utility functions and services

#### Hooks
- `src/hooks/useAuth.ts` - Authentication hook for user management
- `src/hooks/` - Custom React hooks for application logic

#### Types
- `src/types/` - TypeScript type definitions and interfaces

### Tests
- `tests/` - Test files and test utilities
- `tests/openai-test.mjs` - API integration tests

### Configuration Files

#### TypeScript Configuration
- `tsconfig.json` - Base TypeScript configuration
- `tsconfig.app.json` - Application-specific TypeScript configuration
- `tsconfig.node.json` - Node.js-specific TypeScript configuration
- `tsconfig.test.json` - Test-specific TypeScript configuration

#### Build and Development Tools
- `vite.config.ts` - Vite build tool configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration for CSS processing
- `eslint.config.js` - ESLint configuration for code quality
- `components.json` - shadcn/ui component configuration

#### Deployment
- `vercel.json` - Vercel deployment configuration
- `.firebaserc` - Firebase project configuration

### Environment Configuration
- `.env` - Environment variables (not in repository)
- `.env.example` - Example environment variables template

### Public Assets
- `public/` - Static assets like images and icons

## Key Features by File

### Chat Implementation
```ascii
Gemini API Call Flow:

User Input -> ChatInterface.tsx
       |
       v
    chat.ts
       |
       v
[Gemini API] 
       |
       v
  Response -> UI
```

### Authentication
- Simple authentication with hardcoded credentials
- Login handled through `src/hooks/useAuth.ts`
- Secure storage of user data in localStorage
- Error handling and logging for authentication operations

### UI Components
- Modern, responsive design using Tailwind CSS
- Shadcn/ui component library integration
- Custom themed components in `src/components/ui/` 

## Frontend Components

### Pages
- `src/pages/Workbench.tsx`: Main workbench page with:
  - Radio button selection for products
  - Product image display
  - Chat interface integration with Gemini API
  - Loading states and error handling

### Components
- `src/components/ChatInterface.tsx`: Chat interface component with:
  - Message history display
  - File upload support
  - Image analysis capabilities
  - Real-time responses

### API Integration
- `src/api/chat.ts`: Gemini API integration with:
  - Text-based conversations
  - Image analysis capabilities
  - Error handling and type safety

## Build and Deployment Process

### Development
1. Local development using Vite
2. TypeScript for type safety
3. ESLint for code quality
4. Tailwind CSS for styling

### Testing
1. Unit tests in `tests/` directory
2. API integration tests
3. Type checking with TypeScript

### Deployment
1. Vercel for frontend deployment
2. Firebase for backend services (if needed)
3. Environment variables configuration

## Error Handling
- API error handling
- Image loading states
- File upload validation
- Network error recovery
- Authentication error handling
- Local storage error handling

## Security Considerations
- Environment variables for sensitive data
- Secure authentication flow
- Error handling for sensitive operations
- Input validation and sanitization 