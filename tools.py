from agents import function_tool
import os
import json
import requests
from datetime import datetime
from typing import List, Dict, Optional

# MS Dynamics Business Central Configuration
BC_BASE_URL = "https://api.businesscentral.dynamics.com/v2.0"
BC_TENANT_ID = os.getenv('BC_TENANT_ID')
BC_CLIENT_ID = os.getenv('BC_CLIENT_ID') 
BC_CLIENT_SECRET = os.getenv('BC_CLIENT_SECRET')
BC_ENVIRONMENT = os.getenv('BC_ENVIRONMENT', 'production')
BC_COMPANY_NAME = os.getenv('BC_COMPANY_NAME', 'CRONUS FI')

def get_bc_config():
    """Get BC configuration with fresh token from environment"""
    from dotenv import load_dotenv
    import os
    
    # Force reload .env from the current working directory
    env_path = os.path.join(os.getcwd(), '.env')
    load_dotenv(dotenv_path=env_path, override=True)
    
    token = os.getenv('BC_ACCESS_TOKEN', '').strip('"').strip("'")
    
    # Debug what we're getting
    print(f"DEBUG: Raw token from env: '{os.getenv('BC_ACCESS_TOKEN', 'NOT_FOUND')}'")
    print(f"DEBUG: Stripped token length: {len(token)}")
    print(f"DEBUG: Working directory: {os.getcwd()}")
    print(f"DEBUG: .env file exists: {os.path.exists(env_path)}")
    
    return {
        'access_token': token,
        'tenant_id': BC_TENANT_ID,
        'environment': BC_ENVIRONMENT,
        'company_name': BC_COMPANY_NAME,
        'base_url': BC_BASE_URL
    }

def get_bc_access_token():
    """Get OAuth2 access token for Business Central API"""
    try:
        if not all([BC_TENANT_ID, BC_CLIENT_ID, BC_CLIENT_SECRET]):
            return None
            
        auth_url = f"https://login.microsoftonline.com/{BC_TENANT_ID}/oauth2/v2.0/token"
        
        payload = {
            'grant_type': 'client_credentials',
            'client_id': BC_CLIENT_ID,
            'client_secret': BC_CLIENT_SECRET,
            'scope': 'https://api.businesscentral.dynamics.com/.default'
        }
        
        response = requests.post(auth_url, data=payload)
        if response.status_code == 200:
            return response.json()['access_token']
        else:
            print(f"BC Auth failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"BC Auth error: {e}")
        return None

# --- Tool 1: GetPurchaseOrders() - MS Dynamics BC API ---
@function_tool
def get_purchase_orders(filter_params: Optional[str] = None) -> Dict:
    """Returns all existing purchase orders from MS Dynamics Business Central, filtered by optional query parameters.
    
    Args:
        filter_params: Optional OData filter parameters (e.g., "vendorName eq 'Acme Corp'" or "orderDate gt 2024-01-01")
    
    Returns:
        Dictionary containing purchase orders data from Business Central
    """
    try:
        print(f"LOG: Fetching purchase orders from Business Central")
        if filter_params:
            print(f"LOG: Filter parameters: {filter_params}")
        
        # Try to get real data from Business Central
        access_token = get_bc_access_token()
        
        if access_token:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            # Get company ID first
            company_url = f"{BC_BASE_URL}/{BC_TENANT_ID}/sandbox/api/v2.0/companies"
            company_response = requests.get(company_url, headers=headers)
            
            if company_response.status_code == 200:
                companies = company_response.json().get('value', [])
                target_company = next((c for c in companies if c['name'] == BC_COMPANY_NAME), None)
                
                if target_company:
                    company_id = target_company['id']
                    
                    # Get purchase orders
                    po_url = f"{BC_BASE_URL}/{BC_TENANT_ID}/sandbox/api/v2.0/companies({company_id})/purchaseOrders"
                    if filter_params:
                        po_url += f"?$filter={filter_params}"
                    
                    po_response = requests.get(po_url, headers=headers)
                    
                    if po_response.status_code == 200:
                        orders = po_response.json().get('value', [])
                        print(f"LOG: Successfully retrieved {len(orders)} purchase orders from BC")
                        return {
                            "success": True,
                            "data": orders,
                            "count": len(orders),
                            "message": f"Purchase orders retrieved successfully from Business Central"
                        }
        
        # Fallback to mock data if BC API fails
        print(f"LOG: Using fallback mock data")
        # Mock purchase orders data
        mock_orders = [
            {
                "id": "PO-2024-001",
                "vendor": "Acme Corp",
                "date": "2024-01-15",
                "amount": 15000.00,
                "currency": "EUR",
                "status": "Open",
                "description": "Office supplies and equipment"
            },
            {
                "id": "PO-2024-002",
                "vendor": "TechSupply Ltd",
                "date": "2024-01-20",
                "amount": 8500.00,
                "currency": "EUR",
                "status": "Approved",
                "description": "IT hardware and software licenses"
            },
            {
                "id": "PO-2024-003",
                "vendor": "Industrial Solutions",
                "date": "2024-02-01",
                "amount": 25000.00,
                "currency": "EUR",
                "status": "Pending",
                "description": "Manufacturing equipment"
            }
        ]
        
        # Simple filtering simulation
        filtered_orders = mock_orders
        if filter_params:
            if "Acme" in filter_params:
                filtered_orders = [order for order in mock_orders if "Acme" in order["vendor"]]
            elif "2024-02" in filter_params:
                filtered_orders = [order for order in mock_orders if "2024-02" in order["date"]]
        
        print(f"LOG: Successfully retrieved {len(filtered_orders)} purchase orders")
        return {
            "success": True,
            "data": filtered_orders,
            "count": len(filtered_orders),
            "message": "Purchase orders retrieved successfully (DUMMY DATA)"
        }
        
    except Exception as e:
        print(f"LOG: Exception in get_purchase_orders: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Error retrieving purchase orders"
        }



# --- Tool 3: get_purchase_documents() - Working BC API ---
@function_tool
def get_purchase_documents(document_type: Optional[str] = None, filter_params: Optional[str] = None) -> Dict:
    """Get purchase documents (orders, invoices, quotes) from Business Central using the working purchaseDocuments endpoint.
    
    Args:
        document_type: Filter by document type ('Order', 'Invoice', 'Quote'). If None, returns all types.
        filter_params: Additional OData filter parameters (e.g., "buyFromVendorNumber eq '10000'")
    
    Returns:
        Dictionary containing purchase documents data from Business Central
    """
    try:
        print(f"LOG: Fetching purchase documents from Business Central")
        if document_type:
            print(f"LOG: Document type filter: {document_type}")
        if filter_params:
            print(f"LOG: Additional filter parameters: {filter_params}")
        
        # Get fresh BC configuration
        config = get_bc_config()
        access_token = config['access_token']
        
        # Debug environment variables
        print(f"LOG: BC_ACCESS_TOKEN length: {len(access_token) if access_token else 0}")
        print(f"LOG: BC_TENANT_ID: {config['tenant_id']}")
        print(f"LOG: BC_ENVIRONMENT: {config['environment']}")
        print(f"LOG: BC_COMPANY_NAME: {config['company_name']}")
        
        if not access_token:
            print("LOG: No BC_ACCESS_TOKEN found, using mock data")
            return {
                "success": False,
                "error": "BC_ACCESS_TOKEN not configured",
                "message": "Business Central access token not found in environment"
            }
        
        # Build headers
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        # Build URL with company name encoding
        import urllib.parse
        encoded_company = urllib.parse.quote(config['company_name'])
        url = f"{config['base_url']}/{config['tenant_id']}/{config['environment']}/ODataV4/Company('{encoded_company}')/purchaseDocuments"
        
        # Build filters
        filters = []
        if document_type:
            filters.append(f"documentType eq '{document_type}'")
        if filter_params:
            filters.append(filter_params)
        
        if filters:
            url += "?$filter=" + " and ".join(filters)
        
        print(f"LOG: Making request to: {url}")
        
        # Make API call
        response = requests.get(url, headers=headers)
        print(f"LOG: Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            documents = data.get('value', [])
            print(f"LOG: Successfully retrieved {len(documents)} purchase documents from BC")
            
            return {
                "success": True,
                "data": documents,
                "count": len(documents),
                "document_type": document_type or "All types",
                "message": f"Retrieved {len(documents)} purchase documents from Business Central"
            }
        
        elif response.status_code == 401:
            # Include debug info in error message
            debug_info = f"Token length: {len(access_token)}, URL: {url}, Headers: Authorization Bearer [token], Accept: application/json"
            return {
                "success": False,
                "error": "Authentication failed",
                "message": f"BC_ACCESS_TOKEN is invalid or expired. Debug: {debug_info}"
            }
        
        else:
            print(f"LOG: API call failed: {response.text}")
            return {
                "success": False,
                "error": f"API call failed with status {response.status_code}",
                "message": f"Business Central API returned error: {response.text[:200]}"
            }
        
    except Exception as e:
        print(f"LOG: Exception in get_purchase_documents: {str(e)}")
        print(f"LOG: Exception type: {type(e)}")
        import traceback
        print(f"LOG: Full traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "error": f"Exception: {str(e)}",
            "message": f"Error retrieving purchase documents: {str(e)}"
        }

# --- Tool 4: get_purchase_document_lines() - Item Level Data ---
@function_tool
def get_purchase_document_lines(filter_params: Optional[str] = None) -> Dict:
    """Get purchase document lines (item-level data) from Business Central for detailed product analysis.
    
    Args:
        filter_params: OData filter parameters for searching products and quantities
                      Examples: "contains(description,'coffee')", "quantity gt 5", "type eq 'Item'"
    
    Returns:
        Dictionary containing purchase document lines with item details, quantities, and pricing
    """
    try:
        print(f"LOG: Fetching purchase document lines from Business Central")
        if filter_params:
            print(f"LOG: Filter parameters: {filter_params}")
        
        # Get fresh BC configuration
        config = get_bc_config()
        access_token = config['access_token']
        
        # Debug environment variables
        print(f"LOG: BC_ACCESS_TOKEN length: {len(access_token) if access_token else 0}")
        print(f"LOG: BC_TENANT_ID: {config['tenant_id']}")
        print(f"LOG: BC_ENVIRONMENT: {config['environment']}")
        print(f"LOG: BC_COMPANY_NAME: {config['company_name']}")
        
        if not access_token:
            print("LOG: No BC_ACCESS_TOKEN found")
            return {
                "success": False,
                "error": "BC_ACCESS_TOKEN not configured",
                "message": "Business Central access token not found in environment"
            }
        
        # Build headers
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        # Build URL with company name encoding
        import urllib.parse
        encoded_company = urllib.parse.quote(config['company_name'])
        url = f"{config['base_url']}/{config['tenant_id']}/{config['environment']}/ODataV4/Company('{encoded_company}')/purchaseDocumentLines"
        
        # Add filters if provided
        if filter_params:
            url += f"?$filter={filter_params}"
        
        print(f"LOG: Making request to: {url}")
        
        # Make API call
        response = requests.get(url, headers=headers)
        print(f"LOG: Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            lines = data.get('value', [])
            print(f"LOG: Successfully retrieved {len(lines)} purchase document lines from BC")
            
            return {
                "success": True,
                "data": lines,
                "count": len(lines),
                "message": f"Retrieved {len(lines)} purchase document lines from Business Central"
            }
        
        elif response.status_code == 401:
            # Include debug info in error message
            debug_info = f"Token length: {len(access_token)}, URL: {url}"
            return {
                "success": False,
                "error": "Authentication failed",
                "message": f"BC_ACCESS_TOKEN is invalid or expired. Debug: {debug_info}"
            }
        
        else:
            print(f"LOG: API call failed: {response.text}")
            return {
                "success": False,
                "error": f"API call failed with status {response.status_code}",
                "message": f"Business Central API returned error: {response.text[:200]}"
            }
        
    except Exception as e:
        print(f"LOG: Exception in get_purchase_document_lines: {str(e)}")
        import traceback
        print(f"LOG: Full traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "error": f"Exception: {str(e)}",
            "message": f"Error retrieving purchase document lines: {str(e)}"
        }


