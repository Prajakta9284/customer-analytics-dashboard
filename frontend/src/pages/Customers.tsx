
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: "active" | "inactive" | "lead";
  created_at: string;
}

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "inactive" | "lead";
}

const emptyForm: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "active",
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCustomers() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/customers", {
        params: {
          search: search || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      });

      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data.customers ?? data.data ?? [];

      setCustomers(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { error?: string; message?: string } } })
              .response?.data?.error ??
            (err as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : undefined;

      setError(message ?? "Unable to load customers. Please check your backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter]);

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEditForm(customer: Customer) {
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      company: customer.company ?? "",
      status: customer.status,
    });
    setEditingId(customer.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingId !== null) {
        await api.put(`/customers/${editingId}`, form);
        setSuccess("Customer updated successfully.");
      } else {
        await api.post("/customers", form);
        setSuccess("Customer added successfully.");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadCustomers();
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { error?: string; message?: string } } })
              .response?.data?.error ??
            (err as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : undefined;

      setError(message ?? "Unable to save customer. Please try again.");
    }
  }

  async function deleteCustomer(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/customers/${id}`);
      setSuccess("Customer deleted successfully.");
      await loadCustomers();
    } catch {
      setError("Unable to delete customer. Please try again.");
    }
  }

  
function exportCSV() {
  if (customers.length === 0) {
    setError("No customer records available to export.");
    return;
  }

  const headers = [
    "ID",
    "Name",
    "Email",
    "Phone",
    "Company",
    "Status",
    "Created At",
  ];

  const rows = customers.map((customer) => [
    customer.id,
    customer.name,
    customer.email,
    customer.phone ?? "",
    customer.company ?? "",
    customer.status,
    customer.created_at,
  ]);

  const escapeCSV = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "customer_data.csv";
  link.click();

  URL.revokeObjectURL(url);
  setSuccess("Customer data exported successfully.");
}

function exportPDF() {
  if (customers.length === 0) {
    setError("No customer records available to export.");
    return;
  }

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Customer Analytics Report", 14, 20);

  doc.setFontSize(10);
  doc.text(
    `Generated on: ${new Date().toLocaleDateString()}`,
    14,
    28
  );

  autoTable(doc, {
    startY: 35,
    head: [[
      "ID",
      "Name",
      "Email",
      "Phone",
      "Company",
      "Status",
    ]],
    body: customers.map((customer) => [
      customer.id,
      customer.name,
      customer.email,
      customer.phone ?? "",
      customer.company ?? "",
      customer.status,
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [37, 99, 235],
    },
  });

  doc.save("customer_report.pdf");
  setSuccess("Customer PDF exported successfully.");
}

  return (
    <main className="customers-page">
      <header className="customers-header">
        <div>
          <h1>Customer Management</h1>
          <p>Manage and organize your customer records.</p>
        </div>

        <div className="customer-actions">
          <Link to="/dashboard" className="back-link">
            Dashboard
          </Link>

          <button className="export-button" onClick={exportCSV}>
            Export CSV
          </button>

          <button className="export-button" onClick={exportPDF}>
            Export PDF
          </button>
          
          <button className="add-button" onClick={openAddForm}>
            + Add Customer
          </button>
        </div>
      </header>

      {error && <p className="customer-error">{error}</p>}
      {success && <p className="customer-success">{success}</p>}

      {showForm && (
        <section className="customer-form-card">
          <h2>{editingId !== null ? "Edit Customer" : "Add New Customer"}</h2>

          <form onSubmit={handleSubmit} className="customer-form">
            <label>
              Customer Name *
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="Enter customer name"
                required
              />
            </label>

            <label>
              Email Address *
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="Enter email address"
                required
              />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </label>

            <label>
              Company
              <input
                value={form.company}
                onChange={(e) =>
                  setForm({ ...form, company: e.target.value })
                }
                placeholder="Enter company name"
              />
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as CustomerForm["status"],
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="lead">Lead</option>
              </select>
            </label>

            <div className="form-buttons">
              <button type="submit" className="add-button">
                {editingId !== null ? "Update Customer" : "Save Customer"}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="customer-list-card">
        <div className="customer-filters">
          <input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lead">Lead</option>
          </select>
        </div>

        {loading ? (
          <p>Loading customers...</p>
        ) : customers.length === 0 ? (
          <p className="empty-message">No customers found. Add your first customer!</p>
        ) : (
          <div className="table-wrapper">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || "-"}</td>
                    <td>{customer.company || "-"}</td>
                    <td>
                      <span className={`status-badge ${customer.status}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="edit-button"
                          onClick={() => openEditForm(customer)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => deleteCustomer(customer.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
