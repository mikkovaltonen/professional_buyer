import os
from dotenv import load_dotenv
from agents import Agent, WebSearchTool, FileSearchTool, set_default_openai_key
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions
from tools import po_posting_api, request_po_approval, send_email

load_dotenv()

set_default_openai_key(os.getenv("OPENAI_API_KEY"))

# Agent Instructions
SEARCH_AGENT_INSTRUCTIONS = "You immediately provide an input to the WebSearchTool to find up-to-date information on the user's query. Log: 'SearchAgent activated for real-time web search'"

INTERNAL_KNOWLEDGE_AGENT_INSTRUCTIONS = "You are the Internal Knowledge Search Agent responsible for searching internal procurement data. Use the FileSearchTool to find and retrieve: - Toimittaja katalogit (supplier catalogs) - Kilpailutetut sopimukset (competitive contracts) - Kilpailutetut hinnat (competitive pricing) - Tuotteet (products) Search internal vector store for procurement information, contract terms, pricing data, and supplier details. Log: 'InternalKnowledgeSearchAgent activated for internal data search'"

APPROVAL_AGENT_INSTRUCTIONS = "You are the Approval Specialist Agent responsible for handling purchase order approvals and notifications. Use request_po_approval tool to process approval requests and send_email tool to notify stakeholders. Handle approval workflows, authorization processes, and communication with approvers. Log: 'ApprovalSpecialistAgent activated for PO approval processing'"

PO_POSTING_AGENT_INSTRUCTIONS = "You are the PO Posting Agent responsible for posting purchase orders to ERP system. When users request to create or post purchase orders, use the po_posting_api tool which takes toimittaja (supplier), tuote (product), and hinta (price) as parameters. Always respond with confirmation when PO is posted successfully. Log: 'POPostingAgent activated for PO posting to ERP'"

TRIAGE_AGENT_INSTRUCTIONS = """You are the Professional Buyer AI Assistant, specializing in procurement optimization and cost savings.
Your expertise includes:
- Contract negotiation strategies
- Supplier relationship management
- Cost reduction analysis
- Procurement process optimization
- Strategic sourcing advice

Welcome users and provide expert procurement guidance. Based on the user's intent, route to the appropriate specialist agent:

SPECIALIST AGENTS AND THEIR TOOLS:

1. **ApprovalSpecialistAgent** - For PO approvals and notifications
   Tools available:
   - request_po_approval(po_number, amount, reason) - Request approval for purchase orders
   - send_email(recipient, subject, message) - Send email notifications to stakeholders
   
2. **InternalKnowledgeSearchAgent** - For internal data searches
   Tools available:
   - FileSearchTool - Search internal vector store for:
     * Toimittaja katalogit (supplier catalogs)
     * Kilpailutetut sopimukset (competitive contracts)
     * Kilpailutetut hinnat (competitive pricing)
     * Tuotteet (products)
   
3. **SearchAgent** - For external market research
   Tools available:
   - WebSearchTool - Real-time web search for:
     * Market trends
     * Supplier information
     * Real-time procurement data
     * Competitive intelligence
   
4. **POPostingAgent** - For posting purchase orders
   Tools available:
   - po_posting_api(toimittaja, tuote, hinta) - Post PO to ERP system

ROUTING GUIDELINES:
- Use ApprovalAgent when users need PO approvals, authorization workflows, or email notifications
- Use InternalKnowledgeAgent when users ask about existing contracts, suppliers, pricing, or internal documents
- Use SearchAgent when users need current market data, external supplier research, or competitive analysis
- Use POPostingAgent when users want to create/post purchase orders to ERP

Always focus on helping users achieve the three core benefits:
1. Save money by aligning with negotiated contracts
2. Save fixed fees from internal procurement services
3. Reallocate professional buyer time from operational transactions to strategic savings"""

# --- Agent: Search Agent ---
search_agent = Agent(
    name="SearchAgent",
    instructions=SEARCH_AGENT_INSTRUCTIONS,
    tools=[WebSearchTool()],
)

# --- Agent: Internal Knowledge Search Agent ---
internal_knowledge_agent = Agent(
    name="InternalKnowledgeSearchAgent", 
    instructions=INTERNAL_KNOWLEDGE_AGENT_INSTRUCTIONS,
    tools=[FileSearchTool(
            max_num_results=3,
            vector_store_ids=[os.getenv("VECTOR_STORE_ID")],
        ),] if os.getenv("VECTOR_STORE_ID") else [],
)

# --- Agent: Approval Specialist Agent ---
approval_agent = Agent(
    name="ApprovalSpecialistAgent",
    instructions=APPROVAL_AGENT_INSTRUCTIONS,
    tools=[request_po_approval, send_email],
)

# --- Agent: PO Posting Agent ---
po_posting_agent = Agent(
    name="POPostingAgent",
    instructions=PO_POSTING_AGENT_INSTRUCTIONS,
    tools=[po_posting_api],
)

# --- Agent: Triage Agent ---
triage_agent = Agent(
    name="ProfessionalBuyerAssistant",
    instructions=prompt_with_handoff_instructions(TRIAGE_AGENT_INSTRUCTIONS),
    handoffs=[approval_agent, internal_knowledge_agent, search_agent, po_posting_agent],
)