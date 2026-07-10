# app/utils/prompts.py

EXTRACT_OBLIGATION_PROMPT = """You are an enterprise policy analyst.

Extract every obligation from the policy.

Return ONLY valid JSON.

Each obligation must contain

subject

action

condition

strength

frequency

Return an array."""
