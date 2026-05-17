"use client";
import { useState, useEffect, useRef } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [error, setError] = useState({});

  // FIX: edit customer state
  const [editCustomer, setEditCustomer] = useState(null); // null = modal closed
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [editError, setEditError] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // FIX: debounce ref — prevents an API call on every single keystroke
  const searchTimeout = useRef(null);

  const fetchCustomers = async (q = "") => {
    setLoading(true);
    const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}`);
    const data = await res.json();
    setCustomers(data.customers);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // FIX: debounced search — waits 300ms after typing stops before calling API
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchCustomers(value);
    }, 300);
  };

  const validate = (f) => {
    let e = {};
    if (!f.name.trim()) e.name = "Name is required";
    if (!/^\d{10}$/.test(f.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid 10-digit number";
    return e;
  };

  // ── Add customer ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate(form);
    if (Object.keys(e).length > 0) {
      setError(e);
      return;
    }
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setShowForm(false);
      setForm({ name: "", phone: "", address: "" });
      setError({});
      fetchCustomers();
    } else {
      setError({ phone: data.error || "Could not add customer" });
    }
  };

  // ── Delete customer ─────────────────────────────────────────────────────────
  // FIX: confirm dialog now in English
  const handleDelete = async (id, name) => {
    if (
      !confirm(
        `Delete "${name}"? This will permanently remove all their services and bills.`,
      )
    )
      return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchCustomers(search);
  };

  // ── Edit customer ───────────────────────────────────────────────────────────
  // FIX: new edit modal
  const openEdit = (customer) => {
    setEditCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || "",
    });
    setEditError({});
  };

  const handleEditSave = async () => {
    const e = validate(editForm);
    if (Object.keys(e).length > 0) {
      setEditError(e);
      return;
    }
    setEditSaving(true);
    const res = await fetch(`/api/customers/${editCustomer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setEditSaving(false);
    if (data.success) {
      setEditCustomer(null);
      fetchCustomers(search);
    } else {
      setEditError({ phone: data.error || "Could not save changes" });
    }
  };

  const regularCustomers = customers.filter((c) => c.phone !== "0000000000");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">
            {regularCustomers.length} total customers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* AUTOMATION 5: Export customers as CSV */}
          <button
            onClick={() => {
              window.location.href = "/api/export?type=customers";
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all shadow-sm"
          >
            + Add Customer
          </button>
        </div>
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">
            New Customer
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                Full name
              </label>
              <input
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 ${error.name ? "border-red-400" : "border-gray-200"}`}
                placeholder="Customer name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {error.name && (
                <p className="text-xs text-red-500 mt-1">{error.name}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                Phone number
              </label>
              <input
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 ${error.phone ? "border-red-400" : "border-gray-200"}`}
                placeholder="10-digit number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              {error.phone && (
                <p className="text-xs text-red-500 mt-1">{error.phone}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                Address <span className="text-gray-400">(optional)</span>
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                placeholder="Customer address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowForm(false);
                setError({});
              }}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700"
            >
              Save Customer
            </button>
          </div>
        </div>
      )}

      {/* Search — FIX: debounced, no API call on every keystroke */}
      <div className="relative">
        <svg
          className="absolute left-4 top-3.5 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white"
          placeholder="Search by name or phone..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                "Customer",
                "Phone",
                "Address",
                "Services",
                "Joined",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center text-gray-400"
                >
                  Loading...
                </td>
              </tr>
            ) : regularCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-gray-500 font-medium">No customers yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Add your first customer to get started
                  </p>
                </td>
              </tr>
            ) : (
              regularCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-800">
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.address || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                      {c.services.length} services
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  {/* FIX: added Edit button + English confirm on Delete */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── FIX: Edit Customer Modal ─────────────────────────────────────────── */}
      {editCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">
                Edit Customer
              </h2>
              <button
                onClick={() => setEditCustomer(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Full name
                </label>
                <input
                  className={`w-full px-4 py-3 border rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 ${editError.name ? "border-red-400" : "border-gray-200"}`}
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
                {editError.name && (
                  <p className="text-xs text-red-500 mt-1">{editError.name}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Phone number
                </label>
                <input
                  className={`w-full px-4 py-3 border rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 ${editError.phone ? "border-red-400" : "border-gray-200"}`}
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
                {editError.phone && (
                  <p className="text-xs text-red-500 mt-1">{editError.phone}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Address <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditCustomer(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
