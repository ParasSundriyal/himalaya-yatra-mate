@echo off
cd /d "%~dp0"
python generate_training_data.py && python train.py && python app.py
