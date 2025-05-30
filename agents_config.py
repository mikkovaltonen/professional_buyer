import os
from dotenv import load_dotenv
from agents import Agent, WebSearchTool, FileSearchTool, set_default_openai_key
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions
from tools import po_posting_api, request_po_approval, send_email
from firebase_instructions import firebase_instructions

load_dotenv()

set_default_openai_key(os.getenv("OPENAI_API_KEY"))

# --- Agent: Search Agent ---
search_agent = Agent(
    name="SearchAgent",
    instructions=firebase_instructions.get_production_instruction("SearchAgent"),
    tools=[WebSearchTool()],
)

# --- Agent: Internal Knowledge Search Agent ---
internal_knowledge_agent = Agent(
    name="InternalKnowledgeSearchAgent", 
    instructions=firebase_instructions.get_production_instruction("InternalKnowledgeSearchAgent"),
    tools=[FileSearchTool(
            max_num_results=3,
            vector_store_ids=[os.getenv("VECTOR_STORE_ID")],
        ),] if os.getenv("VECTOR_STORE_ID") else [],
)

# --- Agent: Approval Specialist Agent ---
approval_agent = Agent(
    name="ApprovalSpecialistAgent",
    instructions=firebase_instructions.get_production_instruction("ApprovalSpecialistAgent"),
    tools=[request_po_approval, send_email],
)

# --- Agent: PO Posting Agent ---
po_posting_agent = Agent(
    name="POPostingAgent",
    instructions=firebase_instructions.get_production_instruction("POPostingAgent"),
    tools=[po_posting_api],
)

# --- Agent: Triage Agent ---
triage_agent = Agent(
    name="ProfessionalBuyerAssistant",
    instructions=prompt_with_handoff_instructions(
        firebase_instructions.get_production_instruction("ProfessionalBuyerAssistant")
    ),
    handoffs=[approval_agent, internal_knowledge_agent, search_agent, po_posting_agent],
)