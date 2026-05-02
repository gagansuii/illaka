import re

import bleach

_CLOUDINARY_PATTERN = re.compile(
    r"^https://res\.cloudinary\.com/", re.IGNORECASE
)

ALLOWED_MEDIA_DOMAINS = ("res.cloudinary.com",)


def strip_html(text: str) -> str:
    """Remove all HTML tags from a string."""
    return bleach.clean(text, tags=[], strip=True)


def sanitize_media_url(url: str | None) -> str | None:
    """Reject non-Cloudinary media URLs to prevent local path injection."""
    if url is None:
        return None
    if "/uploads/" in url or url.startswith("/"):
        return None
    if not _CLOUDINARY_PATTERN.match(url):
        return None
    return url
