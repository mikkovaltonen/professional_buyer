from agents import function_tool
import os
import json
from datetime import datetime

# --- Tool 1: PO Posting API ---
@function_tool
def po_posting_api(toimittaja: str, tuote: str, hinta: float) -> str:
    """Post purchase order to ERP system via API."""
    print(f"LOG: Posting PO to ERP - Toimittaja: {toimittaja}, Tuote: {tuote}, Hinta: {hinta}")
    return "PO posted successfully in ERP"

# --- Tool 2: Request PO Approval API ---
@function_tool
def request_po_approval(po_number: str, amount: float, reason: str) -> dict:
    """Request approval for a purchase order."""
    approval_data = {
        "po_number": po_number,
        "amount": amount,
        "reason": reason,
        "status": "Pending Approval",
        "timestamp": datetime.now().isoformat(),
        "approval_required": amount > 1000
    }
    
    print(f"LOG: Requesting approval for PO {po_number} - Amount: ${amount}")
    print(f"LOG: Reason: {reason}")
    
    return {
        "success": True,
        "approval_id": f"APR_{po_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "message": f"Approval request submitted for PO {po_number}",
        "status": "Pending Approval",
        "estimated_approval_time": "2-4 business hours" if amount < 10000 else "1-2 business days"
    }

# --- Tool 3: Email Tool ---
@function_tool
def send_email(recipient: str, subject: str, message: str) -> dict:
    """Send email notification."""
    email_data = {
        "to": recipient,
        "subject": subject,
        "body": message,
        "sent_at": datetime.now().isoformat(),
        "status": "sent"
    }
    
    print(f"LOG: Sending email to {recipient}")
    print(f"LOG: Subject: {subject}")
    print(f"LOG: Message: {message[:100]}...")
    
    return {
        "success": True,
        "email_id": f"EMAIL_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "message": f"Email sent successfully to {recipient}",
        "delivery_status": "delivered"
    }