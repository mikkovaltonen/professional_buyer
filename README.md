# Professional Buyer - AI-Powered Procurement Assistant

Professional Buyer is an AI-powered procurement assistant that helps companies optimize their purchasing processes and achieve cost savings. The application integrates with Firebase for data storage and management.

## System Architecture

![Agentic Workflow](static/Agentic%20workflow%20and%20tools.png)

### Agents

**1. ProfessionalBuyerAssistant (Triage Agent)**
- Main agent that routes user queries to specialized agents
- Provides procurement expertise and guidance
- Focuses on three main benefits: cost savings, fixed payments, strategic time

**2. SearchAgent**
- Real-time web search for market trends and supplier information
- Uses WebSearchTool for external data retrieval
- Activated when current market data is needed

**3. InternalKnowledgeSearchAgent**
- Internal procurement document search agent
- Searches supplier catalogs, competed contracts, prices and products
- Uses FileSearchTool with vector store integration
- Specialized in internal data search for contract terms, pricing, and supplier information

**4. ApprovalSpecialistAgent**
- Purchase order approval and authorization agent
- Handles approval workflows and stakeholder communication
- Uses request_po_approval and send_email tools
- Processes approval workflows and automated notifications

**5. POPostingAgent (PO Posting Agent)**
- Specialized in posting purchase orders to ERP systems
- Uses po_posting_api tool
- Handles supplier, product, and price parameters

### Tools

**1. po_posting_api**
- Posts purchase orders to ERP system
- Parameters: supplier, product, price
- Returns: "PO posted successfully in ERP"
- Used by: POPostingAgent

**2. request_po_approval**
- Requests purchase order approval
- Parameters: po_number, amount, reason
- Returns: approval_id, status, estimated approval time
- Used by: ApprovalSpecialistAgent

**3. send_email**
- Sends email messages to stakeholders
- Parameters: recipient, subject, message
- Returns: email_id, delivery_status
- Used by: ApprovalSpecialistAgent

**4. WebSearchTool**
- Real-time web search
- Market trends and supplier information retrieval
- Used by: SearchAgent

**5. FileSearchTool**
- Searches vector store data
- Supplier catalogs, competed contracts, prices and products
- Used by: InternalKnowledgeSearchAgent

## Installation

1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file in the project root and add the following variables:
```
OPENAI_API_KEY="your_openai_api_key_here"
VECTOR_STORE_ID="your_vector_store_id_here"
SECRET_KEY="your_flask_secret_key_here"

# Firebase Configuration
FIREBASE_API_KEY="your_firebase_api_key"
FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
FIREBASE_PROJECT_ID="your_project_id"
FIREBASE_STORAGE_BUCKET="your_project.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
FIREBASE_APP_ID="your_app_id"
FIREBASE_MEASUREMENT_ID="your_measurement_id"

# Note: Firebase user credentials are hardcoded in the application
# Firebase user: admin@professionalbuyer.com
# Firebase password: password123 (same as app login)
```

## Deployment

### Local Development
```bash
python app.py
```

### Google Cloud Run Deployment

The application is configured for deployment on Google Cloud Run. Follow these steps:

1. **Initialize Google Cloud SDK** (if not already done):
```bash
gcloud init
gcloud auth login
```

2. **Set your project**:
```bash
gcloud config set project YOUR_PROJECT_ID
```

3. **Deploy to Cloud Run** (non-Docker source deployment with old or manually maintained env var.):
```bash
cloud run deploy professional-buyer --source . --region europe-north1 --platform managed --allow-unauthenticated --memory 512Mi --cpu 1000m --timeout 300s --max-instances 3 --concurrency 3
```

4. **Update environment variables** (if needed):
```bash
gcloud run services update professional-buyer \
  --region europe-north1 \
  --update-env-vars OPENAI_API_KEY="new_key",SECRET_KEY="new_secret"
```

5. **View deployment details**:
```bash
gcloud run revisions describe REVISION_NAME --region europe-north1
```

**Note**: The deployment automatically builds from source code without requiring Docker configuration. Environment variables are securely set during deployment.

Open browser to: http://localhost:5000

**Login Credentials:**
- Username: admin
- Password: password123

## File Structure

```
├── app.py                      # Flask web application
├── agents_config.py           # Agent configurations and instructions
├── tools.py                   # Tool functions
├── firestore_service.py      # Firestore database service
├── requirements.txt           # Python dependencies
├── app.yaml                   # Google Cloud deployment config
├── Procfile                   # Process configuration
├── templates/                 # HTML templates
│   ├── landing.html
│   ├── login.html
│   ├── workbench.html
│   └── admin.html
└── static/                    # Static files
    └── Agentic workflow and tools.png
```

## Usage

1. Log in to the web interface
2. Ask for procurement expert advice in the chat
3. Request purchase order creation: "Create purchase order for supplier X, product Y at price Z"
4. Search internal data: "Find competed contracts for supplier X"
5. Request approvals: "Request approval for purchase order 12345"
6. Search market trends and supplier information
7. Use chat controls:
   - **Reset Chat** - Clear conversation and start fresh
   - **Attach Documents** - Attach PDF, Word, image or text files

## Key Features

### Specialized AI Agents
- **Internal Knowledge Search** - Supplier catalogs, contracts, pricing
- **Approval Processes** - Automated approval workflows and email notifications
- **ERP Integration** - Direct purchase order posting to systems
- **Market Analysis** - Real-time competitor and pricing information

### User Interface Features
- **Reset Chat** - Clear conversation with one click
- **Attach Documents** - Upload files for analysis (PDF, Word, images)
- **Quick Actions** - Quick selection buttons for common queries
- **Responsive Design** - Works on all devices
- **Firebase Integration** - Real-time data storage and management

### Key Benefits
1. **Save Money** - Align with negotiated contracts
2. **Save Fixed Costs** - Internal procurement services
3. **Strategic Time** - Free up from operational transactions for strategic savings

## Dependencies

The application uses these main components:
- Flask==3.1.1
- openai-agents==0.0.14
- python-dotenv==1.1.0
- agents library (OpenAI)
- Firebase SDK for data management

See requirements.txt for the complete list of dependencies.