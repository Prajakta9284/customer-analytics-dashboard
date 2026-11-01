
def register_routes(app):
    from routes.auth import auth_bp
    from routes.customers import customers_bp
    from routes.analytics import analytics_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(customers_bp, url_prefix="/api/customers")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
