import os
from dotenv import load_dotenv
from agents import Agent, WebSearchTool, FileSearchTool, set_default_openai_key
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions
from tools import get_account_info

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