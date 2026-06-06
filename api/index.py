"""Vercel serverless entrypoint.

Vercel's Python runtime looks for an ASGI ``app`` in this module. We re-export
the FastAPI application defined in ``app.main``.
"""
from app.main import app

__all__ = ["app"]
