#!/usr/bin/env python3
"""
Script to migrate hardcoded agent instructions to Firebase
Run this once to populate initial data
"""

import os
import sys
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

# Import after loading env
import firebase_admin
from firebase_admin import credentials, firestore
import json

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        if not firebase_admin._apps:
            # Use Application Default Credentials for simplicity
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {
                'projectId': os.getenv('FIREBASE_PROJECT_ID')
            })
        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None

def migrate_instructions():
    """Migrate hardcoded instructions to Firestore"""
    
    db = initialize_firebase()
    if not db:
        print("Failed to initialize Firebase")
        return
    
    # Hardcoded instructions from agents_config.py
    instructions_data = {
        'SearchAgent': {
            'instructions': "You immediately provide an input to the WebSearchTool to find up-to-date information on the user's query. Log: 'SearchAgent activated for real-time web search'",
            'evaluointi': 'Initial default instruction for real-time web search capability',
            'trace_id': 'initial_migration'
        },
        'InternalKnowledgeSearchAgent': {
            'instructions': "You are the Internal Knowledge Search Agent responsible for searching internal procurement data. Use the FileSearchTool to find and retrieve: - Toimittaja katalogit (supplier catalogs) - Kilpailutetut sopimukset (competitive contracts) - Kilpailutetut hinnat (competitive pricing) - Tuotteet (products) Search internal vector store for procurement information, contract terms, pricing data, and supplier details. Log: 'InternalKnowledgeSearchAgent activated for internal data search'",
            'evaluointi': 'Initial default instruction for internal knowledge search and procurement data retrieval',
            'trace_id': 'initial_migration'
        },
        'ApprovalSpecialistAgent': {
            'instructions': "You are the Approval Specialist Agent responsible for handling purchase order approvals and notifications. Use request_po_approval tool to process approval requests and send_email tool to notify stakeholders. Handle approval workflows, authorization processes, and communication with approvers. Log: 'ApprovalSpecialistAgent activated for PO approval processing'",
            'evaluointi': 'Initial default instruction for PO approval and notification workflows',
            'trace_id': 'initial_migration'
        },
        'POPostingAgent': {
            'instructions': "You are the PO Posting Agent responsible for posting purchase orders to ERP system. When users request to create or post purchase orders, use the po_posting_api tool which takes toimittaja (supplier), tuote (product), and hinta (price) as parameters. Always respond with confirmation when PO is posted successfully. Log: 'POPostingAgent activated for PO posting to ERP'",
            'evaluointi': 'Initial default instruction for ERP integration and PO posting',
            'trace_id': 'initial_migration'
        },
        'ProfessionalBuyerAssistant': {
            'instructions': """You are the Professional Buyer AI Assistant, specializing in procurement optimization and cost savings.
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
3. Reallocate professional buyer time from operational transactions to strategic savings""",
            'evaluointi': 'Initial default instruction for main triage agent with comprehensive routing logic',
            'trace_id': 'initial_migration'
        }
    }
    
    # Migrate each agent's instructions
    for agent_name, data in instructions_data.items():
        try:
            doc_data = {
                'tallennus_paiva': datetime.now(),
                'tallentajan_nimi': 'system_migration',
                'instructions': data['instructions'],
                'evaluointi': data['evaluointi'],
                'trace_id': data['trace_id']
            }
            
            collection_ref = db.collection(f'agent_instructions_{agent_name}')
            doc_ref = collection_ref.add(doc_data)
            print(f"✓ Migrated instructions for {agent_name} - Doc ID: {doc_ref[1].id}")
            
        except Exception as e:
            print(f"✗ Error migrating {agent_name}: {e}")
    
    print("\nMigration completed!")

if __name__ == "__main__":
    migrate_instructions()