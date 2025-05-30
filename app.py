import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from dotenv import load_dotenv
import asyncio
from agents import Runner, trace
from agents_config import triage_agent

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

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
    return render_template('workbench.html', username=session.get('username'))

@app.route('/chat', methods=['POST'])
def chat():
    if not session.get('logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401

    user_message = request.json.get('message')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        print(f"\n=== Professional Buyer Chat ===")
        print(f"User: {user_message}")
        print(f"Calling triage agent...")
        
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
        return jsonify({'error': f'Error processing message: {str(e)}'}), 500

@app.route('/admin')
def admin():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    
    # Firebase config for template
    firebase_config = {
        'FIREBASE_API_KEY': os.getenv('FIREBASE_API_KEY'),
        'FIREBASE_AUTH_DOMAIN': os.getenv('FIREBASE_AUTH_DOMAIN'),
        'FIREBASE_PROJECT_ID': os.getenv('FIREBASE_PROJECT_ID'),
        'FIREBASE_STORAGE_BUCKET': os.getenv('FIREBASE_STORAGE_BUCKET'),
        'FIREBASE_MESSAGING_SENDER_ID': os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
        'FIREBASE_APP_ID': os.getenv('FIREBASE_APP_ID'),
        'FIREBASE_MEASUREMENT_ID': os.getenv('FIREBASE_MEASUREMENT_ID'),
        'FIREBASE_USER': os.getenv('FIREBASE_USER'),
        'FIREBASE_USER_PW': os.getenv('FIREBASE_USER_PW')
    }
    
    return render_template('admin.html', 
                         username=session.get('username'),
                         config=firebase_config)

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