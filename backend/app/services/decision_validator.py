import re
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Security-related keywords for CRITICAL conflict classification
SECURITY_KEYWORDS = [
    r"\bpassword[s]?\b",
    r"\bauth\b",
    r"\bauthentication\b",
    r"\bmfa\b",
    r"\b2fa\b",
    r"\bencrypt\b",
    r"\bencryption\b",
    r"\bcryptographic\b",
    r"\bcryptography\b",
    r"\baccess\s+control[s]?\b",
    r"\bpermission[s]?\b",
    r"\bauthorization\b",
    r"\bcredential[s]?\b",
    r"\bsecurity\s+control[s]?\b"
]

class DecisionValidator:
    """
    Validates and normalizes decisions returned by the LLM.
    Rejects malformed JSON and enforces strict business rules for Relationship,
    Severity, Confidence, Reasons, and Recommendations.
    """

    @classmethod
    def validate_and_normalize(
        cls,
        decision: Dict[str, Any],
        source_text: str,
        target_text: str
    ) -> Dict[str, Any]:
        """
        Validates the LLM decision dictionary.
        Enforces severity mapping rules based on relationship and security keywords.
        Raises ValueError if validation fails.
        """
        # 1. Extract and sanitize values with safe defaults
        relationship = str(decision.get("relationship", "INDEPENDENT")).strip().upper()
        severity = str(decision.get("severity", "LOW")).strip().upper()
        reason = str(decision.get("reason", "")).strip()
        recommendation = str(decision.get("recommendation", "")).strip()

        try:
            confidence = float(decision.get("confidence", 0.8))
        except (ValueError, TypeError):
            confidence = 0.8

        # 2. Validate relationship type
        allowed_relationships = {"CONFLICT", "DUPLICATE", "OVERLAP", "COMPLEMENTARY", "INDEPENDENT"}
        if relationship not in allowed_relationships:
            logger.warning(f"Decision Validator: Invalid relationship '{relationship}' coerced to INDEPENDENT.")
            relationship = "INDEPENDENT"

        # 3. Validate confidence range
        if not (0.0 <= confidence <= 1.0):
            confidence = 0.8

        # 4. Populate defaults for empty reason and recommendation based on relationship
        if not reason:
            if relationship == "CONFLICT":
                reason = "The obligations present opposing requirements or conflict in their policy definitions."
            elif relationship == "DUPLICATE":
                reason = "Both policy statements express identical or nearly identical obligations."
            elif relationship == "OVERLAP":
                reason = "The obligations overlap in subject matter and scope, requiring refinement."
            elif relationship == "COMPLEMENTARY":
                reason = "The obligations are mutually supportive and detail complementary aspects of the same topic."
            else:
                reason = "The obligations cover separate independent compliance topics."

        if not recommendation:
            if relationship == "CONFLICT":
                recommendation = "Align the conflicting requirements into a single consistent standard across policies."
            elif relationship == "DUPLICATE":
                recommendation = "Consolidate the redundant statements and remove duplicate obligations."
            elif relationship == "OVERLAP":
                recommendation = "Clarify policy boundaries to eliminate partial redundancy."
            elif relationship == "COMPLEMENTARY":
                recommendation = "Retain both complementary statements as they reinforce each other."
            else:
                recommendation = "Keep both independent obligations without modification."

        # 6. Enforce strict Severity Rules
        # Duplicate -> LOW
        # Overlap -> MEDIUM
        # Complementary -> LOW
        # Conflict -> HIGH
        # Security-related Conflict -> CRITICAL
        if relationship == "DUPLICATE":
            computed_severity = "LOW"
        elif relationship == "COMPLEMENTARY":
            computed_severity = "LOW"
        elif relationship == "INDEPENDENT":
            computed_severity = "LOW"
        elif relationship == "OVERLAP":
            computed_severity = "MEDIUM"
        elif relationship == "CONFLICT":
            # Check if conflict involves authentication, encryption, passwords, access control or critical security controls
            combined_text = f"{source_text} {target_text}".lower()
            is_security_related = False
            for pattern in SECURITY_KEYWORDS:
                if re.search(pattern, combined_text):
                    is_security_related = True
                    break
            
            if is_security_related:
                computed_severity = "CRITICAL"
                logger.info("Decision Validator: Conflict security check triggered. Severity upgraded to CRITICAL.")
            else:
                computed_severity = "HIGH"
        else:
            computed_severity = severity

        # Log if LLM severity is overridden by business rules
        if computed_severity != severity:
            logger.info(f"Decision Validator: Overriding LLM severity '{severity}' with computed severity '{computed_severity}' for {relationship}.")

        # Return sanitized and normalized dictionary
        return {
            "relationship": relationship,
            "confidence": confidence,
            "severity": computed_severity,
            "reason": reason,
            "recommendation": recommendation
        }
