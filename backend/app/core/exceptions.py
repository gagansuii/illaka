from fastapi import HTTPException, status


class AppError(HTTPException):
    """Base application exception."""


class NotFoundError(AppError):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class UnauthorizedError(AppError):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ConflictError(AppError):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class ValidationError(AppError):
    def __init__(self, detail: str = "Validation failed"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail
        )


class RateLimitError(AppError):
    def __init__(self, detail: str = "Too many requests"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail
        )


class ServiceUnavailableError(AppError):
    def __init__(self, detail: str = "Service temporarily unavailable"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail
        )


class PaymentError(AppError):
    def __init__(self, detail: str = "Payment processing failed"):
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)


class CapacityFullError(ConflictError):
    def __init__(self):
        super().__init__(detail="Event is at full capacity")


class AlreadyRSVPedError(ConflictError):
    def __init__(self):
        super().__init__(detail="Already RSVPed to this event")
