# FraudGuard AI - Data Dictionary

This document explains the features found in our datasets in beginner-friendly language. The data is split into two main tables: **Transactions** and **Identity**.

## 1. Transaction Table (`train_transaction.csv`)
This table contains information about the payment itself and the card used.

* **TransactionID**: The unique identifier for each transaction. This is our "join key" used to link this table with the Identity table.
* **isFraud**: Our target variable. `1` means the transaction was fraudulent, `0` means it was legitimate.
* **TransactionDT**: A time measurement (in seconds) indicating when the transaction happened relative to a secret starting point.
* **TransactionAmt**: The amount of the transaction in USD.
* **ProductCD**: The code for the product or service being purchased.
* **card1 to card6**: Various details about the payment card used (like the bank, card type, Visa/Mastercard, etc.). These are anonymized for privacy.
* **addr1 & addr2**: Anonymized billing region and country.
* **dist1 & dist2**: Distances between the billing address and the location where the transaction occurred.
* **P_emaildomain & R_emaildomain**: The email domain of the purchaser (P) and the recipient (R).
* **C1 to C14**: Counts of things related to the card, like how many times the card has been used recently or how many addresses are linked to it.
* **D1 to D15**: Time distances, such as how many days it has been since the user's previous transaction.
* **M1 to M9**: Match flags. These indicate if certain pieces of information matched (like if the name on the card matched the name on the account).
* **V1 to V339**: Features created by Vesta Corporation (the company that provided the dataset). These represent complex behaviors and patterns, like IP matching or unusual browsing habits.

## 2. Identity Table (`train_identity.csv`)
This table contains information about the device and network used to make the transaction. Not all transactions have this information.

* **TransactionID**: The unique identifier, used to link back to the Transaction table.
* **id_01 to id_38**: Various technical details collected about the user's digital footprint. This includes things like their network connection, IP address rating, or screen resolution.
* **DeviceType**: The broad category of device used (e.g., "mobile", "desktop").
* **DeviceInfo**: More specific information about the device (e.g., "Windows", "iOS", "Samsung").
