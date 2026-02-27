"""
Sentry integration for error tracking.
"""
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging

def init_sentry(dsn: str = None, environment: str = "development"):
    """
    Initialize Sentry SDK for error tracking.
    """
    if not dsn:
        # Don't initialize if no DSN provided
        return
    
    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
            LoggingIntegration(
                level=logging.INFO,
                event_level=logging.ERROR
            )
        ],
        traces_sample_rate=0.1,  # Sample 10% of transactions
        send_default_pii=False,   # Don't send personal data
        max_request_body_size="never",
        attach_stacktrace=True,
    )
    
    logging.info("Sentry initialized for environment: %s", environment)