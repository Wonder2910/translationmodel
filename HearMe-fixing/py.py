from flask import Flask, request, jsonify
from flask_cors import CORS
from deep_translator import GoogleTranslator

app = Flask(__name__)
CORS(app)

@app.route('/translate', methods=['POST', 'OPTIONS'])
def translate_text():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    try:
        data = request.get_json()
        print("Received:", data)
        text = data.get('text', '').strip()
        from_lang = data.get('from', '').strip()
        to_lang = data.get('to', '').strip()

        if not all([text, from_lang, to_lang]):
            return jsonify({"error": "Missing parameters"}), 400

        translator = GoogleTranslator(source=from_lang, target=to_lang)
        translation = translator.translate(text)
        print(f"Translated '{text}' to '{translation}'")
        return jsonify({"translation": translation, "original": text})
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True, host='0.0.0.0')