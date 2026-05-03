from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.errors import request_validation_exception_handler
from app.db.session import SessionLocal, check_database_connection, init_db
from app.modules.admin.router import router as admin_router
from app.modules.audit_logs.router import router as audit_logs_router
from app.modules.auth.router import router as auth_router
from app.modules.bottle_exchange.router import admin_router as admin_bottle_exchange_router
from app.modules.bottle_exchange.router import staff_router as staff_bottle_exchange_router
from app.modules.branches.router import admin_router as admin_branches_router
from app.modules.branches.router import router as branches_router
from app.modules.catalog.router import router as catalog_router
from app.modules.customer_notifications.router import router as customer_notifications_router
from app.modules.customers.router import router as customers_router
from app.modules.deliveries.router import admin_router as admin_deliveries_router
from app.modules.deliveries.router import shipper_router as shipper_deliveries_router
from app.modules.discounts.router import admin_router as admin_discounts_router
from app.modules.discounts.router import router as discounts_router
from app.modules.employees.router import router as employees_router
from app.modules.membership.router import router as membership_router
from app.modules.orders.router import admin_router as admin_orders_router
from app.modules.orders.router import router as orders_router
from app.modules.orders.router import staff_router as staff_orders_router
from app.modules.performance_targets.router import router as performance_targets_router
from app.modules.reporting.router import router as reporting_router
from app.modules.system_settings.router import admin_router as admin_system_settings_router
from app.modules.system_settings.router import router as system_settings_router
from app.seed.data import seed_initial_data

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.auto_init_db_on_startup:
        init_db(run_compat_migrations=settings.run_legacy_compat_migrations)
    if settings.auto_seed_on_startup:
        db = SessionLocal()
        try:
            seed_initial_data(db, settings.default_admin_username, settings.default_admin_password)
        finally:
            db.close()
    yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)
app.add_exception_handler(RequestValidationError, request_validation_exception_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = settings.api_prefix
app.include_router(auth_router, prefix=api_prefix)
app.include_router(branches_router, prefix=api_prefix)
app.include_router(customer_notifications_router, prefix=api_prefix)
app.include_router(customers_router, prefix=api_prefix)
app.include_router(membership_router, prefix=api_prefix)
app.include_router(catalog_router, prefix=api_prefix)
app.include_router(discounts_router, prefix=api_prefix)
app.include_router(admin_discounts_router, prefix=api_prefix)
app.include_router(employees_router, prefix=api_prefix)
app.include_router(system_settings_router, prefix=api_prefix)
app.include_router(orders_router, prefix=api_prefix)
app.include_router(staff_orders_router, prefix=api_prefix)
app.include_router(staff_bottle_exchange_router, prefix=api_prefix)
app.include_router(admin_router, prefix=api_prefix)
app.include_router(admin_branches_router, prefix=api_prefix)
app.include_router(admin_system_settings_router, prefix=api_prefix)
app.include_router(performance_targets_router, prefix=api_prefix)
app.include_router(admin_orders_router, prefix=api_prefix)
app.include_router(admin_deliveries_router, prefix=api_prefix)
app.include_router(shipper_deliveries_router, prefix=api_prefix)
app.include_router(admin_bottle_exchange_router, prefix=api_prefix)
app.include_router(reporting_router, prefix=api_prefix)
app.include_router(audit_logs_router, prefix=api_prefix)


@app.get("/health", response_model=None)
def health_check() -> dict[str, str] | JSONResponse:
    try:
        check_database_connection()
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "database": "unreachable"},
        )
    return {"status": "ok", "database": "reachable"}
