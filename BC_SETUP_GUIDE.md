# MS Dynamics Business Central API Setup Guide

## Overview
This guide explains how to configure MS Dynamics Business Central API integration for the Professional Buyer application.

## Required Environment Variables

### 1. BC_BASE_URL
- **Value**: `https://api.businesscentral.dynamics.com/v2.0`
- **Description**: Standard Microsoft Business Central API base URL
- **Note**: This is the same for all regions

### 2. BC_TENANT_ID
- **Where to find**: Azure Portal > Azure Active Directory > Properties > Tenant ID
- **Format**: GUID (e.g., `12345678-1234-1234-1234-123456789012`)
- **Description**: Your Azure AD tenant identifier

### 3. BC_ENVIRONMENT
- **Values**: `production` or `sandbox`
- **Where to find**: Business Central Admin Center > Environments
- **Description**: The environment where your Business Central data is hosted

### 4. BC_COMPANY_ID
- **Where to find**: Business Central > Company Information > ID field
- **Format**: GUID (e.g., `87654321-4321-4321-4321-210987654321`)
- **Description**: Unique identifier for your company in Business Central

### 5. BC_CLIENT_ID & BC_CLIENT_SECRET
- **Where to get**: Azure Portal > App registrations > New registration
- **Steps**:
  1. Go to Azure Portal
  2. Navigate to "App registrations"
  3. Click "New registration"
  4. Name: "Professional Buyer API"
  5. Supported account types: "Accounts in this organizational directory only"
  6. Redirect URI: Leave blank for now
  7. After creation, copy the "Application (client) ID" → BC_CLIENT_ID
  8. Go to "Certificates & secrets" > "New client secret"
  9. Copy the secret value → BC_CLIENT_SECRET

### 6. BC_ACCESS_TOKEN
- **Description**: Bearer token for API authentication
- **How to generate**: Use Azure CLI or OAuth2 flow

## Step-by-Step Setup

### Step 1: Azure AD App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory
3. Click "App registrations" → "New registration"
4. Fill in:
   - Name: "Professional Buyer API"
   - Supported account types: "Accounts in this organizational directory only"
5. After creation, note the "Application (client) ID"

### Step 2: Generate Client Secret
1. In your app registration, go to "Certificates & secrets"
2. Click "New client secret"
3. Set description: "Professional Buyer Secret"
4. Set expiration: 24 months (recommended)
5. Copy the secret value immediately (you won't see it again)

### Step 3: Configure API Permissions
1. In your app registration, go to "API permissions"
2. Click "Add a permission"
3. Choose "Dynamics 365 Business Central"
4. Select "Delegated permissions"
5. Add these permissions:
   - `Financials.ReadWrite.All`
   - `user_impersonation`
6. Click "Grant admin consent"

### Step 4: Get Company ID
1. Open Business Central
2. Go to Company Information (search for it)
3. Copy the ID field value

### Step 5: Generate Access Token
Option A - Using Azure CLI:
```bash
az login
az account get-access-token --resource https://api.businesscentral.dynamics.com/
```

Option B - Using OAuth2 flow:
```bash
# Authorization URL
https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize?
client_id={client-id}&
response_type=code&
redirect_uri={redirect-uri}&
scope=https://api.businesscentral.dynamics.com/.default&
response_mode=query

# Token endpoint
POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id={client-id}&
client_secret={client-secret}&
code={authorization-code}&
grant_type=authorization_code&
redirect_uri={redirect-uri}
```

## Testing the Connection

After setting up all environment variables, you can test the connection:

```python
from tools import get_purchase_orders

# Test retrieving purchase orders
result = get_purchase_orders()
print(result)
```

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**
   - Check if access token is valid and not expired
   - Verify API permissions are granted
   - Ensure the app registration has correct permissions

2. **403 Forbidden**
   - Check if the user has access to Business Central
   - Verify company ID is correct
   - Ensure environment (production/sandbox) is correct

3. **404 Not Found**
   - Verify the company ID exists
   - Check if the environment name is correct
   - Ensure Business Central is properly set up

4. **Connection Timeout**
   - Check network connectivity
   - Verify the base URL is correct
   - Try increasing timeout values

## API Endpoints Used

The application uses these Business Central API endpoints:

- **GET** `/purchaseOrders` - Retrieve purchase orders
- **GET** `/purchaseInvoices` - Retrieve purchase invoices  
- **GET** `/postedPurchaseInvoices` - Retrieve posted invoices
- **POST** `/purchaseOrders` - Create new purchase orders

## Security Notes

- Store client secrets securely
- Use environment variables, never hardcode secrets
- Regularly rotate access tokens
- Monitor API usage and set up alerts
- Follow principle of least privilege for permissions