"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [config, setConfig] = useState(null);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newService, setNewService] = useState({ name: "", price: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [editKey, setEditKey] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  // FIX: business info edit state
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    type: "",
  });
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSaved, setInfoSaved] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const res = await fetch("/api/setup");
    const data = await res.json();
    setConfig(data.config);
    setPrices(data.config?.prices || {});
    setLoading(false);
  };

  const saveServices = async (updatedPrices) => {
    setSaving(true);
    await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: config.businessName,
        ownerName: config.ownerName,
        phone: config.phone,
        type: config.type,
        prices: updatedPrices,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchConfig();
  };

  const handleAddService = async () => {
    if (!newService.name.trim() || !newService.price) return;
    const key = newService.name.toLowerCase().replace(/\s+/g, "_");
    const updated = { ...prices, [key]: newService.price };
    setPrices(updated);
    setNewService({ name: "", price: "" });
    setShowAdd(false);
    await saveServices(updated);
  };

  const handleEditSave = async (key) => {
    const updated = { ...prices, [key]: editPrice };
    setPrices(updated);
    setEditKey(null);
    await saveServices(updated);
  };

  // FIX: confirm dialog in English
  const handleDelete = async (key) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    const updated = { ...prices };
    delete updated[key];
    setPrices(updated);
    await saveServices(updated);
  };

  // ── FIX: Business info edit handlers ────────────────────────────────────────
  const startEditingInfo = () => {
    setInfoForm({
      businessName: config.businessName,
      ownerName: config.ownerName,
      phone: config.phone,
      type: config.type,
    });
    setEditingInfo(true);
  };

  const saveInfo = async () => {
    if (
      !infoForm.businessName.trim() ||
      !infoForm.ownerName.trim() ||
      !infoForm.phone.trim()
    )
      return;
    setInfoSaving(true);
    await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...infoForm, prices }),
    });
    setInfoSaving(false);
    setEditingInfo(false);
    setInfoSaved(true);
    setTimeout(() => setInfoSaved(false), 2000);
    fetchConfig();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your business info and services
          </p>
        </div>
        {(saved || infoSaved) && (
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
            ✅ Saved successfully!
          </div>
        )}
      </div>

      {/* ── FIX: Business info — now editable ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">
            Business Info
          </h2>
          {!editingInfo ? (
            <button
              onClick={startEditingInfo}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-all"
            >
              ✏️ Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingInfo(false)}
                className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveInfo}
                disabled={infoSaving}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50"
              >
                {infoSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        {editingInfo ? (
          /* Edit mode */
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">
                BUSINESS NAME
              </label>
              <input
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                value={infoForm.businessName}
                onChange={(e) =>
                  setInfoForm({ ...infoForm, businessName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">
                OWNER NAME
              </label>
              <input
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                value={infoForm.ownerName}
                onChange={(e) =>
                  setInfoForm({ ...infoForm, ownerName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">
                PHONE
              </label>
              <input
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                value={infoForm.phone}
                onChange={(e) =>
                  setInfoForm({ ...infoForm, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">
                BUSINESS TYPE
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white"
                value={infoForm.type}
                onChange={(e) =>
                  setInfoForm({ ...infoForm, type: e.target.value })
                }
              >
                <option value="cyber">🖥️ Cyber / Print Shop</option>
                <option value="retail">🛒 Retail / General Store</option>
                <option value="medical">🏥 Medical / Clinic</option>
              </select>
            </div>
          </div>
        ) : (
          /* View mode */
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Business name", value: config?.businessName },
              { label: "Owner name", value: config?.ownerName },
              { label: "Phone", value: config?.phone },
              {
                label: "Business type",
                value:
                  config?.type === "cyber"
                    ? "🖥️ Cyber / Print Shop"
                    : config?.type === "retail"
                      ? "🛒 Retail / General Store"
                      : "🏥 Medical / Clinic",
              },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">
                  {f.label}
                </p>
                <p className="text-sm font-semibold text-gray-800">{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Services manager */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Services & Prices
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Add, edit or delete your services
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700"
          >
            + Add Service
          </button>
        </div>

        {/* Add new service form */}
        {showAdd && (
          <div className="px-6 py-4 bg-green-50 border-b border-green-100">
            <p className="text-sm font-medium text-gray-700 mb-3">
              New service
            </p>
            <div className="flex gap-3">
              <input
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500"
                placeholder="Service name (e.g. Colour Print)"
                value={newService.name}
                onChange={(e) =>
                  setNewService({ ...newService, name: e.target.value })
                }
              />
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-green-500">
                <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">
                  ₹
                </span>
                <input
                  type="number"
                  className="px-3 py-2.5 text-sm outline-none w-24"
                  placeholder="Price"
                  value={newService.price}
                  onChange={(e) =>
                    setNewService({ ...newService, price: e.target.value })
                  }
                />
              </div>
              <button
                onClick={handleAddService}
                disabled={saving}
                className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Services list */}
        <div className="divide-y divide-gray-100">
          {Object.keys(prices).length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No services yet — add one!</p>
            </div>
          ) : (
            Object.entries(prices).map(([key, price]) => (
              <div
                key={key}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {key.replace(/_/g, " ").toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Key: {key}</p>
                </div>

                <div className="flex items-center gap-3">
                  {editKey === key ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-green-300 rounded-lg overflow-hidden">
                        <span className="px-2 py-1.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">
                          ₹
                        </span>
                        <input
                          type="number"
                          className="px-2 py-1.5 text-sm outline-none w-20"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => handleEditSave(key)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditKey(null)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-base font-bold text-green-700">
                        ₹{price}
                      </span>
                      <button
                        onClick={() => {
                          setEditKey(key);
                          setEditPrice(price);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(key)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
