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
        "You immediately provide an input to the WebSearchTool to find up-to-date information on the user's query."
    ),
    tools=[WebSearchTool()],
)

# --- Agent: Knowledge Agent ---
knowledge_agent = Agent(
    name="KnowledgeAgent",
    instructions=(
        "You answer user questions on our Clasun katalpogi, helpful responses using the FileSearchTool."
    ),
    tools=[FileSearchTool(
            max_num_results=3,
            vector_store_ids=[os.getenv("VECTOR_STORE_ID")],
        ),],
)




# --- Tool 1: Fetch account information (dummy) ---
@function_tool
def get_account_info(user_id: str) -> dict:
    """Return dummy account info for a given user."""
    return {
        "user_id": user_id,
        "name": "Bugs Bunny",
        "account_balance": "£72.50",
        "membership_status": "Gold Executive"
    }

# --- Agent: Account Agent ---
account_agent = Agent(
    name="AccountAgent",
    instructions=(
        "You provide account information based on a user ID using the get_account_info tool."
    ),
    tools=[get_account_info],
)

# --- Agent: Triage Agent ---
triage_agent = Agent(
    name="Assistant",
    instructions=prompt_with_handoff_instructions("""
You are the virtual assistant for Acme Shop. Welcome the user and ask how you can help.
Based on the user's intent, route to:
- AccountAgent for account-related queries
- KnowledgeAgent for product FAQs from Klasun katalogi
- SearchAgent for anything requiring real-time web search
"""),
    handoffs=[account_agent, knowledge_agent, search_agent],
)


# %%
from agents import Runner, trace

async def test_queries():
    examples = [
        "What's my ACME account balance doc? My user ID is 1234567890", # Account Agent test
        "Ooh i've got money to spend! Mitä akkuporakoneet maksaavat klasun katalogissa?", # Knowledge Agent test
        "Hmmm, what about duck hunting gear - what's trending right now?", # Search Agent test

    ]
    with trace("ACME App Assistant"):
        for query in examples:
            result = await Runner.run(triage_agent, query)
            print(f"User: {query}")
            print(result.final_output)
            print("---")
# Run the tests
if __name__ == "__main__":
    import asyncio
    asyncio.run(test_queries())