# Reusable lookup maps for canonicalization

ACTION_MAP = {
    "be stored securely": "Store",
    "stored securely": "Store",
    "store securely": "Store",
    "be stored": "Store",
    "store": "Store",
    "contain": "Contain",
    "include": "Include",
    "require": "Require",
    "enable": "Enable",
    "rotate": "Rotate",
    "be encrypted": "Encrypt",
    "encrypt": "Encrypt",
    "be deleted": "Delete",
    "delete": "Delete",
    "be retained": "Retain",
    "retain": "Retain",
    "be reviewed": "Review",
    "review": "Review",
    "be shared": "Share",
    "shared": "Share",
    "share": "Share",
}

SUBJECT_MAP = {
    "all employees": "Employees",
    "employee": "Employees",
    "employees": "Employees",
    "each employee": "Employees",
    "user accounts": "Users",
    "users": "Users",
    "user account": "Users",
    "every user account": "Users",
    "all user accounts": "Users",
    "cloud-hosted systems": "Cloud Systems",
    "cloud systems": "Cloud Systems",
}

OBJECT_MAP = {
    "passwords": "Passwords",
    "password": "Passwords",
    "multi-factor authentication": "MFA",
    "multi-factor authentication (mfa)": "MFA",
    "mfa": "MFA",
    "password vault": "Password Vault",
    "service account passwords": "Service Account Passwords",
}

FREQUENCY_MAP = {
    "every 90 days": "90 Days",
    "every month": "Monthly",
    "every year": "Yearly",
    "one year": "1 Year",
    "seven years": "7 Years",
}

STRENGTH_MAP = {
    "must": "Mandatory",
    "shall": "Mandatory",
    "required": "Mandatory",
    "mandatory": "Mandatory",
    
    "should": "Recommended",
    "recommended": "Recommended",
    "expected": "Recommended",
    
    "may": "Optional",
    "optional": "Optional",
    
    "must not": "Prohibited",
    "shall not": "Prohibited",
    "never": "Prohibited",
    "prohibited": "Prohibited",
    "forbidden": "Prohibited",
}

TOPIC_MAP = {
    "password security policy": "Password Security",
    "password security": "Password Security",
    "cloud security policy": "Cloud Security",
    "cloud security": "Cloud Security",
    "data retention policy": "Data Retention",
    "data retention": "Data Retention",
    "legacy infrastructure policy": "Legacy Infrastructure",
    "legacy infrastructure": "Legacy Infrastructure",
}

def map_value(value: str, mapping_dict: dict) -> str:
    """
    Looks up the value in the mapping dictionary (case-insensitive and stripped).
    If no match is found, falls back to the Title-cased version of the stripped input.
    """
    if not value:
        return ""
    val_clean = str(value).strip().lower()
    if val_clean in mapping_dict:
        return mapping_dict[val_clean]
    # Fallback to Title case
    return str(value).strip().title()
