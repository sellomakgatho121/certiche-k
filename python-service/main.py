from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route('/analyze_layout', methods=['POST'])
def analyze_layout():
    """
    This endpoint will receive a document image and return a layout analysis.
    For now, it will return a dummy response.
    """
    # TODO: Implement the actual layout analysis using deepdoctection
    return jsonify({
        "message": "Layout analysis endpoint. Not yet implemented.",
        "dummy_data": {
            "text": "This is some dummy text.",
            "layout": [
                {"box": [10, 20, 100, 50], "type": "paragraph"},
                {"box": [10, 60, 100, 100], "type": "table"}
            ]
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=True, host='0.0.0.0', port=port)
