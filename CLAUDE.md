# Claude Code Instructions

## Project Overview
This is a demand forecasting assistant application built with React, TypeScript, and Vite. It provides AI-powered demand forecasting capabilities with data visualization and user authentication.

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
- **Charts**: Chart.js, Recharts
- **AI Integration**: Google Gemini, Anthropic Claude, OpenAI
- **State Management**: React Query
- **Authentication**: Custom auth system
- **File Processing**: PapaParse for CSV handling

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
- API calls are proxied through Vercel functions for security
- The application supports multiple AI providers for forecasting
- Authentication is required for most features
- Data processing includes CSV parsing and normalization

## Known Issues
- Some TypeScript `any` types need to be properly typed
- ESLint warnings for React hooks dependencies
- Some UI components have empty interface types

## Development Guidelines
- Always run type checking before committing
- Fix ESLint errors before creating pull requests
- Follow the established component patterns
- Use proper TypeScript types instead of `any`
- Test AI integrations thoroughly

## API Testing & Debugging

### Console Debug Functions
- `debugApiCall()` - Test API with default payload
- `debugApiCall({prod_class: "test"})` - Test with custom data

### API Debugging Steps
1. Use "Test API" button in UI
2. Check browser console for detailed logs
3. Verify form-encoded data format (not JSON)
4. Check Laravel API expects `application/x-www-form-urlencoded`

### Common Issues
- **Error 500**: Usually incorrect Content-Type or payload format
- **Auth errors**: Check Bearer token in .env
- **CORS errors**: Verify proxy configuration

## Forecast Correction Features

### Data Processing
- **Automatic calculation**: `new_forecast_manually_adjusted = new_forecast * (1 + correction_percent/100)`
- **Comment storage**: Saves explanation from Gemini chat
- **Timestamp tracking**: Records when corrections were made
- **Data validation**: Fetches current forecast before calculating adjustments

### Database Fields Updated
- `correction_percent` - The percentage adjustment
- `new_forecast_manually_adjusted` - Calculated adjusted forecast value
- `explanation` - Comment/reasoning for the correction
- `correction_timestamp` - When the correction was applied

### Workflow
1. User gets JSON recommendation from Gemini
2. "Tallenna JSON" button processes corrections
3. System fetches current `new_forecast` values
4. Calculates adjusted forecasts automatically
5. Saves all data to database in one operation