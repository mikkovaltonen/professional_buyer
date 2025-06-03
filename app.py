import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from dotenv import load_dotenv
import asyncio
from agents import Runner, trace

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Global storage for agent instructions
agent_instructions_cache = {}

# Hardcoded credentials
VALID_USERNAME = "admin"
VALID_PASSWORD = "password123"

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if username == VALID_USERNAME and password == VALID_PASSWORD:
            session['logged_in'] = True
            session['username'] = username
            return redirect(url_for('workbench'))
        else:
            return render_template('login.html', error='Invalid credentials')

    return render_template('login.html')

@app.route('/workbench')
def workbench():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    
    # Firebase config for auto-loading instructions
    firebase_config = {
        'FIREBASE_API_KEY': os.getenv('FIREBASE_API_KEY'),
        'FIREBASE_AUTH_DOMAIN': os.getenv('FIREBASE_AUTH_DOMAIN'),
        'FIREBASE_PROJECT_ID': os.getenv('FIREBASE_PROJECT_ID'),
        'FIREBASE_STORAGE_BUCKET': os.getenv('FIREBASE_STORAGE_BUCKET'),
        'FIREBASE_MESSAGING_SENDER_ID': os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
        'FIREBASE_APP_ID': os.getenv('FIREBASE_APP_ID')
    }
    
    return render_template('workbench.html', 
                         username=session.get('username'),
                         config=firebase_config)

def get_triage_agent():
    """Lazy loading of triage agent to avoid circular imports"""
    from agents_config import get_triage_agent as get_agent
    return get_agent()

@app.route('/chat', methods=['POST'])
def chat():
    if not session.get('logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401

    user_message = request.json.get('message')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        # Check if ALL agent instructions are loaded
        from firestore_service import _agent_instructions_cache
        required_agents = ['SearchAgent', 'InternalKnowledgeSearch', 'PurchaseHistorySearchAgent', 'GeneralistProcurementAgent']
        missing_agents = [agent for agent in required_agents if agent not in _agent_instructions_cache]
        
        if missing_agents:
            return jsonify({
                'error': 'Agent instructions loading', 
                'message': f'Loading configurations for: {", ".join(missing_agents)}. Please wait a moment and try again.',
                'action': 'loading'
            }), 503

        print(f"\n=== Professional Buyer Chat ===")
        print(f"User: {user_message}")
        print(f"Cache contents: {list(_agent_instructions_cache.keys())}")
        print(f"Calling triage agent...")
        
        try:
            triage_agent = get_triage_agent()
            print(f"Triage agent created successfully")
        except Exception as agent_error:
            print(f"Error creating triage agent: {agent_error}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Agent creation failed: {str(agent_error)}'}), 500
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        with trace("Professional Buyer Assistant"):
            result = loop.run_until_complete(Runner.run(triage_agent, user_message))
        
        loop.close()
        
        print(f"Agent response: {result.final_output}")
        print(f"=== End Chat ===\n")

        return jsonify({'response': result.final_output})
    except Exception as e:
        print(f"Error in chat: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error processing message: {str(e)}'}), 500

@app.route('/admin')
def admin():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    
    # Firebase config for template - use app credentials, not env vars for user/pw
    firebase_config = {
        'FIREBASE_API_KEY': os.getenv('FIREBASE_API_KEY'),
        'FIREBASE_AUTH_DOMAIN': os.getenv('FIREBASE_AUTH_DOMAIN'),
        'FIREBASE_PROJECT_ID': os.getenv('FIREBASE_PROJECT_ID'),
        'FIREBASE_STORAGE_BUCKET': os.getenv('FIREBASE_STORAGE_BUCKET'),
        'FIREBASE_MESSAGING_SENDER_ID': os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
        'FIREBASE_APP_ID': os.getenv('FIREBASE_APP_ID'),
        'FIREBASE_MEASUREMENT_ID': os.getenv('FIREBASE_MEASUREMENT_ID'),
        'FIREBASE_USER': 'demo@professionalbuyer.com',  # Hardcoded demo user
        'FIREBASE_USER_PW': 'demo123456'  # Hardcoded demo password
    }
    
    return render_template('admin.html', 
                         username=session.get('username'),
                         config=firebase_config)

@app.route('/api/load_agent_instructions', methods=['POST'])
def load_agent_instructions():
    """API endpoint to receive agent instructions from frontend and store in server memory"""
    if not session.get('logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.json
        agent_name = data.get('agent_name')
        instructions = data.get('instructions')
        
        if not agent_name or not instructions:
            return jsonify({'error': 'Missing agent_name or instructions'}), 400
        
        # Store in global cache
        agent_instructions_cache[agent_name] = instructions
        
        # Also store in firestore_service cache
        from firestore_service import set_agent_instructions
        set_agent_instructions(agent_name, instructions)
        
        # Clear agent cache to force reload with new instructions
        import agents_config
        if agent_name == "SearchAgent":
            agents_config._search_agent = None
        elif agent_name == "InternalKnowledgeSearch":
            agents_config._internal_knowledge_search = None
        elif agent_name == "PurchaseHistorySearchAgent":
            agents_config._purchase_history_search_agent = None
        elif agent_name == "GeneralistProcurementAgent":
            agents_config._triage_agent = None
        
        print(f"✅ Instructions updated for {agent_name} - ready for next chat!")
        
        return jsonify({'success': True, 'message': f'Instructions loaded for {agent_name}'})
        
    except Exception as e:
        print(f"Error loading agent instructions: {str(e)}")
        return jsonify({'error': f'Error loading instructions: {str(e)}'}), 500

@app.route('/api/load_all_instructions', methods=['POST'])
def load_all_instructions():
    """API endpoint to load all agent instructions automatically"""
    if not session.get('logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        # This endpoint will be called by workbench frontend to trigger loading
        # The actual loading happens via Firebase in the frontend
        return jsonify({'success': True, 'message': 'Ready to receive instructions'})
        
    except Exception as e:
        print(f"Error in load_all_instructions: {str(e)}")
        return jsonify({'error': f'Error: {str(e)}'}), 500

@app.route('/api/refresh_instructions', methods=['POST'])
def refresh_instructions():
    """API endpoint to manually refresh all agent instructions"""
    if not session.get('logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    return jsonify({'success': True, 'message': 'Visit /admin page to refresh all instructions automatically'})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('landing'))

@app.route('/test_firebase')
def test_firebase():
    firebase_config = {
        'FIREBASE_API_KEY': os.getenv('FIREBASE_API_KEY'),
        'FIREBASE_AUTH_DOMAIN': os.getenv('FIREBASE_AUTH_DOMAIN'),
        'FIREBASE_PROJECT_ID': os.getenv('FIREBASE_PROJECT_ID'),
        'FIREBASE_STORAGE_BUCKET': os.getenv('FIREBASE_STORAGE_BUCKET'),
        'FIREBASE_MESSAGING_SENDER_ID': os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
        'FIREBASE_APP_ID': os.getenv('FIREBASE_APP_ID'),
        'FIREBASE_MEASUREMENT_ID': os.getenv('FIREBASE_MEASUREMENT_ID')
    }
    return render_template('test_firebase.html', firebase_config=firebase_config)

@app.route('/firebase_read_test')
def firebase_read_test():
    firebase_config = {
        'FIREBASE_API_KEY': os.getenv('FIREBASE_API_KEY'),
        'FIREBASE_AUTH_DOMAIN': os.getenv('FIREBASE_AUTH_DOMAIN'),
        'FIREBASE_PROJECT_ID': os.getenv('FIREBASE_PROJECT_ID'),
        'FIREBASE_STORAGE_BUCKET': os.getenv('FIREBASE_STORAGE_BUCKET'),
        'FIREBASE_MESSAGING_SENDER_ID': os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
        'FIREBASE_APP_ID': os.getenv('FIREBASE_APP_ID'),
        'FIREBASE_MEASUREMENT_ID': os.getenv('FIREBASE_MEASUREMENT_ID')
    }
    return render_template('firebase_read_test.html', firebase_config=firebase_config)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)