"""
Crowd prediction microservice — port 5001
POST /predict { "dham": "Kedarnath", "date": "2026-05-15", "weather_code": 1 }
Returns { "level": "Low"|"Medium"|"High", "confidence": float }
"""
import os
from datetime import datetime

import joblib
import numpy as np
from flask import Flask, jsonify, request

app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
clf = None

LABELS = ['Low', 'Medium', 'High']


def load_model():
    global clf
    if clf is not None:
        return
    if not os.path.exists(MODEL_PATH):
        clf = False  # use heuristic fallback
        return
    clf = joblib.load(MODEL_PATH)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'ok': True})


@app.route('/predict', methods=['POST'])
def predict():
    load_model()
    data = request.get_json(silent=True) or {}
    date_str = data.get('date') or datetime.utcnow().date().isoformat()
    weather_code = int(data.get('weather_code', 1))
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        dt = datetime.utcnow()
    month = dt.month
    dow = dt.weekday()
    is_weekend = 1 if dow >= 5 else 0
    # Simple festival stub: Akshaya Tritiya etc. — placeholder 0
    is_festival = 0

    X = np.array([[month, dow, is_festival, is_weekend, weather_code]])
    if clf is False:
        # Heuristic if model.pkl not trained yet
        score = (month in (5, 6, 9, 10)) * 2 + is_weekend + is_festival * 2 + (weather_code >= 2)
        level = LABELS[min(2, max(0, score - 1))]
        return jsonify({'level': level, 'confidence': 0.55})

    proba = clf.predict_proba(X)[0]
    pred = int(np.argmax(proba))
    confidence = float(proba[pred])
    return jsonify({'level': LABELS[pred], 'confidence': confidence})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
