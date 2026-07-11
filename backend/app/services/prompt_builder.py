import logging

logger = logging.getLogger(__name__)

class PromptBuilder:
    """
    Constructs standardized system and user prompts to instruct the local LLM
    to perform policy similarity/conflict reasoning and return structured JSON.
    """

    @classmethod
    def build_comparison_prompt(cls, source_text: str, target_text: str) -> str:
        """
        Builds the prompt comparing two obligations.
        Returns prompt formatted strictly for structured JSON responses.
        """
        prompt = f"""You are an enterprise cybersecurity policy analyst.

Compare the following two policy obligations.

Obligation A:
"{source_text}"

Obligation B:
"{target_text}"

Determine:
1. Relationship: Must be exactly one of: CONFLICT, DUPLICATE, OVERLAP, COMPLEMENTARY, INDEPENDENT.
2. Confidence: Numeric confidence score (float) between 0.0 and 1.0 representing your certainty.
3. Severity: Must be exactly one of: LOW, MEDIUM, HIGH, CRITICAL. (Rule: DUPLICATE is LOW, OVERLAP is MEDIUM, COMPLEMENTARY is LOW, CONFLICT is HIGH or upgraded to CRITICAL if it involves passwords, encryption, authentication, access control or critical security controls).
4. Reason: A clear, concise explanation of your decision basis and your observations. This field is mandatory and MUST NOT be empty.
5. Recommendation: Actionable remediation recommendation. This field is mandatory and MUST NOT be empty. (E.g. "Consolidate both requirements", "Retain as complementary controls", "Align the conflicting requirements").

Respond ONLY as a valid JSON object.
Never return markdown blocks (do not wrap in ```json or ```).
Never return explanations or text outside the JSON object.
Never invent relationship types.

Return exactly this JSON schema:
{{
    "relationship": "relationship classification",
    "confidence": 0.95,
    "severity": "LOW/MEDIUM/HIGH/CRITICAL",
    "reason": "explanation of decision basis",
    "recommendation": "remediation steps"
}}"""
        return prompt
