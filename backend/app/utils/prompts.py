# app/utils/prompts.py

EXTRACT_OBLIGATION_PROMPT = """You are an enterprise cybersecurity policy analyst.

Read the following enterprise policy document.

Extract every policy obligation.

Return ONLY valid JSON.

Never return markdown.

Never return explanations.

Never return code fences.

Return only JSON.

Each obligation must contain

subject

action

object

condition

frequency

strength

topic

confidence

Strength must always be one of

Mandatory

Recommended

Optional

Prohibited

Confidence

0-1

If information is unavailable

use empty string.

Return JSON array only."""
