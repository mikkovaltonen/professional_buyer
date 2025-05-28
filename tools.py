from agents import function_tool

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