"""
Ethiopian National ID Program (NIDP / Fayda) Integration Service
Handles:
1. Verification of 16-digit FAN and 12-digit FIN using the official Verhoeff Checksum Algorithm (MOSIP standard).
2. Integration with the official Ethiopian National Database (VeriFayda e-KYC API at id.gov.et / partner.fayda.et).
"""

import re
import json
import urllib.request
import urllib.error
from django.conf import settings

# Verhoeff Algorithm Tables (D5 Dihedral Group) - official MOSIP/NIDP specification
_VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

_VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

_VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

def validate_verhoeff(num_str: str) -> bool:
    """Validates the Verhoeff checksum digit (the 16th or 12th digit in Fayda IDs)."""
    if not num_str or not num_str.isdigit():
        return False
    c = 0
    for i, char in enumerate(reversed(num_str)):
        c = _VERHOEFF_D[c][_VERHOEFF_P[i % 8][int(char)]]
    return c == 0

def clean_fayda_number(raw_val: str) -> str:
    """Strips FAN/FIN prefix, spaces, and hyphens."""
    if not raw_val:
        return ""
    cleaned = re.sub(r'^(FAN|FIN)[-:\s]*', '', raw_val.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r'[\s\-]', '', cleaned)
    return cleaned

def validate_fayda_number(raw_val: str) -> tuple[bool, str]:
    """
    Validates an Ethiopian Fayda ID:
    - Must be 16 digits (FAN - Fayda Alternative Number) or 12 digits (FIN - Fayda Identification Number).
    - Rejects repeating or sequential numbers.
    - Mathematically checks against the NIDP Verhoeff algorithm.
    """
    cleaned = clean_fayda_number(raw_val)
    if not cleaned:
        return False, "Fayda Number is required."

    if not cleaned.isdigit():
        return False, "Invalid Fayda Number: A genuine Fayda ID must contain numeric digits only (0-9)."

    if len(cleaned) not in (12, 16):
        return False, f"Invalid Fayda Identification Number. Ethiopian Fayda ID must be 16 digits (FAN) or 12 digits (FIN). You entered {len(cleaned)} digits."

    if len(set(cleaned)) == 1:
        return False, "Invalid Fayda Number: Repeating identical digits (e.g. 1111111111111111) are not allowed."

    if cleaned in ("1234567890123456", "0123456789012345", "9876543210987654", "123456789012"):
        return False, "Invalid Fayda Number: Sequential test numbers are not valid Fayda IDs."

    # Validate against Ethiopian NIDP / MOSIP Verhoeff checksum
    if not validate_verhoeff(cleaned):
        return False, "Invalid Fayda Number: This number fails the official Ethiopian National ID (NIDP) Verhoeff checksum validation. Please enter your genuine Fayda number."

    return True, cleaned

def query_ethiopia_national_db(fayda_id: str) -> dict:
    """
    Queries the official Ethiopian National ID Program (NIDP) VeriFayda database.
    Requires FAYDA_CLIENT_ID and FAYDA_CLIENT_SECRET configured from partner.fayda.et.
    """
    client_id = getattr(settings, 'FAYDA_CLIENT_ID', None)
    client_secret = getattr(settings, 'FAYDA_CLIENT_SECRET', None)
    api_url = getattr(settings, 'FAYDA_PARTNER_API_URL', 'https://api.fayda.et')

    if not client_id or not client_secret:
        return {
            "connected": False,
            "message": "NIDP Partner API keys not configured. To query the live federal database, register at https://partner.fayda.et to receive your Client ID.",
            "mode": "mathematical_verhoeff_validated"
        }

    try:
        req = urllib.request.Request(
            f"{api_url}/v1/auth/kyc-query",
            data=json.dumps({"fayda_id": fayda_id, "client_id": client_id}).encode('utf-8'),
            headers={
                "Authorization": f"Bearer {client_secret}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return {"connected": True, "data": data}
    except urllib.error.HTTPError as he:
        return {"connected": True, "error": f"NIDP returned status {he.code}: {he.read().decode('utf-8')}"}
    except Exception as e:
        return {"connected": False, "error": f"NIDP network connection error: {str(e)}"}
