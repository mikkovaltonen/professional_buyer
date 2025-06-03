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

# --- Agent: SearchAgent ---
search_agent = Agent(
    name="SearchAgent",
    instructions=get_agent_instructions("SearchAgent"),
    tools=[],
)

# --- Agent: InternalKnowledgeSearch ---
internal_knowledge_search = Agent(
    name="InternalKnowledgeSearch",
    instructions=get_agent_instructions("InternalKnowledgeSearch"),
    tools=[vector_search_tool],
)

# --- Agent: PurchaseHistorySearchAgent ---
purchase_history_search_agent = Agent(
    name="PurchaseHistorySearchAgent",
    instructions=get_agent_instructions("PurchaseHistorySearchAgent"),
    tools=[get_purchase_orders, get_posted_purchase_invoices],
)

# --- Main Triage Agent ---
triage_agent_instructions = get_agent_instructions("GeneralistProcurementAgent")
triage_agent = Agent(
    name="GeneralistProcurementAgent",
    instructions=prompt_with_handoff_instructions(triage_agent_instructions),
    handoffs=[search_agent, internal_knowledge_search, purchase_history_search_agent],
)