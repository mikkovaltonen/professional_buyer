# Professional Buyer AI Assistant

A comprehensive React application that combines AI-powered procurement intelligence with real-time ERP data integration. Built to demonstrate advanced AI capabilities in procurement workflows with function calling and structured data access.

## 🚀 Key Features

### 🤖 AI-Powered Procurement Assistant
- **Google Gemini Integration**: Advanced AI with function calling capabilities
- **Interactive Chat Interface**: Natural language conversation with procurement intelligence
- **ERP Data Integration**: Real-time access to purchase order and supplier data
- **Smart Search Functions**: AI automatically searches ERP data when relevant

### 📊 ERP System Simulation
- **Excel Data Upload**: Upload structured purchase order data to simulate ERP integration
- **Advanced Search API**: Multi-criteria search (supplier, product, date range, buyer)
- **Real-time Data Access**: AI can query your ERP data during conversations
- **Data Preview & Management**: View, download, and manage uploaded ERP data

### 📚 Knowledge Management
- **Document Upload**: Support for Markdown and text files for internal knowledge
- **Contextual AI**: AI uses your knowledge base during conversations
- **Document Conversion**: Built-in tools for Word/Excel → Markdown conversion
- **Session Initialization**: AI loads all context (prompts + knowledge + ERP data) on startup

### 🛠 Advanced Configuration
- **System Prompt Versioning**: Create, test, and manage different AI prompt strategies
- **Multi-Model Support**: Configurable AI models and parameters
- **Temperature Control**: Precision-tuned AI responses (0.2 temperature)
- **Session Management**: Smart context loading and refresh capabilities

## 💼 Use Cases

### Real-time ERP Queries
- *"Show me all orders from Tech Corp this month"*
- *"Find laptop purchases over $1000"*
- *"Which suppliers has John ordered from?"*
- *"What did we buy between January and March?"*

### Procurement Intelligence
- **Supplier Analysis**: AI searches your data to analyze supplier performance
- **Cost Optimization**: Identify pricing trends and savings opportunities
- **Purchase Pattern Analysis**: Understand buying behaviors and trends
- **Contract Intelligence**: Combine ERP data with knowledge base insights

### Advanced AI Evaluation
- **Function Calling**: Test AI's ability to use tools and APIs
- **Contextual Understanding**: Evaluate how AI combines multiple data sources
- **Multi-modal Intelligence**: Test AI with structured data + unstructured knowledge
- **Real-time Decision Support**: Assess AI as a procurement decision-making tool

## 🛠 Technologies

### Core Stack
- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn/ui components
- **AI Integration**: Google Gemini with Function Calling
- **Database**: Firebase Firestore for metadata and configurations
- **File Processing**: XLSX.js for Excel parsing, React Dropzone for uploads

### AI & Function Calling
- **Model**: Google Gemini 2.5 Pro with function declarations
- **Temperature**: 0.2 (precision-focused responses)
- **Functions**: `search_erp_data` with multi-criteria search
- **Context Management**: System prompts + knowledge base + ERP data integration

### Data Processing
- **Excel Processing**: XLSX parsing with automatic column detection
- **Search Engine**: Advanced filtering with partial string matching
- **Date Parsing**: Multiple format support including Excel serial dates
- **Field Detection**: Smart column mapping using keywords (English/Finnish)

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd procurement-ai-evaluator
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the project root and define the following variables:

```env
# Google Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL=gemini-2.5-pro-preview-06-05

# Firebase Configuration (required for data storage)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

### AI Configuration Details

**Model Settings:**
- **Model**: `gemini-2.5-pro-preview-06-05` (latest version with function calling)
- **Temperature**: `0.2` (precision-focused, less creative)
- **Functions**: `search_erp_data` automatically declared
- **Context**: System prompt + Knowledge base + ERP data loaded on session init

**Function Declaration:**
```javascript
const searchERPFunction = {
  name: "search_erp_data",
  description: "Search ERP/purchase order data with various criteria",
  parameters: {
    supplierName: "string",      // Partial supplier name matching
    productDescription: "string", // Partial product description matching  
    dateFrom: "string",          // Start date (YYYY-MM-DD)
    dateTo: "string",            // End date (YYYY-MM-DD)
    buyerName: "string"          // Partial buyer name matching
  }
}
```


**Note**: Firebase configuration is required for the system prompt versioning feature, which is a core evaluation capability.

4. **Start the development server**
```bash
npm run dev
```

The application will start at `http://localhost:5173`

## Usage

### Login Credentials
- Username: `evaluator`
- Password: `go_nogo_decision`

### Core Functionality

1. **Document Upload**: 
   - Drag and drop or select files (PDF, Excel, CSV, Word)
   - Supported formats: `.pdf`, `.xlsx`, `.xls`, `.csv`, `.doc`, `.docx`

2. **AI Analysis Session**:
   - Start an analysis session with uploaded documents
   - AI provides initial overview and insights

3. **Structured Data Extraction**:
   - **Extract Suppliers**: Get structured supplier information
   - **Extract Pricing**: Analyze pricing data and trends
   - **Extract Contracts**: Identify contract terms and conditions

4. **Interactive Analysis**:
   - Ask natural language questions about your documents
   - Get AI-powered insights and recommendations
   - Export extracted data as CSV files

5. **System Prompt Versioning**:
   - Create and manage different versions of AI system prompts
   - Evaluate and compare different prompt strategies
   - Browse version history and track improvements
   - Add evaluation notes for each prompt version

### Quick Actions

The application provides pre-built analysis prompts for:
- Supplier capability assessment
- Pricing optimization opportunities
- Contract risk analysis
- Process improvement recommendations

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── DocumentAnalysis.tsx  # Document upload and management
│   ├── ProcurementChat.tsx   # AI chat interface
│   └── LoginForm.tsx
├── hooks/              # Custom React hooks
│   └── useAuth.ts
├── lib/                # Utilities and services
│   ├── firestoreService.ts
│   └── utils.ts
├── pages/              # Page components
│   ├── Index.tsx       # Landing page
│   └── Workbench.tsx   # Main application
└── types/              # TypeScript type definitions
```

## Development

### Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### Getting Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

### Adding New Features

1. Create new components in `src/components/`
2. Add TypeScript types in `src/types/`
3. Test functionality locally
4. Ensure TypeScript checks pass

## Evaluation Scenarios

This tool is perfect for demonstrating:

1. **Document Processing**: Upload real procurement documents to see AI extraction capabilities
2. **Data Structuring**: Transform unorganized data into structured formats
3. **Natural Language Querying**: Ask complex questions about procurement data
4. **Export Integration**: Show how AI-extracted data can integrate with existing systems
5. **Process Automation**: Demonstrate potential for procurement workflow automation

## System Requirements

- Node.js 18+
- npm 8+
- Modern browser (Chrome, Firefox, Safari, Edge)
- Google Gemini API key

## Security

- No hardcoded secrets or API keys in the codebase
- Environment variables used for all sensitive configuration
- Demo credentials are intentionally public for evaluation purposes
- All API keys loaded from runtime environment

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass and code is properly formatted
5. Submit a pull request

## Deployment

The application is configured for easy deployment to Vercel or similar platforms:

1. Connect your repository to your deployment platform
2. Set the required environment variables
3. Deploy directly from your main branch

For Vercel deployment:
```bash
vercel --prod
```

## Support

For questions about the procurement AI evaluation capabilities or technical implementation, please create an issue in the repository.