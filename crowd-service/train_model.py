"""
Train a small RandomForest and save model.pkl for /predict.
Run: python train_model.py
"""
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

# Synthetic data: [month, day_of_week, is_festival, is_weekend, weather_code]
rng = np.random.default_rng(42)
X = []
y = []
for _ in range(400):
    month = rng.integers(1, 13)
    dow = rng.integers(0, 7)
    fest = rng.integers(0, 2)
    wknd = 1 if dow >= 5 else 0
    wcode = rng.integers(0, 4)
    X.append([month, dow, fest, wknd, wcode])
    # Higher crowd in May–Jun, weekends, festivals, bad weather codes
    score = (month in (5, 6)) * 2 + wknd * 1 + fest * 2 + (wcode >= 2) * 1 + rng.normal(0, 0.3)
    if score >= 3.5:
        y.append(2)  # High
    elif score >= 1.5:
        y.append(1)  # Medium
    else:
        y.append(0)  # Low

X = np.array(X)
y = np.array(y)

clf = RandomForestClassifier(n_estimators=80, max_depth=8, random_state=42)
clf.fit(X, y)
joblib.dump(clf, 'model.pkl')
print('Saved model.pkl', clf.score(X, y))
