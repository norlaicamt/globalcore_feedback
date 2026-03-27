# routers/__init__.py
from .users import router as users_router
from .departments import router as departments_router
from .categories import router as categories_router
from .feedback import router as feedback_router
from .analytics import router as analytics_router

__all__ = [
    "users_router",
    "departments_router",
    "categories_router",
    "feedback_router",
    "analytics_router",
]