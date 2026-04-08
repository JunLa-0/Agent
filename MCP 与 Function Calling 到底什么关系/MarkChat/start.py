from flask import Flask, render_template, request, jsonify
from backend import LLMProcessor, MODEL_NAME

app = Flask(__name__)

llm_processor = LLMProcessor()

@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html', model_name=MODEL_NAME)

@app.route('/chat', methods=['POST'])
def chat():
    """Handles chat messages from the user."""
    data = request.json
    user_query = data.get('message')

    if not user_query:
        return jsonify({"error": "No message provided"}), 400

    response_steps = llm_processor.process_user_query(user_query)
    return jsonify(response_steps)

if __name__ == '__main__':
    print("Flask app running on http://127.0.0.1:5000/")
    app.run(debug=True)