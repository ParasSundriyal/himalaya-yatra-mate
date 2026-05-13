#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python generate_training_data.py && python train.py && python app.py
