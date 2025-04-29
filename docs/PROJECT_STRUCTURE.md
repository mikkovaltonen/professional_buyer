# AI Kysynnänennustus Assistentti - Project Structure

## Core Files and Directories

### Source Code (`src/`)

#### Components
- `src/components/ChatInterface.tsx` - Main chat interface component that handles user interactions and message display
- `src/components/ApplyCorrectionsButton.tsx` - Component for applying forecast corrections to CSV data and exporting the results
- `src/components/ui/` - Reusable UI components (buttons, inputs, cards) using shadcn/ui
- `src/components/Navigation.tsx` - Main navigation component for the application
- `src/components/TimeChart.tsx` - Time series visualization component with multiple data series support

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
Gemini 2.5 Pro API Call Flow:

User Input -> ChatInterface.tsx
       |
       v
    chat.ts
       |
       v
[Gemini 2.5 Pro API] 
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
  - Forecast adjustment saving functionality
  - CSV export with applied corrections

### Components
- `src/components/ChatInterface.tsx`: Chat interface component with:
  - Message history display
  - File upload support
  - Image analysis capabilities
  - Real-time responses

- `src/components/ApplyCorrectionsButton.tsx`: Forecast correction application component with:
  - Extracts correction data from chat content using JSON parsing
  - Validates correction data structure (product_group, month, correction_percent, explanation)
  - Reads the main forecast data from sales_data_with_forecasts.json
  - Applies corrections to matching items based on product group and month
  - Updates forecast values and stores old forecasts
  - Saves updated data back to the system
  - Provides user feedback through toast notifications
  - Handles loading states and error cases

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

## Components
- `src/components/ProductGroupForecastContent.tsx`: Main component with:
  - Product group selection
  - Time series visualization
  - AI chat interface
  - Forecast correction application 

## Data Structure and Field Specifications

### Forecast Data Fields
- Original fields (read-only, should never be modified):
  - `Quantity`: Historical demand quantity
  - `old_forecast`: Original old forecast value
  - `new_forecast`: New forecast value
  - `old_forecast_error`: Original forecast error value

- Correction fields (can be created/modified):
  - `correction_percent`: Percentage adjustment to be applied to the forecast
  - `correction_timestamp`: Timestamp when the correction was applied
  - `explanation`: Explanation for the correction
  - `new_forecast_manually_adjusted`: New forecast value after applying the correction

### Chart Data Series
- Blue line (#4338ca): Historical demand (`Quantity`)
- Green dotted line (#10b981): Old forecast (`old_forecast`)
- Orange dotted line (#f59e0b): New forecast (`new_forecast`)
- Red line (#dc2626): Manually adjusted forecast (`new_forecast_manually_adjusted`)
- Red dotted line (#ef4444): Forecast error (`old_forecast_error`)

### Forecast Correction Process
1. When corrections are applied through the "Poimi korjaprosentit chatista ja tallenna ne tietokantaan" button:
   - The original forecast values (`forecast_12m`, `old_forecast`, etc.) must remain unchanged
   - New corrections are stored in dedicated fields (`correction_percent`, `explanation`, etc.)
   - The adjusted forecast is stored in `new_forecast_manually_adjusted`
   - Each correction includes a timestamp for tracking when it was made 