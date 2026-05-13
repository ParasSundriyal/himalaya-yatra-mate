"""Train RandomForest on training_data.csv; save model.pkl and label_encoder.pkl."""
import os

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

CSV_PATH = "chardham_yatra_data.csv"
MODEL_PATH = os.environ.get("MODEL_PATH", "model.pkl")
ENCODER_PATH = os.environ.get("LABEL_ENCODER_PATH", "label_encoder.pkl")

FEATURE_COLS = [
    "month",
    "day_of_week",
    "day_of_season",
    "is_weekend",
    "is_festival",
    "weather_code",
    "pass_quota_pct",
]


def main():
    df = pd.read_csv(CSV_PATH)
    X = df[FEATURE_COLS].astype(float)
    y_raw = df["crowd_level"].astype(str)

    le = LabelEncoder()
    le.fit(["Low", "Medium", "High","Extreme"])
    y = le.transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        class_weight="balanced",
        random_state=42,
    )
    clf.fit(X_train, y_train)
    pred = clf.predict(X_test)
    acc = accuracy_score(y_test, pred)

    print(f"Accuracy (test): {acc:.4f}")
    print("\nClassification report:")
    names = list(le.classes_)
    print(classification_report(y_test, pred, target_names=names))
    print("Confusion matrix:")
    print(confusion_matrix(y_test, pred))

    importances = clf.feature_importances_
    pairs = sorted(zip(FEATURE_COLS, importances), key=lambda x: -x[1])
    print("\nTop 5 feature importances (%):")
    for name, imp in pairs[:5]:
        print(f"  {name}: {100.0 * imp:.2f}%")

    joblib.dump(clf, MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    print(f'Model saved. Accuracy: {acc:.2f}')


if __name__ == "__main__":
    main()
