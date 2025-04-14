from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json

app = Flask(__name__)
CORS(app)

@app.route("/professor")
def get_professor():
    name = request.args.get("name")
    if not name:
        return jsonify({"error": "No professor name provided"}), 400

    try:
        print("Running Puppeteer subprocess for:", name)
        result = subprocess.run(
            ["node", "puppeteer_scraper/index.js", name],
            capture_output=True, text=True, check=True
        )

        output = result.stdout.strip()
        if not output:
            return jsonify({"error": "No data returned from scraper"}), 500

        try:
            prof_data = json.loads(output)
            return jsonify(prof_data)
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON", "details": output}), 500

    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Scraping failed", "details": e.stderr}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)