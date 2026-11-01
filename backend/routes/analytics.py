
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import select, func, case

from extensions import db
from models.customer import Customer

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/summary")
@jwt_required()
def summary():
    user_id = int(get_jwt_identity())

    # Count customers belonging to the logged-in user.
    statement = select(
        func.count(Customer.id).label("total"),
        func.sum(
            case((Customer.status == "active", 1), else_=0)
        ).label("active"),
        func.sum(
            case((Customer.status == "inactive", 1), else_=0)
        ).label("inactive"),
        func.sum(
            case((Customer.status == "lead", 1), else_=0)
        ).label("leads"),
    ).where(Customer.user_id == user_id)

    result = db.session.execute(statement).one()

    total = result.total or 0
    active = result.active or 0
    inactive = result.inactive or 0
    leads = result.leads or 0

    active_percentage = round((active / total) * 100, 2) if total else 0
    inactive_percentage = round((inactive / total) * 100, 2) if total else 0
    lead_percentage = round((leads / total) * 100, 2) if total else 0

    return jsonify({
        "total_customers": total,
        "active_customers": active,
        "inactive_customers": inactive,
        "leads": leads,
        "status_percentages": {
            "active": active_percentage,
            "inactive": inactive_percentage,
            "lead": lead_percentage,
        },
    }), 200


@analytics_bp.get("/monthly-growth")
@jwt_required()
def monthly_growth():
    user_id = int(get_jwt_identity())

    # Group customers by the year and month they were created.
    month_expression = func.strftime("%Y-%m", Customer.created_at)

    statement = (
        select(
            month_expression.label("month"),
            func.count(Customer.id).label("count"),
        )
        .where(Customer.user_id == user_id)
        .group_by(month_expression)
        .order_by(month_expression)
    )

    rows = db.session.execute(statement).all()

    return jsonify({
        "monthly_growth": [
            {"month": row.month, "count": row.count}
            for row in rows
        ]
    }), 200
