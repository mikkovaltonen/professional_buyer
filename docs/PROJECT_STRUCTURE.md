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

## Frontend Components

### Pages
- `src/pages/Workbench.tsx`: Main workbench page with:
  - Radio button selection for products
  - Product image display
  - Chat interface integration with Grok API
  - Loading states and error handling

### Components
- `src/components/ChatInterface.tsx`: Chat interface component with:
  - Message history display
  - File upload support
  - Image analysis capabilities
  - Real-time responses

### API Integration
- `src/api/chat.ts`: Grok API integration with:
  - Text-based conversations (grok-3-beta)
  - Image analysis (grok-2-vision-latest)
  - Error handling and type safety

## Environment Configuration
- `.env`: Environment variables for:
  - Grok API key (VITE_GROK_API_KEY)
  - OpenAI API key (VITE_OPENAI_API_KEY)

## UI Components
- Radio button selection for product choice
- Image display with remove functionality
- Chat interface with message history
- Loading indicators and error messages

## Data Flow
1. User selects product via radio buttons
2. Product image is displayed
3. User can interact with chat interface
4. Chat interface communicates with Grok API
5. Responses are displayed in real-time

## Error Handling
- API error handling
- Image loading states
- File upload validation
- Network error recovery 