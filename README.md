# Shareholder Extraction Coding Challenge
Extract ultimate beneficial owners from company documents.

## Goal
Write a program that:
- Reads the `docs` in each company's folder under `data/`.
- Uses the `client` name from each company's `metadata.json` as the business name.
- Determines the shareholders who are people (not companies) and have more than 25% ownership.
- Compares your derived shareholders and percentages with the `shareholders` listed in each company's `metadata.json`.
- Outputs an average accuracy score across all companies.

## Steps
1. Iterate through each company folder in `data/`.
2. For each company:
   - Read the `client` name from `metadata.json`.
   - Read the documents in the `docs` folder to find shareholder information.
   - Extract shareholders who are people (not companies) and have more than 25% ownership.
3. Compare your extracted shareholders and percentages with the `shareholders` in `metadata.json`.
4. Calculate an accuracy score for each company (e.g., percentage of correct shareholders).
5. Output the average accuracy score across all companies.

## Notes
- Only shareholders with 25%+ ownership are relevant.
- Only people (not companies) should be considered as ultimate beneficial owners.
- Business names may be fuzzy; use the `client` field in `metadata.json`. You are allowed to change the client name in metadata.json for the purposes of the exercise.
- BONUS: If documents for a company are missing, set a `missing_docs` flag as done in the metadata.json files.
