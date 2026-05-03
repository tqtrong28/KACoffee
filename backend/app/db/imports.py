def load_model_modules() -> None:
    from app.modules.admin import models as admin_models  # noqa: F401
    from app.modules.audit_logs import models as audit_log_models  # noqa: F401
    from app.modules.auth import models as auth_models  # noqa: F401
    from app.modules.bottle_exchange import models as bottle_exchange_models  # noqa: F401
    from app.modules.catalog import models as catalog_models  # noqa: F401
    from app.modules.customer_notifications import models as customer_notification_models  # noqa: F401
    from app.modules.customers import models as customer_models  # noqa: F401
    from app.modules.deliveries import models as delivery_models  # noqa: F401
    from app.modules.discounts import models as discount_models  # noqa: F401
    from app.modules.membership import models as membership_models  # noqa: F401
    from app.modules.orders import models as order_models  # noqa: F401
    from app.modules.performance_targets import models as performance_target_models  # noqa: F401
    from app.modules.system_settings import models as system_setting_models  # noqa: F401

