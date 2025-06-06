# Operatiivisen Hankinnan AI-Assistentti (Professional Buyer)

Operatiivisen hankinnan AI-assistentti auttaa sivutoimisia ostajia tekemään oikeita ostopäätöksiä päivittäisessä työssään. Järjestelmä integroi Microsoft Dynamics Business Central ERP:iin ja Firebase-tietokantaan.

## System Architecture

![Agentic Workflow](static/Agentic%20workflow%20and%20tools.png)

### Agentit

**1. GeneralistProcurementAgent (Triage Agent)**
- Pääagentti joka ohjaa käyttäjien kyselyt erikoisagenteille
- Operatiivisen hankinnan asiantuntija ja koordinaattori
- Keskittyy päivittäisten ostopäätösten tukemiseen

**2. SearchAgent**
- Harvinainen julkinen haku toimittajista ja tuotteista
- Käytetään vain jos sisäinen tieto ei riitä
- Reaaliaikainen web-haku markkinatrendeihin

**3. InternalKnowledgeSearch**
- Sisäisten hankintaohjeiden ja -käytäntöjen haku
- Etsii vektorihakutekniikalla sopimuksia, hintoja ja tuotteita
- Käyttää FileSearchTool-vektorihakua

**4. PurchaseHistorySearchAgent**
- Ostoshistorian haku - missä vastaavia tuotteita on ostettu aiemmin
- Integroi MS Dynamics Business Central ERP:iin
- Käyttää GetPurchaseOrders(), get_purchase_document_lines(), get_purchase_invoices() työkaluja

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

### Core Application Settings
```
OPENAI_API_KEY="your_openai_api_key_here"
VECTOR_STORE_ID="your_vector_store_id_here"
SECRET_KEY="your_flask_secret_key_here"
```

### Firebase Configuration
```
FIREBASE_API_KEY="your_firebase_api_key"
FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
FIREBASE_PROJECT_ID="your_project_id"
FIREBASE_STORAGE_BUCKET="your_project.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
FIREBASE_APP_ID="your_app_id"
FIREBASE_MEASUREMENT_ID="your_measurement_id"
```

### Microsoft Dynamics Business Central Integration
```
BC_BASE_URL="https://api.businesscentral.dynamics.com/v2.0"
BC_TENANT_ID="your_azure_tenant_id"
BC_ENVIRONMENT="Production"  # or "Sandbox"
BC_COMPANY_NAME="your_company_name"
BC_CLIENT_ID="your_azure_app_client_id"
BC_CLIENT_SECRET="your_azure_app_client_secret"
BC_ACCESS_TOKEN="your_current_access_token"
```

## Business Central Setup

### 1. Azure AD App Registration
1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory
2. Navigate to "App registrations" → "New registration"
3. Name: "Professional Buyer API"
4. Supported account types: "Accounts in this organizational directory only"
5. Copy the "Application (client) ID" → `BC_CLIENT_ID`

### 2. Generate Client Secret
1. In your app registration → "Certificates & secrets"
2. Click "New client secret"
3. Copy the secret value → `BC_CLIENT_SECRET`

### 3. Configure API Permissions
1. In app registration → "API permissions" → "Add a permission"
2. Choose "Dynamics 365 Business Central"
3. Add permissions: `Financials.ReadWrite.All`, `user_impersonation`
4. Click "Grant admin consent"

### 4. Get Access Token
Using Azure CLI:
```bash
az login
az account get-access-token --resource https://api.businesscentral.dynamics.com/
```

### 5. Test Connection
```python
from tools import get_purchase_orders
result = get_purchase_orders()
print(result)
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