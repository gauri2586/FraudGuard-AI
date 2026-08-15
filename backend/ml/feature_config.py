"""
Configuration for Feature Selection and Preprocessing.
This centralizes what features are used so we don't blindly pass 400 columns to the model.
"""

JOIN_KEY = "TransactionID"
TARGET_COL = "isFraud"

# Numerical Features
# We select key amount, distance, count (C), and timedelta (D) features.
NUMERICAL_COLS = [
    "TransactionAmt",
    "dist1",
    "dist2",
] + [f"C{i}" for i in range(1, 15)] + [f"D{i}" for i in range(1, 16)]

# Categorical Features
# We select important card details, addresses, emails, and device info.
CATEGORICAL_COLS = [
    "ProductCD",
    "card1", "card2", "card3", "card4", "card5", "card6",
    "addr1", "addr2",
    "P_emaildomain", "R_emaildomain",
    "DeviceType", "DeviceInfo"
] + [f"id_{i:02d}" for i in range(12, 39)]  # id_12 to id_38

# Time Feature (Used for engineering, not passed directly to model)
TIME_COL = "TransactionDT"

# All selected raw columns to load (we drop everything else to save memory)
ALL_RAW_COLS = [JOIN_KEY, TARGET_COL, TIME_COL] + NUMERICAL_COLS + CATEGORICAL_COLS

# Engineered Features (These will be created by the pipeline)
ENGINEERED_NUMERICAL_COLS = [
    "TransactionAmt_Log",
    "hour_of_day",
    "day_of_week"
]

ENGINEERED_CATEGORICAL_COLS = [
    "email_match"
]
