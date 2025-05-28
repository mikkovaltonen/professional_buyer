import os
from dotenv import load_dotenv
from agents import Agent, function_tool, WebSearchTool, FileSearchTool, set_default_openai_key
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions

load_dotenv()

set_default_openai_key(os.getenv("OPENAI_API_KEY"))



# --- Agent: Search Agent ---
search_agent = Agent(
    name="SearchAgent",
    instructions=(
        "You immediately provide an input to the WebSearchTool to find up-to-date information on the user's query. "
        "Log: 'SearchAgent activated for real-time web search'"
    ),
    tools=[WebSearchTool()],
)

# --- Agent: Knowledge Agent ---
knowledge_agent = Agent(
    name="ProcurementKnowledgeAgent", 
    instructions=(
        "You are a procurement expertise agent. Provide detailed guidance on procurement best practices, "
        "contract negotiation strategies, supplier management, cost optimization techniques, and strategic sourcing. "
        "Use the FileSearchTool when available, otherwise provide expert knowledge on procurement topics. "
        "Log: 'ProcurementKnowledgeAgent activated for expertise consultation'"
    ),
    tools=[FileSearchTool(
            max_num_results=3,
            vector_store_ids=[os.getenv("VECTOR_STORE_ID")],
        ),] if os.getenv("VECTOR_STORE_ID") else [],
)




# --- Tool 1: Fetch account information (dummy) ---
@function_tool
def get_account_info(user_id: str) -> dict:
    """Return professional buyer account info for a given user."""
    return {
        "user_id": user_id,
        "name": "Professional Buyer Client",
        "account_status": "Active",
        "subscription_tier": "Enterprise",
        "total_savings": "$450,000",
        "contracts_managed": 127,
        "last_negotiation": "2 days ago"
    }

# --- Agent: Account Agent ---
account_agent = Agent(
    name="ProcurementAccountAgent",
    instructions=(
        "You provide Professional Buyer account information and usage statistics using the get_account_info tool. "
        "Show procurement metrics, savings achieved, and subscription details. "
        "Log: 'ProcurementAccountAgent activated for account information'"
    ),
    tools=[get_account_info],
)

# --- Agent: Triage Agent ---
triage_agent = Agent(
    name="ProfessionalBuyerAssistant",
    instructions=prompt_with_handoff_instructions("""
You are the Professional Buyer AI Assistant, specializing in procurement optimization and cost savings.
Your expertise includes:
- Contract negotiation strategies
- Supplier relationship management
- Cost reduction analysis
- Procurement process optimization
- Strategic sourcing advice

Welcome users and provide expert procurement guidance. Based on the user's intent, route to:
- AccountAgent for account-related queries
- KnowledgeAgent for procurement best practices and internal knowledge
- SearchAgent for current market trends, supplier information, or real-time procurement data

Always focus on helping users achieve the three core benefits:
1. Save money by aligning with negotiated contracts
2. Save fixed fees from internal procurement services
3. Reallocate professional buyer time from operational transactions to strategic savings
"""),
    handoffs=[account_agent, knowledge_agent, search_agent],
)


# This agent is now integrated with the Flask chatbot UI in app.py
# The triage_agent handles routing between:
# - ProcurementAccountAgent for account queries
# - ProcurementKnowledgeAgent for procurement expertise  
# - SearchAgent for real-time market data
#
# Access the chatbot at: http://localhost:5000/login
# Use credentials: admin / password123