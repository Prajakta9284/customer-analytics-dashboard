
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import select, or_

from extensions import db
from models.customer import Customer



customers_bp = Blueprint("customers", __name__)

VALID_STATUSES = {"active", "inactive", "lead"}


def get_customer_data(data):
    name = data.get("name", "")
    email = data.get("email", "")

    if not isinstance(name, str) or not isinstance(email, str):
        return None, "Name and email must be text."

    name = name.strip()
    email = email.strip().lower()

    if not name or not email:
        return None, "Name and email are required."

    if len(name) > 100 or len(email) > 150:
        return None, "Name or email is too long."

    phone = data.get("phone")
    company = data.get("company")
    status = data.get("status", "active")

    if phone is not None and not isinstance(phone, str):
        return None, "Phone must be text."

    if company is not None and not isinstance(company, str):
        return None, "Company must be text."

    if not isinstance(status, str) or status not in VALID_STATUSES:
        return None, "Status must be active, inactive, or lead."

    if phone and len(phone) > 20:
        return None, "Phone must be at most 20 characters."

    if company and len(company) > 150:
        return None, "Company must be at most 150 characters."

    return {
        "name": name,
        "email": email,
        "phone": phone.strip() if phone else None,
        "company": company.strip() if company else None,
        "status": status,
    }, None


def find_owned_customer(customer_id, user_id):
    return db.session.execute(
        select(Customer).where(
            Customer.id == customer_id,
            Customer.user_id == user_id,
        )
    ).scalar_one_or_none()


@customers_bp.route("", methods=["GET"])
@jwt_required()
def list_customers():
    user_id = int(get_jwt_identity())

    query = select(Customer).where(Customer.user_id == user_id)

    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip().lower()

    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Customer.name.ilike(pattern),
                Customer.email.ilike(pattern),
                Customer.company.ilike(pattern),
            )
        )

    if status:
        if status not in VALID_STATUSES:
            return jsonify({"error": "Invalid status filter."}), 400

        query = query.where(Customer.status == status)

    query = query.order_by(Customer.id.desc())
    customers = db.session.execute(query).scalars().all()

    return jsonify({
        "customers": [customer.to_dict() for customer in customers],
        "count": len(customers),
    }), 200


@customers_bp.route("", methods=["POST"])
@jwt_required()
def create_customer():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A JSON object is required."}), 400

    customer_data, error = get_customer_data(data)

    if error:
        return jsonify({"error": error}), 400

    user_id = int(get_jwt_identity())

    customer = Customer(**customer_data, user_id=user_id)

    db.session.add(customer)
    db.session.commit()

    return jsonify({
        "message": "Customer created successfully.",
        "customer": customer.to_dict(),
    }), 201


@customers_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_customer(customer_id):
    user_id = int(get_jwt_identity())
    customer = find_owned_customer(customer_id, user_id)

    if customer is None:
        return jsonify({"error": "Customer not found."}), 404

    return jsonify({"customer": customer.to_dict()}), 200


@customers_bp.route("/<int:customer_id>", methods=["PUT"])
@jwt_required()
def update_customer(customer_id):
    user_id = int(get_jwt_identity())
    customer = find_owned_customer(customer_id, user_id)

    if customer is None:
        return jsonify({"error": "Customer not found."}), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A JSON object is required."}), 400

    customer_data, error = get_customer_data(data)

    if error:
        return jsonify({"error": error}), 400

    for field, value in customer_data.items():
        setattr(customer, field, value)

    db.session.commit()

    return jsonify({
        "message": "Customer updated successfully.",
        "customer": customer.to_dict(),
    }), 200


@customers_bp.route("/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id):
    user_id = int(get_jwt_identity())
    customer = find_owned_customer(customer_id, user_id)

    if customer is None:
        return jsonify({"error": "Customer not found."}), 404

    db.session.delete(customer)
    db.session.commit()

    return jsonify({"message": "Customer deleted successfully."}), 200
