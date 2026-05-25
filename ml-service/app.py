import os
from datetime import date, datetime

import joblib
import numpy as np
from flask import Flask, jsonify, request

PORT = int(os.environ.get("PORT", "5001"))
MODEL_PATH = os.environ.get("MODEL_PATH", "./model.pkl")
LABEL_ENCODER_PATH = os.environ.get("LABEL_ENCODER_PATH", "./label_encoder.pkl")

app = Flask(__name__)
model = None
label_encoder = None


def festival_check(d: date) -> int:
    m, day = d.month, d.day
    if m == 5 and 1 <= day <= 5:
        return 1
    if m == 5 and 10 <= day <= 12:
        return 1
    if m == 8 and 25 <= day <= 30:
        return 1
    if m == 10 and 2 <= day <= 12:
        return 1
    if m == 10 and 28 <= day <= 30:
        return 1
    return 0


def in_season(d: date) -> bool:
    if d.month < 5:
        return False
    if d.month > 11 or (d.month == 11 and d.day > 15):
        return False
    return True


def load_models():
    global model, label_encoder
    try:
        if os.path.isfile(MODEL_PATH) and os.path.isfile(LABEL_ENCODER_PATH):
            model = joblib.load(MODEL_PATH)
            label_encoder = joblib.load(LABEL_ENCODER_PATH)
            print("ML models loaded.")
        else:
            print(
                "Warning: model.pkl or label_encoder.pkl missing — "
                "predictions will default to Medium."
            )
    except Exception as e:
        print("Warning: failed to load models:", e)
        model = None
        label_encoder = None


def default_medium_response(extra=None):
    out = {"level": "Medium", "confidence": 0.5}
    if extra:
        out.update(extra)
    return out


def rule_based_level(parsed_date, pass_quota_pct):
    """When ML model is missing, use season + pass utilization (not flat Medium)."""
    if not in_season(parsed_date):
        return "Low", 0.45

    month = parsed_date.month
    day = parsed_date.day
    score = 1.0

    if month == 5 or (month == 6 and day <= 20):
        score += 0.45
    elif month in (6, 7, 8):
        score += 0.25
    if parsed_date.weekday() >= 5:
        score += 0.1
    if festival_check(parsed_date):
        score += 0.15

    pq = float(pass_quota_pct)
    if pq >= 0.72:
        score += 0.55
    elif pq >= 0.45:
        score += 0.35
    elif pq >= 0.2:
        score += 0.15
    elif month == 5 and day <= 21:
        score += 0.35

    if score < 0.7:
        level = "Low"
    elif score < 1.45:
        level = "Medium"
    else:
        level = "High"
    conf = min(0.82, 0.5 + abs(score - 1.0) * 0.15)
    return level, conf


def build_features(parsed_date, weather_code, pass_quota_pct):
    month = parsed_date.month
    day_of_week = parsed_date.weekday()
    season_start = date(parsed_date.year, 5, 1)
    day_of_season = (parsed_date - season_start).days + 1
    is_weekend = 1 if day_of_week >= 5 else 0
    is_festival = festival_check(parsed_date)
    return (
        np.array(
            [
                [
                    month,
                    day_of_week,
                    day_of_season,
                    is_weekend,
                    is_festival,
                    int(weather_code),
                    float(pass_quota_pct),
                ]
            ],
            dtype=float,
        ),
        {
            "month": month,
            "day_of_week": day_of_week,
            "day_of_season": day_of_season,
            "is_weekend": is_weekend,
            "is_festival": is_festival,
            "weather_code": int(weather_code),
            "pass_quota_pct": float(pass_quota_pct),
        },
    )


def predict_one(payload):
    dham = payload.get("dham", "kedarnath")
    date_str = payload.get("date")
    weather_code = payload.get("weather_code", 0)
    pass_quota_pct = float(payload.get("pass_quota_pct", 0.5))

    if not date_str:
        raise ValueError("missing_date")

    parsed = datetime.strptime(date_str, "%Y-%m-%d").date()
    if not in_season(parsed):
        return {
            "error": "outside_season",
            "level": "Low",
            "confidence": 0.7,
            "dham": dham,
            "date": date_str,
        }

    X, feats = build_features(parsed, weather_code, pass_quota_pct)

    if model is None or label_encoder is None:
        level, confidence = rule_based_level(parsed, pass_quota_pct)
        return {
            "dham": dham,
            "date": date_str,
            "level": level,
            "confidence": confidence,
            "breakdown": {"Low": 0.2, "Medium": 0.35, "High": 0.45} if level == "High" else None,
            "features_used": feats,
            "source": "rule_based",
        }

    pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    classes = list(model.classes_)
    label_order = [label_encoder.inverse_transform([int(c)])[0] for c in classes]
    breakdown = {
        label_order[i]: float(proba[i]) for i in range(len(label_order))
    }
    level = label_encoder.inverse_transform([int(pred)])[0]
    confidence = float(np.max(proba))

    return {
        "dham": dham,
        "date": date_str,
        "level": level,
        "confidence": confidence,
        "breakdown": breakdown,
        "features_used": feats,
    }


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        body = request.get_json(force=True, silent=True) or {}
        out = predict_one(body)
        if "error" in out:
            return jsonify(out), 200
        return jsonify(out)
    except Exception:
        return jsonify(default_medium_response()), 200


@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    try:
        body = request.get_json(force=True, silent=True) or {}
        reqs = body.get("requests") or []
        results = []
        for item in reqs:
            try:
                results.append(predict_one(item))
            except Exception:
                results.append(default_medium_response())
        return jsonify(results)
    except Exception:
        return jsonify([]), 200


load_models()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)
