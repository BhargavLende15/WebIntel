import base64
import hashlib
import hmac
import json
import secrets
import time

from fastapi import HTTPException, status

from app.utils.config import settings

_ITERATIONS = 600_000
_TOKEN_TTL_SECONDS = 3600


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, _ITERATIONS
    )
    return f"pbkdf2_sha256${_ITERATIONS}${_b64encode(salt)}${_b64encode(derived)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, iterations, salt_text, hash_text = stored.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        rounds = int(iterations)
        if rounds < 100_000 or rounds > 2_000_000:
            return False
        expected = _b64decode(hash_text)
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), _b64decode(salt_text), rounds
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str) -> str:
    secret = settings.SECRET_KEY
    if not secret or secret == "change-me-in-production" or len(secret) < 32:
        raise RuntimeError(
            "SECRET_KEY must be a unique secret of at least 32 characters."
        )

    now = int(time.time())
    header = _b64encode(json.dumps(
        {"alg": "HS256", "typ": "JWT"}, separators=(",", ":")
    ).encode())
    payload = _b64encode(json.dumps(
        {"sub": user_id, "iat": now, "exp": now + _TOKEN_TTL_SECONDS},
        separators=(",", ":"),
    ).encode())
    signing_input = f"{header}.{payload}"
    signature = hmac.new(
        secret.encode(), signing_input.encode("ascii"), hashlib.sha256
    ).digest()
    return f"{signing_input}.{_b64encode(signature)}"


def decode_access_token(token: str) -> str:
    secret = settings.SECRET_KEY
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not secret or secret == "change-me-in-production" or len(secret) < 32:
        raise RuntimeError("Configure a unique SECRET_KEY of at least 32 characters.")

    try:
        header_text, payload_text, signature_text = token.split(".")
        header = json.loads(_b64decode(header_text))
        payload = json.loads(_b64decode(payload_text))

        if header != {"alg": "HS256", "typ": "JWT"}:
            raise unauthorized

        signing_input = f"{header_text}.{payload_text}"
        expected = hmac.new(
            secret.encode(), signing_input.encode("ascii"), hashlib.sha256
        ).digest()
        supplied = _b64decode(signature_text)

        if not hmac.compare_digest(expected, supplied):
            raise unauthorized
        if int(payload["exp"]) <= int(time.time()):
            raise unauthorized

        user_id = str(payload["sub"])
        from uuid import UUID
        UUID(user_id)
        return user_id
    except HTTPException:
        raise
    except (ValueError, TypeError, KeyError, UnicodeError, json.JSONDecodeError):
        raise unauthorized from None
