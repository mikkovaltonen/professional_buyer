from agents import function_tool
import os
import json
import requests
from datetime import datetime
from typing import List, Dict, Optional

# OpenAI Configuration for Vector Search
try:
    from openai import OpenAI
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    VECTOR_STORE_ID = os.getenv('VECTOR_STORE_ID')
    client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
except ImportError:
    OpenAI = None
    client = None
    OPENAI_API_KEY = None
    VECTOR_STORE_ID = None

# --- Vector Search Tool (Internal Knowledge) ---
@function_tool
def vector_search_tool(query: str, max_results: int = 10) -> Dict:
    """Search internal vector store for procurement policies, procedures, and historical data.
    
    Args:
        query: Search query for internal knowledge
        max_results: Maximum number of results to return (default: 10)
    
    Returns:
        Dictionary containing search results from vector store
    """
    try:
        if not client or not VECTOR_STORE_ID:
            return {
                "success": False,
                "error": "OpenAI client or Vector Store ID not configured",
                "message": "Vector search not available - check OPENAI_API_KEY and VECTOR_STORE_ID"
            }
        
        print(f"LOG: Performing vector search for: {query}")
        
        # Create a temporary assistant with vector store for search
        assistant = client.beta.assistants.create(
            name="Temp Search Assistant",
            instructions="You are a search assistant for internal procurement documents.",
            model="gpt-4o-mini",
            tools=[{"type": "file_search"}],
            tool_resources={
                "file_search": {
                    "vector_store_ids": [VECTOR_STORE_ID]
                }
            }
        )
        
        # Create a thread for the search
        thread = client.beta.threads.create()
        
        # Add the search query as a message
        client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=f"Search for: {query}. Provide relevant information from the documents."
        )
        
        # Run the assistant
        run = client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=assistant.id
        )
        
        # Wait for completion and get response
        import time
        while run.status in ['queued', 'in_progress']:
            time.sleep(1)
            run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
        
        if run.status == 'completed':
            messages = client.beta.threads.messages.list(thread_id=thread.id)
            latest_message = messages.data[0]
            
            search_results = []
            if hasattr(latest_message.content[0], 'text'):
                content = latest_message.content[0].text.value
                search_results.append({
                    "content": content,
                    "relevance_score": 0.95,
                    "source": "Internal Vector Store"
                })
        
        # Cleanup
        try:
            client.beta.assistants.delete(assistant.id)
            client.beta.threads.delete(thread.id)
        except:
            pass
        
        print(f"LOG: Found {len(search_results)} relevant results")
        
        return {
            "success": True,
            "query": query,
            "results": search_results,
            "total_results": len(search_results),
            "message": f"Found {len(search_results)} relevant results for '{query}'"
        }
        
    except Exception as e:
        print(f"LOG: Exception in vector_search_tool: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Error performing vector search"
        }

# --- Tool 1: GetPurchaseOrders() - Dummy MS Dynamics BC API ---
@function_tool
def get_purchase_orders(filter_params: Optional[str] = None) -> Dict:
    """Returns all existing purchase orders, filtered by optional query parameters such as date or vendor.
    
    Args:
        filter_params: Optional filter parameters (e.g., "vendor eq 'Acme Corp'" or "date gt '2024-01-01'")
    
    Returns:
        Dictionary containing mock purchase orders data
    """
    try:
        print(f"LOG: Fetching purchase orders (DUMMY API)")
        if filter_params:
            print(f"LOG: Filter parameters: {filter_params}")
        
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


# --- Tool 2: get_purchase_invoices() - Dummy MS Dynamics BC API ---
@function_tool
def get_posted_purchase_invoices(filter_params: Optional[str] = None) -> Dict:
    """Fetches purchase invoices that have already been posted to the ledger for reporting or archiving.
    
    Args:
        filter_params: Optional filter parameters (e.g., "vendor eq 'Acme Corp'" or "postingDate gt '2024-01-01'")
    
    Returns:
        Dictionary containing mock posted purchase invoices data
    """
    try:
        print(f"LOG: Fetching posted purchase invoices (DUMMY API)")
        if filter_params:
            print(f"LOG: Filter parameters: {filter_params}")
        
        # Mock posted invoices data
        mock_invoices = [
            {
                "invoice_id": "INV-2024-001",
                "po_reference": "PO-2024-001",
                "vendor": "Acme Corp",
                "posting_date": "2024-01-18",
                "amount": 15000.00,
                "currency": "EUR",
                "status": "Posted",
                "description": "Office supplies and equipment - Invoice posted to ledger",
                "gl_account": "6100"
            },
            {
                "invoice_id": "INV-2024-002",
                "po_reference": "PO-2023-089",
                "vendor": "TechSupply Ltd",
                "posting_date": "2024-01-25",
                "amount": 8500.00,
                "currency": "EUR",
                "status": "Posted",
                "description": "IT hardware and software licenses - Posted for archiving",
                "gl_account": "6200"
            },
            {
                "invoice_id": "INV-2024-003",
                "po_reference": "PO-2023-095",
                "vendor": "Office Depot",
                "posting_date": "2024-02-05",
                "amount": 2300.00,
                "currency": "EUR",
                "status": "Posted",
                "description": "Office furniture and equipment - Archived",
                "gl_account": "6100"
            }
        ]
        
        # Simple filtering simulation
        filtered_invoices = mock_invoices
        if filter_params:
            if "Acme" in filter_params:
                filtered_invoices = [inv for inv in mock_invoices if "Acme" in inv["vendor"]]
            elif "2024-02" in filter_params:
                filtered_invoices = [inv for inv in mock_invoices if "2024-02" in inv["posting_date"]]
        
        print(f"LOG: Successfully retrieved {len(filtered_invoices)} posted purchase invoices")
        return {
            "success": True,
            "data": filtered_invoices,
            "count": len(filtered_invoices),
            "message": "Posted purchase invoices retrieved successfully (DUMMY DATA)"
        }
        
    except Exception as e:
        print(f"LOG: Exception in get_posted_purchase_invoices: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Error retrieving posted purchase invoices"
        }


