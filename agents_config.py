import os
from dotenv import load_dotenv
from agents import Agent, FileSearchTool, set_default_openai_key
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions
from tools import (
    vector_search_tool, get_purchase_orders, get_posted_purchase_invoices
)
from firestore_service import get_agent_instructions

load_dotenv()

set_default_openai_key(os.getenv("OPENAI_API_KEY"))

# Global variables for lazy loading
_search_agent = None
_internal_knowledge_search = None
_purchase_history_search_agent = None
_triage_agent = None

def get_search_agent():
    global _search_agent
    if _search_agent is None:
        instructions = get_agent_instructions("SearchAgent")
        if not instructions:
            raise ValueError("SearchAgent instructions not loaded")
        _search_agent = Agent(
            name="SearchAgent",
            instructions=instructions,
            tools=[],
        )
    return _search_agent

def get_internal_knowledge_search():
    global _internal_knowledge_search
    if _internal_knowledge_search is None:
        instructions = get_agent_instructions("InternalKnowledgeSearch")
        if not instructions:
            raise ValueError("InternalKnowledgeSearch instructions not loaded")
        _internal_knowledge_search = Agent(
            name="InternalKnowledgeSearch",
            instructions=instructions,
            tools=[vector_search_tool],
        )
    return _internal_knowledge_search

def get_purchase_history_search_agent():
    global _purchase_history_search_agent
    if _purchase_history_search_agent is None:
        instructions = get_agent_instructions("PurchaseHistorySearchAgent")
        if not instructions:
            raise ValueError("PurchaseHistorySearchAgent instructions not loaded")
        _purchase_history_search_agent = Agent(
            name="PurchaseHistorySearchAgent",
            instructions=instructions,
            tools=[get_purchase_orders, get_posted_purchase_invoices],
        )
    return _purchase_history_search_agent

def get_triage_agent():
    global _triage_agent
    if _triage_agent is None:
        instructions = get_agent_instructions("GeneralistProcurementAgent")
        if not instructions:
            raise ValueError("GeneralistProcurementAgent instructions not loaded")
        
        # Create handoff agents lazily
        search = get_search_agent()
        internal = get_internal_knowledge_search()
        history = get_purchase_history_search_agent()
        
        _triage_agent = Agent(
            name="GeneralistProcurementAgent",
            instructions=prompt_with_handoff_instructions(instructions),
            handoffs=[search, internal, history],
        )
    return _triage_agent

# Legacy exports for compatibility - using lambda to avoid property issues
def _get_search_agent():
    return get_search_agent()

def _get_internal_knowledge_search():
    return get_internal_knowledge_search()

def _get_purchase_history_search_agent():
    return get_purchase_history_search_agent()

def _get_triage_agent():
    return get_triage_agent()

# Module-level aliases
search_agent = _get_search_agent
internal_knowledge_search = _get_internal_knowledge_search  
purchase_history_search_agent = _get_purchase_history_search_agent
triage_agent = _get_triage_agent