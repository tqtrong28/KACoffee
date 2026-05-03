from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def _humanize_part(part: str | int) -> str:
    if isinstance(part, int):
        return str(part + 1)
    return str(part).replace("_", " ")


def _field_name(loc: tuple[str | int, ...] | list[str | int]) -> str:
    filtered = [part for part in loc if part not in {"body", "query", "path"}]
    if not filtered:
        return "request"

    formatted: list[str] = []
    for part in filtered:
        if isinstance(part, int):
            formatted.append(f"item {_humanize_part(part)}")
        else:
            formatted.append(_humanize_part(part))
    return " ".join(formatted)


def format_validation_message(exc: RequestValidationError) -> str:
    messages: list[str] = []
    for error in exc.errors():
        field = _field_name(error.get("loc", ()))
        error_type = error.get("type")
        message = str(error.get("msg", "Invalid value"))
        if error_type == "missing":
            messages.append(f"{field.capitalize()} is required.")
        elif field == "request":
            messages.append(message)
        else:
            messages.append(f"{field.capitalize()}: {message}.")

    deduped = list(dict.fromkeys(messages))
    return " ".join(deduped)


async def request_validation_exception_handler(_, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "message": format_validation_message(exc),
        },
    )
