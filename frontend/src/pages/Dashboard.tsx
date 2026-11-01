
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users, UserCheck, UserX, UserPlus, LogOut } from "lucide-react";
import api from "../api/client";

interface Summary {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  leads: number;
  status_percentages: {
    active: number;
    inactive: number;
    lead: number;
  };
}

interface MonthlyGrowth {
  month: string;
  count: number;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [growth, setGrowth] = useState<MonthlyGrowth[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryResponse, growthResponse] = await Promise.all([
          api.get("/analytics/summary"),
          api.get("/analytics/monthly-growth"),
        ]);

        setSummary(summaryResponse.data);

        const growthData = growthResponse.data;

        const monthlyData = Array.isArray(growthData)
         ? growthData
         : growthData.monthly_growth ??
           growthData.data ??
           [];

        setGrowth(Array.isArray(monthlyData) ? monthlyData : []);
      } catch {
        setError("Unable to load analytics. Please check your backend.");
      }
    }

    loadDashboard();
  }, []);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  if (error) return <p>{error}</p>;
  if (!summary) return <p>Loading dashboard...</p>;

  const cards = [
    { title: "Total Customers", value: summary.total_customers, icon: Users },
    { title: "Active Customers", value: summary.active_customers, icon: UserCheck },
    { title: "Inactive Customers", value: summary.inactive_customers, icon: UserX },
    { title: "Leads", value: summary.leads, icon: UserPlus },
  ];

  const pieData = [
    { name: "Active", value: summary.active_customers },
    { name: "Inactive", value: summary.inactive_customers },
    { name: "Leads", value: summary.leads },
  ];

  const colors = ["#16a34a", "#dc2626", "#2563eb"];

  function handleLogout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Customer Analytics</h1>
          <p>Monitor your customer performance</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/customers">Customers</Link>
          <button onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
          {/* <button onClick={handleLogout} className="logout-button">
            Logout
          </button> */}
        </div>
      </header>

      <section className="summary-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="summary-card" key={card.title}>
              <Icon size={26} />
              <p>{card.title}</p>
              <h2>{card.value}</h2>
            </article>
          );
        })}
      </section>

      <section className="charts-grid">
        <article className="chart-card">
          <h2>Monthly Customer Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-card">
          <h2>Customer Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </section>
    </main>
  );
}
