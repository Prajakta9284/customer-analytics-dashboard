# Customer Analytics Dashboard

Project Overview
Customer Analytics Dashboard is a full-stack web application designed to manage customer information and visualize customer-related business insights. It provides secure authentication, customer management, analytics dashboards, and data export functionality.

Technologies Used

Frontend
- React
- TypeScript
- Vite
- Axios
- React Router
- Recharts
- CSS

Backend
- Python
- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-Migrate
- Flask-CORS

Database
- SQLite

Testing
- Pytest

Features
- User registration and login
- JWT-based authentication
- Protected application routes
- Customer management (Create, Read, Update, Delete)
- Customer search and status filtering
- Dashboard summary cards
- Customer growth chart
- Customer status distribution chart
- CSV export
- PDF export
- User-specific customer data access

Project Structure


customer-analytics/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── app.py
│   ├── config.py
│   ├── extensions.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── pages/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
│
└── README.md


Installation and Setup

1. Clone the repository


git clone YOUR_GITHUB_REPOSITORY_URL
cd customer-analytics


2. Backend setup


cd backend
python -m venv .venv


Activate the environment on Windows:


.venv\Scripts\Activate.ps1


Install dependencies:


pip install -r requirements.txt


Create a `.env` file with your own secret values:


SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///customer_analytics.db


Create database tables:

python -c "from app import app; from extensions import db; import models; app.app_context().push(); db.create_all()"


Run the backend:

python app.py

Backend URL: http://127.0.0.1:5000

3. Frontend setup

Open another terminal:


cd frontend
npm install
npm run dev


Frontend URL: http://localhost:5173

Run Backend Tests

From the backend directory:

python -m pytest -v


Security
- Passwords are stored as hashes.
- JWT tokens protect private API endpoints.
- Customer records are restricted to their owners.
- Secret keys should be stored in environment variables.
- Never commit `.env` or virtual environment files to GitHub.

Future Enhancements
- PostgreSQL integration
- Advanced customer segmentation
- More interactive analytics
- Docker deployment
- Cloud hosting
- Automated CI/CD pipeline

Author
Developed as a full-stack Customer Analytics project.
