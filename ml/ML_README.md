# FraudGuard AI - Machine Learning Backend

Welcome to the ML Backend for FraudGuard AI! This module handles the data science lifecycle: data generation, preprocessing, model training, and evaluation.

## Directory Structure

- **`data/`**: Stores datasets. 
  - `raw/`: Original, unmodified data.
  - `processed/`: Cleaned data ready for model training.
- **`preprocessing/`**: Scripts for data cleaning, handling missing values, and scaling.
- **`features/`**: Feature engineering logic (creating new predictive columns from existing data).
- **`models/`**: Saved, trained model files (e.g., `.pkl`, `.h5`) for later use in inference.
- **`training/`**: Scripts and pipelines for training the ML models.
- **`evaluation/`**: Code for testing model accuracy, precision, recall, and F1-scores.
- **`inference/`**: Scripts that load a trained model and predict fraud on *new* incoming transactions.
- **`explainability/`**: SHAP analysis scripts to explain *why* the AI made a decision.
- **`notebooks/`**: Jupyter notebooks for exploratory data analysis (EDA) and rapid prototyping.

## Getting Started

1. Ensure you have Python 3.9+ installed.
2. Install the required packages: `pip install -r requirements.txt`
3. Generate the initial synthetic dataset: `python data/generate_synthetic_data.py`
4. Run the baseline training pipeline to see the EDA and initial model results: `python training/01_baseline_pipeline.py`
