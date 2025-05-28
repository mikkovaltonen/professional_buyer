  import os
  from flask import Flask, render_template, request, redirect,
  url_for, session, jsonify
  from dotenv import load_dotenv
  import asyncio
  from agents import Runner, trace
  from Agents_and_tools import triage_agent

  load_dotenv()

  app = Flask(__name__)
  app.secret_key = os.getenv('SECRET_KEY',
  'dev-secret-key-change-in-production')

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

          if username == VALID_USERNAME and password ==
  VALID_PASSWORD:
              session['logged_in'] = True
              session['username'] = username
              return redirect(url_for('workbench'))
          else:
              return render_template('login.html', error='Invalid
  credentials')

      return render_template('login.html')

  @app.route('/workbench')
  def workbench():
      if not session.get('logged_in'):
          return redirect(url_for('login'))
      return render_template('workbench.html',
  username=session.get('username'))

  @app.route('/chat', methods=['POST'])
  def chat():
      if not session.get('logged_in'):
          return jsonify({'error': 'Not authenticated'}), 401

      user_message = request.json.get('message')
      if not user_message:
          return jsonify({'error': 'No message provided'}), 400

      try:
          loop = asyncio.new_event_loop()
          asyncio.set_event_loop(loop)
          result = loop.run_until_complete(Runner.run(triage_agent,       
  user_message))
          loop.close()

          return jsonify({'response': result.final_output})
      except Exception as e:
          return jsonify({'error': f'Error processing message:
  {str(e)}'}), 500

  @app.route('/logout')
  def logout():
      session.clear()
      return redirect(url_for('landing'))

  if __name__ == '__main__':
      app.run(debug=True, host='0.0.0.0', port=5000)