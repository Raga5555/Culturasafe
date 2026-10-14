"""Main entry point and FastAPI application assembly."""

import json
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.security import AppException
from app.core.logging import logger
from app.utils.rate_limiter import api_limiter
from app.api import (
    health_router,
    auth_router,
    user_router,
    destinations_router,
    itineraries_router,
    location_router,
    belongings_router,
    sync_router
)

app = FastAPI(
    title="CulturaSafe Backend API",
    description="Smart Tourism, Belongings Safety & GPS Location Tracking REST API for CulturaSafe",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)

# 1. CORS Middleware
origins = settings.ALLOWED_ORIGINS
if isinstance(origins, str):
    origins = [o.strip() for o in origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# 2. Rate Limiting Middleware
@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    path = request.url.path
    # Apply global rate limit to /api calls except health and docs
    if path.startswith("/api") and not (path in ("/api/health", "/api", "/api/docs", "/api/docs/spec")):
        client_ip = request.client.host if request.client else "127.0.0.1"
        try:
            api_limiter.check(client_ip)
        except AppException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "success": False,
                    "error": {
                        "code": exc.code,
                        "message": exc.message,
                        "details": exc.details
                    }
                }
            )

    response = await call_next(request)
    return response


# 3. Exception Handlers matching Node Express response format
@app.exception_handler(AppException)
async def app_exception_handler(_request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    details = []
    for error in exc.errors():
        field_parts = [str(x) for x in error.get("loc", []) if x not in ("body", "query", "path")]
        details.append({
            "field": ".".join(field_parts) if field_parts else "body",
            "message": error.get("msg", "")
        })

    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_FAILED",
                "message": "Invalid request body parameters.",
                "details": details
            }
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "error": {
                    "code": "ROUTE_NOT_FOUND",
                    "message": f"The requested endpoint {request.method} {request.url.path} does not exist."
                }
            }
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail)
            }
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc) if settings.ENVIRONMENT == "development" else "An unexpected internal server error occurred."
            }
        }
    )


# 4. OpenAPI Spec & Documentation Viewer
@app.get("/api/docs/spec")
async def get_openapi_spec():
    root_openapi = Path(__file__).resolve().parent.parent.parent / "openapi.json"
    if root_openapi.exists():
        with open(root_openapi, "r", encoding="utf-8") as f:
            return json.load(f)
    return app.openapi()


@app.get("/api/docs", response_class=HTMLResponse)
async def get_rapidoc():
    return """
<!DOCTYPE html>
<html>
<head>
  <title>CulturaSafe Backend API Documentation (FastAPI)</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/rapidoc/dist/rapidoc.min.css"/>
  <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
</head>
<body style="margin:0;font-family:sans-serif;">
  <rapi-doc
    spec-url="/api/docs/spec"
    theme="light"
    primary-color="#1F4D3A"
    render-style="view"
    show-header="true"
    allow-authentication="true"
    allow-server-selection="true"
  >
    <div slot="header" style="display:flex;align-items:center;gap:12px;padding:8px 16px;">
      <h2 style="margin:0;color:#1F4D3A;">🏛️ CulturaSafe REST API (FastAPI)</h2>
    </div>
  </rapi-doc>
</body>
</html>
    """


# 5. Route Mounting
app.include_router(health_router, prefix="/api")

api_v1 = FastAPI()
api_v1.include_router(auth_router)
api_v1.include_router(user_router)
api_v1.include_router(destinations_router)
api_v1.include_router(itineraries_router)
api_v1.include_router(location_router)
api_v1.include_router(belongings_router)
api_v1.include_router(sync_router)

# Mount directly with prefix for transparent routing
app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(destinations_router, prefix="/api/v1")
app.include_router(itineraries_router, prefix="/api/v1")
app.include_router(location_router, prefix="/api/v1")
app.include_router(belongings_router, prefix="/api/v1")
app.include_router(sync_router, prefix="/api/v1")
