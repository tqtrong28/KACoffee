import unicodedata

from app.core.constants import HANOI_CITY_ALIASES


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    value = unicodedata.normalize("NFD", value.strip().lower())
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    return " ".join(value.split())


def is_hanoi_city(value: str | None) -> bool:
    return normalize_text(value) in HANOI_CITY_ALIASES
