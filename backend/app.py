import os
import json
import uuid
import datetime
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
from functools import wraps

load_dotenv()

app = Flask(__name__)
# Allow CORS for all domains so the static site can connect
CORS(app, resources={r"/api/*": {"origins": "*"}})

APP_SECRET = os.environ.get('SECRET_KEY', 'dhruv-portfolio-super-secret-key-2025')
ADMIN_USER = os.environ.get('ADMIN_USER', 'admin')
ADMIN_PASS = os.environ.get('ADMIN_PASS', 'dhruv2025')

SMTP_EMAIL = os.environ.get('SMTP_EMAIL')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
DEST_EMAIL = SMTP_EMAIL

def send_email(name, sender_email, message_body):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        return False
        
    msg = EmailMessage()
    msg.set_content(f"Name: {name}\nEmail: {sender_email}\n\nMessage:\n{message_body}")
    msg['Subject'] = f"New Portfolio Contact from {name}"
    msg['From'] = SMTP_EMAIL
    msg['To'] = DEST_EMAIL

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# Data paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECTS_FILE = os.path.join(BASE_DIR, 'projects.json')
MESSAGES_FILE = os.path.join(BASE_DIR, 'messages.json')

# --- Helper functions ---
def read_json(filepath, default_val):
    if not os.path.exists(filepath):
        return default_val
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return default_val

def write_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

# Seed initial projects if not exists
DEFAULT_PROJECTS = [
    { "id": 1, "title": "Portfolio Site", "cat": "Web Dev", "img": "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=400&q=80", "url": "" },
    { "id": 2, "title": "Nebula UI", "cat": "Design", "img": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80", "url": "" },
]

if not os.path.exists(PROJECTS_FILE):
    write_json(PROJECTS_FILE, DEFAULT_PROJECTS)
if not os.path.exists(MESSAGES_FILE):
    write_json(MESSAGES_FILE, [])


# --- Auth Middleware ---
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid token'}), 401
        
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, APP_SECRET, algorithms=['HS256'])
            if payload.get('role') != 'admin':
                return jsonify({'error': 'Unauthorized'}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(*args, **kwargs)
    return decorated


# --- Routes ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if username == ADMIN_USER and password == ADMIN_PASS:
        token = jwt.encode({
            'role': 'admin',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, APP_SECRET, algorithm='HS256')
        return jsonify({'token': token, 'message': 'Logged in successfully'})
    
    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.json
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    message = data.get('message', '').strip()
    
    if not name or not email or not message:
        return jsonify({'error': 'All fields are required'}), 400
        
    messages = read_json(MESSAGES_FILE, [])
    new_msg = {
        'id': str(uuid.uuid4()),
        'name': name,
        'email': email,
        'message': message,
        'timestamp': datetime.datetime.utcnow().isoformat()
    }
    messages.append(new_msg)
    write_json(MESSAGES_FILE, messages)
    
    email_sent = send_email(name, email, message)
    if not email_sent:
        print("Warning: Email could not be sent. Check SMTP configurations.")
        
    return jsonify({'message': 'Message sent successfully'})


@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = read_json(PROJECTS_FILE, [])
    return jsonify(projects)


@app.route('/api/projects', methods=['POST'])
@admin_required
def save_projects():
    data = request.json
    if not isinstance(data, list):
        return jsonify({'error': 'Expected an array of projects'}), 400
        
    write_json(PROJECTS_FILE, data)
    return jsonify({'message': 'Projects saved successfully', 'projects': data})


@app.route('/api/messages', methods=['GET'])
@admin_required
def get_messages():
    messages = read_json(MESSAGES_FILE, [])
    return jsonify(messages)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
