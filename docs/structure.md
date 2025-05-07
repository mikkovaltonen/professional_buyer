# Project Structure and File Functionality

This document describes the purpose and main functionality of each source code file in the project. It is intended to help developers and stakeholders understand the codebase at a glance.

---

## Root Files

- **vite.config.ts**  
  Vite configuration file. Sets up plugins (React, custom server middleware), path aliases, and server options. Handles in-memory API endpoints for forecast data during development.

- **package.json / package-lock.json**  
  Node.js project configuration and dependency lock files.

- **README.md**  
  Main project documentation, including features, setup, and usage instructions.

---

## `src/` - Main Source Code

### App Entry

- **App.tsx**  
  Main application component. Sets up routing (login, workbench, landing page) and authentication state.

- **main.tsx**  
  Entry point for the React app. Renders the `App` component.

- **App.css / index.css / vite-env.d.ts**  
  Global styles and TypeScript environment declarations.

---

### Pages (`src/pages/`)

- **Index.tsx**  
  Landing page. Describes the product, features, and provides navigation to login and demo booking.

- **Workbench.tsx**  
  Main user workspace after login. Lets users switch between product group and product-specific forecasting tabs.

- **About.tsx**  
  (If present) About page for the application.

- **AiOptimization.tsx**  
  (If present) Page for AI-based optimization features.

- **NotFound.tsx**  
  404 page for undefined routes.

#### Insurance Subpages (`src/pages/insurance/`)

- **[Type]Insurance.tsx**  
  Pages for different insurance products (Car, Home, Life, etc.), each handling a specific insurance type.

#### API Route Pages (`src/pages/api/`)

- **apply-corrections.ts**  
  API endpoint for applying forecast corrections.

- **save-csv.ts**  
  API endpoint for saving data in CSV format.

- **update-forecast-data.ts**  
  API endpoint for updating forecast data.

---

### Components (`src/components/`)

- **ChatInterface.tsx**  
  Interactive chat component that handles user messages, displays bot responses, and manages chat sessions. Supports markdown formatting and automatic scrolling. Operates independently of image management.

- **ImageManager.tsx**  
  New component for handling image operations independently of chat sessions. Manages image upload, storage, processing, and display.

- **ProductGroupForecastContent.tsx**  
  Component for displaying and managing product group forecasts.

- **ProductSelectionContent.tsx**  
  Component for selecting and managing individual product forecasts.

- **ApplyCorrectionsButton.tsx**  
  Button component for applying forecast corrections.

- **ProtectedRoute.tsx**  
  Route protection component that ensures only authenticated users can access certain pages.

- **LoginForm.tsx**  
  User authentication form component.

- **LoginButton.tsx**  
  Login button component with authentication logic.

- **Header.tsx**  
  Application header component.

#### UI Components (`src/components/ui/`)

Contains reusable UI components built with shadcn/ui:
- **button.tsx** - Button component
- **card.tsx** - Card component
- **tabs.tsx** - Tab navigation component
- **toast.tsx** - Toast notification component
- **dialog.tsx** - Modal dialog component
- **form.tsx** - Form components
- **input.tsx** - Input field component
- **select.tsx** - Dropdown select component
- And many more UI components for building the interface

### Services (`src/services/`)

- **imageService.ts**  
  Service for handling image-related operations:
  - Image storage and retrieval
  - Image processing and analysis
  - Image display management
  - Independent image state management

- **chatSessionService.ts**  
  Service for managing chat sessions independently:
  - Session state management
  - Session lifecycle control
  - Chat history management
  - Session persistence

- **dataService.ts**  
  Service for handling data operations and transformations.

- **chartService.ts**  
  Service for chart-related operations.

- **userService.ts**  
  Service for user-related operations.

### API Integration (`src/api/`)

- **chat.ts**  
  Handles chat-related API calls, including initialization and message creation. Operates independently of image management.

- **image.ts**  
  New API module for handling image-related operations:
  - Image upload/download
  - Image processing
  - Image analysis
  - Image storage management

- **apply-corrections.ts**  
  API functions for applying forecast corrections.

- **save-csv.ts**  
  Functions for saving data in CSV format.

- **save-json.ts**  
  Functions for saving data in JSON format.

### Types (`src/types/`)

- **forecast.ts**  
  TypeScript type definitions for forecast data.

- **documents.ts**  
  TypeScript type definitions for document-related data.

- **image.ts**  
  New type definitions for image-related data:
  ```typescript
  interface ImageData {
    id: string;
    url: string;
    metadata: ImageMetadata;
    state: ImageState;
  }

  interface ImageState {
    isProcessed: boolean;
    isAnalyzed: boolean;
    analysisResults?: ImageAnalysis;
  }
  ```

- **chat.ts**  
  New type definitions for chat session management:
  ```typescript
  interface ChatSession {
    id: string;
    state: SessionState;
    messages: ChatMessage[];
    metadata: SessionMetadata;
  }

  interface SessionState {
    isActive: boolean;
    lastActivity: Date;
    status: 'idle' | 'active' | 'ended';
  }
  ```

---

### Tests (`tests/`)

- **import-sales-data-to-firestore.mjs**  
  Script for importing sales data to Firestore.

---

### Public Assets (`public/`)

- **diamond-icon.svg**  
  SVG icon for the application.

- **logo.png**  
  Application logo.

- **placeholder.svg**  
  Placeholder image.

---

## Configuration Files

- **tsconfig.json**  
  TypeScript configuration.

- **tailwind.config.ts**  
  Tailwind CSS configuration.

- **eslint.config.js**  
  ESLint configuration.

- **vercel.json**  
  Vercel deployment configuration.

- **firestore.rules**  
  Firebase Firestore security rules.

---

## Documentation

- **docs/api-specifications.md**  
  API specifications documentation.

- **docs/data-normalization.md**  
  Documentation for data normalization and field mapping.

---

This structure document provides a high-level overview of the codebase. Each file's functionality is described in human language to help developers understand the purpose and role of different components in the system. 