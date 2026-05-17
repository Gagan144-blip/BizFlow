"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import BillPDF from "@/components/BillPDF";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false },
);

export default function BillingPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [services, setServices] = useState([]); // unbilled services only
  const [bill, setBill] = useState(null); // the generated bill
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [config, setConfig] = useState(null);
  const [billError, setBillError] = useState("");

  // FIX: GST state
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(18);

  // FIX: mark-as-paid state per bill row
  const [payingId, setPayingId] = useState(null); // which bill is being paid
  const [payMethod, setPayMethod] = useState("cash"); // cash / upi / card
  const [cashReceived, setCashReceived] = useState(""); // AUTOMATION 4: change calculator
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchBills();
    fetchConfig();
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(data.customers);
  };

  const fetchBills = async () => {
    const res = await fetch("/api/bills");
    const data = await res.json();
    setBills(data.bills);
  };

  const fetchConfig = async () => {
    const res = await fetch("/api/setup");
    const data = await res.json();
    setConfig(data.config);
  };

  // FIX: fetch ONLY unbilled services for the selected customer
  const handleCustomerSelect = async (customerId) => {
    if (!customerId) {
      setSelectedCustomer(null);
      setServices([]);
      setBill(null);
      setBillError("");
      return;
    }
    const customer = customers.find((c) => c.id === parseInt(customerId));
    setSelectedCustomer(customer);
    setBill(null);
    setBillError("");
    const res = await fetch(
      `/api/services?customerId=${customerId}&unbilled=true`,
    );
    const data = await res.json();
    setServices(data.services);
  };

  const generateBill = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    setBillError("");
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: selectedCustomer.id,
        gstRate: gstEnabled ? gstRate : 0,
        paymentMethod: null,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setBill(data);
      fetchBills();
    } else {
      setBillError(data.error || "Could not generate bill.");
    }
    setLoading(false);
  };

  const markAsPaid = async (billId) => {
    const res = await fetch("/api/bills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: billId, paymentMethod: payMethod }),
    });
    const data = await res.json();
    if (data.success) {
      setPayingId(null);
      setCashReceived("");
      fetchBills();
    }
  };

  // AUTOMATION 5: trigger CSV download — no library needed, browser handles it
  const exportCSV = () => {
    window.location.href = "/api/export?type=bills";
  };

  // FREE WhatsApp sharing via wa.me deep link — no Twilio, no API, no cost
  // Opens WhatsApp Web (desktop) or WhatsApp app (mobile) with number + message pre-filled
  const shareOnWhatsApp = () => {
    if (!selectedCustomer?.phone || !bill) return;
    const lines = [
      `🧾 *${config?.businessName} — Invoice*`,
      `━━━━━━━━━━━━━━━`,
      `👤 Customer: ${selectedCustomer.name}`,
      `📞 Phone: ${selectedCustomer.phone}`,
      ``,
      `📋 *Services:*`,
      ...services.map(
        (s) =>
          `• ${s.type.replace(/_/g, " ").toUpperCase()} × ${s.quantity} = ₹${s.price}`,
      ),
      `━━━━━━━━━━━━━━━`,
      ...(bill.gstAmount > 0
        ? [
            `Subtotal: ₹${bill.subtotal}`,
            `GST (${bill.gstRate}%): ₹${bill.gstAmount}`,
          ]
        : []),
      `💰 *Total: ₹${bill.total}*`,
      `━━━━━━━━━━━━━━━`,
      `Thank you for visiting! 🙏`,
      `_Powered by BizFlow_`,
    ];
    const text = encodeURIComponent(lines.join("\n"));
    window.open(
      `https://wa.me/91${selectedCustomer.phone}?text=${text}`,
      "_blank",
    );
  };

  // Copy formatted bill text to clipboard — paste into SMS, email, anywhere
  const copyBillText = async () => {
    if (!bill) return;
    const lines = [
      `${config?.businessName} — Invoice`,
      `───────────────`,
      `Customer : ${selectedCustomer?.name}`,
      `Phone    : ${selectedCustomer?.phone}`,
      ``,
      `Services :`,
      ...services.map(
        (s) =>
          `  ${s.type.replace(/_/g, " ").toUpperCase()} x${s.quantity}  ₹${s.price}`,
      ),
      `───────────────`,
      ...(bill.gstAmount > 0
        ? [
            `Subtotal : ₹${bill.subtotal}`,
            `GST (${bill.gstRate}%) : ₹${bill.gstAmount}`,
          ]
        : []),
      `Total    : ₹${bill.total}`,
      `───────────────`,
      `Thank you! — BizFlow`,
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // FIX: GST-aware totals
  const subtotal = services.reduce((sum, s) => sum + s.price, 0);
  const gstAmount = gstEnabled
    ? parseFloat(((subtotal * gstRate) / 100).toFixed(2))
    : 0;
  const total = subtotal + gstAmount;

  // FIX: billing stats now based on paid bills
  const totalBilled = bills.reduce((sum, b) => sum + b.total, 0);
  const paidCount = bills.filter((b) => b.isPaid).length;

  const statusColor = (s) => {
    if (s === "pending") return "bg-yellow-100 text-yellow-800";
    if (s === "in-progress") return "bg-blue-100 text-blue-800";
    if (s === "completed") return "bg-green-100 text-green-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
          <p className="text-gray-500 text-sm mt-1">
            Generate and manage customer bills
          </p>
        </div>
        {/* AUTOMATION 5: Export bills as CSV */}
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total bills",
            value: bills.length,
            color: "text-purple-700",
            bg: "bg-purple-50",
            border: "border-purple-200",
          },
          {
            label: "Total revenue",
            value: `₹${totalBilled}`,
            color: "text-green-700",
            bg: "bg-green-50",
            border: "border-green-200",
          },
          {
            label: "Avg bill value",
            value:
              bills.length > 0
                ? `₹${Math.round(totalBilled / bills.length)}`
                : "₹0",
            color: "text-blue-700",
            bg: "bg-blue-50",
            border: "border-blue-200",
          },
          // FIX: show paid bills count
          {
            label: "Bills paid",
            value: `${paidCount}/${bills.length}`,
            color: "text-orange-700",
            bg: "bg-orange-50",
            border: "border-orange-200",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-2xl p-5 border ${s.border}`}
          >
            <div className={`text-3xl font-bold ${s.color} mb-1`}>
              {s.value}
            </div>
            <div className="text-sm font-medium text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* ── Left — Generate Bill ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Generate Bill</h2>

          {/* Customer select */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <label className="text-sm font-medium text-gray-600 mb-2 block">
              Select customer
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white"
              onChange={(e) => handleCustomerSelect(e.target.value)}
            >
              <option value="">Choose customer...</option>
              {customers
                .filter((c) => c.phone !== "0000000000")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.phone}
                  </option>
                ))}
            </select>
          </div>

          {/* Services breakdown — FIX: only shows unbilled services */}
          {selectedCustomer && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      {selectedCustomer.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {selectedCustomer.phone}
                    </div>
                  </div>
                </div>
              </div>

              {services.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-gray-500 text-sm font-medium">
                    No pending services to bill
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    All services for this customer have already been billed
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {services.map((s) => (
                      <div
                        key={s.id}
                        className="px-5 py-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            {s.type.replace(/_/g, " ").toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Qty: {s.quantity}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(s.status)}`}
                          >
                            {s.status}
                          </span>
                          <span className="text-sm font-bold text-green-700">
                            ₹{s.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* FIX: GST section */}
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
                    {/* GST toggle */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gstEnabled}
                          onChange={(e) => setGstEnabled(e.target.checked)}
                          className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm font-medium text-gray-600">
                          Apply GST
                        </span>
                      </label>
                      {gstEnabled && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-lg outline-none focus:border-green-500 text-center"
                            value={gstRate}
                            onChange={(e) =>
                              setGstRate(parseFloat(e.target.value) || 0)
                            }
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      )}
                    </div>
                    {/* Breakdown */}
                    {gstEnabled && (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between text-gray-500">
                          <span>Subtotal</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-orange-600">
                          <span>GST ({gstRate}%)</span>
                          <span>+₹{gstAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    {/* Total */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                      <span className="font-bold text-gray-800">
                        Total Amount
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Error */}
                  {billError && (
                    <div className="px-5 py-3 bg-red-50 border-t border-red-100">
                      <p className="text-red-600 text-sm">⚠️ {billError}</p>
                    </div>
                  )}

                  {/* ── Generate button (before bill) ── */}
                  {!bill && (
                    <div className="px-5 py-4">
                      <button
                        onClick={generateBill}
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
                      >
                        {loading ? "Generating..." : "🧾 Generate & Save Bill"}
                      </button>
                    </div>
                  )}

                  {/* ── After bill generated ── */}
                  {bill && (
                    <div className="px-5 py-4 space-y-3">
                      {/* Success card — AUTOMATION 2: shows auto invoice number */}
                      <div className="w-full py-3 px-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <p className="text-green-700 font-bold text-sm">
                            ✅ Bill Generated!
                          </p>
                          {bill.bill?.invoiceNo && (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                              {bill.bill.invoiceNo}
                            </span>
                          )}
                        </div>
                        {bill.gstAmount > 0 ? (
                          <p className="text-green-600 text-xs mt-1">
                            Subtotal ₹{bill.subtotal} + GST ₹{bill.gstAmount} =
                            Total ₹{bill.total}
                          </p>
                        ) : (
                          <p className="text-green-600 text-xs mt-1">
                            Total ₹{bill.total} saved successfully
                          </p>
                        )}
                      </div>

                      {/* PDF Download — pass invoice number so PDF shows it */}
                      {config && (
                        <PDFDownloadLink
                          document={
                            <BillPDF
                              config={config}
                              customer={selectedCustomer}
                              services={services}
                              billNumber={bill.bill?.invoiceNo || bills.length}
                              gstEnabled={gstEnabled}
                              gstRate={gstRate}
                              gstAmount={bill.gstAmount}
                              subtotal={bill.subtotal}
                              total={bill.total}
                            />
                          }
                          fileName={`bill-${selectedCustomer?.name}-${bill?.bill?.id ?? "draft"}.pdf`}
                        >
                          {({ loading: pdfLoading }) => (
                            <button className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
                              {pdfLoading
                                ? "Preparing PDF..."
                                : "📄 Download PDF Bill"}
                            </button>
                          )}
                        </PDFDownloadLink>
                      )}

                      {/* WhatsApp deep-link — opens WA Web/App, no API needed */}
                      <button
                        onClick={shareOnWhatsApp}
                        disabled={selectedCustomer?.phone === "0000000000"}
                        className="w-full py-3 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1ebe5d] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Share on WhatsApp
                      </button>

                      {/* Copy bill text to clipboard — paste into SMS / email / anywhere */}
                      <button
                        onClick={copyBillText}
                        className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        {copied ? (
                          <>✅ Copied!</>
                        ) : (
                          <>
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="w-4 h-4"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                              />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                            Copy Bill Text
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Right — Bill History ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Bill History</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {bills.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">🧾</div>
                <p className="text-gray-500 font-medium">No bills yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Generate your first bill
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {/* FIX: added Customer and Payment columns */}
                    {[
                      "Bill #",
                      "Customer",
                      "Amount",
                      "Status",
                      "Date",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bills.map((b, i) => (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-gray-700">
                          #{bills.length - i}
                        </span>
                      </td>
                      {/* FIX: show customer name */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-700">
                          {b.customer?.name || "—"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {b.customer?.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-green-700">
                          ₹{b.total}
                        </span>
                        {b.gstRate > 0 && (
                          <div className="text-xs text-orange-500">
                            incl. {b.gstRate}% GST
                          </div>
                        )}
                      </td>
                      {/* FIX: paid / unpaid badge */}
                      <td className="px-4 py-3">
                        {b.isPaid ? (
                          <div>
                            <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              ✓ Paid
                            </span>
                            <div className="text-xs text-gray-400 mt-0.5 capitalize">
                              {b.paymentMethod}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-600 rounded-full">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(b.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      {/* FIX: Mark as paid action */}
                      <td className="px-4 py-3">
                        {b.isPaid ? (
                          <span className="text-xs text-gray-400 italic">
                            —
                          </span>
                        ) : payingId === b.id ? (
                          /* AUTOMATION 4: Change calculator shown when cash is selected */
                          <div className="space-y-2 min-w-[160px]">
                            <select
                              value={payMethod}
                              onChange={(e) => {
                                setPayMethod(e.target.value);
                                setCashReceived("");
                              }}
                              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white"
                            >
                              <option value="cash">💵 Cash</option>
                              <option value="upi">📱 UPI</option>
                              <option value="card">💳 Card</option>
                            </select>

                            {/* Change calculator — only for cash */}
                            {payMethod === "cash" && (
                              <div>
                                <input
                                  type="number"
                                  placeholder={`Received (₹${b.total}+)`}
                                  value={cashReceived}
                                  onChange={(e) =>
                                    setCashReceived(e.target.value)
                                  }
                                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-green-400"
                                />
                                {cashReceived !== "" &&
                                  (parseFloat(cashReceived) >= b.total ? (
                                    <p className="text-xs font-bold text-green-600 mt-1">
                                      ✅ Change: ₹
                                      {(
                                        parseFloat(cashReceived) - b.total
                                      ).toFixed(2)}
                                    </p>
                                  ) : (
                                    <p className="text-xs font-bold text-red-500 mt-1">
                                      ⚠ Short ₹
                                      {(
                                        b.total - parseFloat(cashReceived)
                                      ).toFixed(2)}
                                    </p>
                                  ))}
                              </div>
                            )}

                            <div className="flex gap-1">
                              <button
                                onClick={() => markAsPaid(b.id)}
                                disabled={
                                  payMethod === "cash" &&
                                  cashReceived !== "" &&
                                  parseFloat(cashReceived) < b.total
                                }
                                className="flex-1 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40"
                              >
                                ✓ Paid
                              </button>
                              <button
                                onClick={() => {
                                  setPayingId(null);
                                  setCashReceived("");
                                }}
                                className="px-2 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setPayingId(b.id);
                              setPayMethod("cash");
                              setCashReceived("");
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-all"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
