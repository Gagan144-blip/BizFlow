<div align="center">

# 🌿 BizFlow

### Multi-Business Automation & Management System

**Built for real business owners who are tired of doing everything manually.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![NextAuth](https://img.shields.io/badge/NextAuth-v4-purple?style=for-the-badge)](https://next-auth.js.org)

</div>

---

## 📖 What is BizFlow?

BizFlow is a **full-stack business management platform** built for small business owners — starting with a real cyber cafe owner who was wasting hours every day doing manual work like billing customers, combining Aadhaar cards, and arranging passport photos.

Instead of using 5 different tools, BizFlow puts everything in **one place**.

> 💡 **Real problem, real solution** — This project was built by talking to an actual cyber cafe owner, understanding their daily struggles, and automating the most painful parts of their workflow.

---

## 🏪 Who is it for?

BizFlow supports **3 types of businesses** — each gets its own customized dashboard, services, and pricing:

| Business Type | Icon | Example Services |
|---|---|---|
| **Cyber Cafe / Print Shop** | 🖥️ | Print B&W, Color, Scan, Lamination, Internet, Passport Photo |
| **Retail / General Store** | 🛒 | Product Sale, Home Delivery, Gift Wrapping, Bulk Discount |
| **Medical / Clinic** | 🏥 | Consultation, Blood Test, X-Ray, Medicine, ECG |

---

## ✨ Features

### 🔐 Authentication
- Admin registration with name, email, password
- Secure login with **bcrypt** password hashing
- JWT sessions via **NextAuth.js**
- Route protection via middleware
- Each admin's data is completely **isolated** from other admins (multi-tenant)

### 🧙 Business Setup Wizard
- 3-step setup after first registration
- Step 1 → Business name, owner name, phone
- Step 2 → Choose business type (Cyber / Retail / Medical)
- Step 3 → Configure service prices (pre-filled with smart defaults)
- Auto-redirects to setup if not completed

### 👥 Customer Management
- Add, edit, and delete customers
- Search by name or phone (debounced — does not spam the server)
- Walk-in customer system for quick one-time services
- Export customers as CSV (opens in Excel directly)

### ⚡ Service Logging
- Add services for any customer with quantity and auto-calculated price
- Walk-in customer button for quick service entry
- Status tracking: `pending` → `in-progress` → `completed`
- Filter by status, date range, or customer name
- Edit and delete unbilled services
- Billed services are locked to prevent breaking bill totals
- Export services as CSV

### 🧾 Billing System
- **Double-billing protection** — only unbilled services appear in billing
- **Auto-completes services** when a bill is generated
- **Auto invoice numbering** — INV-2025-0001, INV-2025-0002, ...
- **GST support** — toggle on/off with editable rate, shows subtotal + GST + total
- **PDF invoice download** — professional format with business info and service breakdown
- **WhatsApp sharing** — opens WhatsApp with bill message pre-filled (free, no API needed)
- **Copy bill text** — paste into SMS, email, or anywhere
- **Payment tracking** — mark bills as paid with Cash / UPI / Card
- **Change calculator** — enter cash received, shows change to return
- Export bills as CSV

### 📊 Dashboard
- Today's earnings, pending count, new customers, services count
- **Overdue alert** — red banner when any service is pending for more than 24 hours
- Weekly earnings bar chart (last 7 days)
- Service breakdown pie chart
- All-time totals (customers, bills, total revenue)
- Quick action buttons

### ⚙️ Settings
- Edit business info directly (name, owner, phone, type)
- Manage service prices — add, edit, delete
- Changes reflect instantly in the services dropdown

### 🛠️ Tools Page *(Built for Cyber Cafe Owners)*

A dedicated page that replaces 4 different external tools:

| Tool | What it does |
|---|---|
| 🪪 **Aadhaar Combiner** | Upload front + back photos → combines into one A4 page → download or print |
| 🖼️ **Passport Photo Maker** | Upload one photo → auto-crops to 35×45mm → arranges 16 copies on A4 |
| 🖨️ **Print Cost Calculator** | Enter pages + type (B&W / Color / Scan / Lamination) → instant cost shown |
| 🔗 **Gov. Portal Quick Links** | One-click access to 12 government portals (Aadhaar, PAN, Passport, DL, IRCTC, etc.) |

---

## 🧰 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) + React 19 | Full-stack framework, server and client together |
| **Styling** | Tailwind CSS v4 | Fast, utility-first styling |
| **Backend** | Next.js API Routes | No separate backend server needed |
| **Database** | MySQL 8 | Reliable relational database |
| **ORM** | Prisma v5 | Type-safe DB queries, easy migrations |
| **Auth** | NextAuth.js v4 | Secure JWT sessions |
| **PDF** | @react-pdf/renderer | Professional PDF invoice generation |
| **Charts** | Recharts | Bar and Pie charts on the dashboard |
| **Image Processing** | HTML5 Canvas API | Aadhaar combining and passport photo arrangement (no library needed) |

---

## 🗄️ Database Schema
Admin           → stores admin accounts (email + bcrypt hashed password)
BusinessConfig  → business info + service prices (JSON) per admin
Customer        → customer list per admin (with soft-delete support)
Service         → each job done for a customer (linked to bill when billed)
Bill            → invoice record with GST, payment status, invoice number.


**Key design decisions:**
- Every table has `adminId` → complete data isolation between admins (multi-tenant)
- `Service.billId` is `null` when unbilled, set to bill ID after billing → prevents double billing
- `Bill.invoiceNo` is auto-generated as `INV-YYYY-XXXX`
- Cascade deletes → removing a customer also removes their services and bills

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or above
- MySQL 8 running locally
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Gagan144-blip/BizFlow.git
cd BizFlow
2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/bizflow"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

> 💡 Generate a strong secret key: `openssl rand -base64 32`

### 4. Create the database

```bash
sudo systemctl start mysql
sudo mysql -e "CREATE DATABASE IF NOT EXISTS bizflow;"
```

### 5. Push schema to database

```bash
npx prisma db push
npx prisma generate
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. First time setup
1. Click **Create Account** and register as admin
2. You will be redirected to the **Setup Wizard**
3. Enter your business name, owner name, and phone number
4. Select your business type
5. Set your service prices
6. Done — the dashboard opens automatically ✅

---

## 📁 Project Structure

```
bizflow/
├── prisma/
│   └── schema.prisma              ← Database models
├── src/
│   ├── app/
│   │   ├── page.js                ← Landing page
│   │   ├── layout.js              ← Root layout (Sidebar + Navbar)
│   │   ├── login/                 ← Login page
│   │   ├── register/              ← Registration page
│   │   ├── setup/                 ← 3-step business setup wizard
│   │   ├── dashboard/             ← Dashboard with charts and alerts
│   │   ├── customers/             ← Customer management
│   │   ├── services/              ← Service logger and status tracker
│   │   ├── billing/               ← Billing, GST, PDF, payment tracking
│   │   ├── settings/              ← Business info and price manager
│   │   ├── tools/                 ← Aadhaar combiner, passport photos, calculator
│   │   └── api/
│   │       ├── auth/              ← NextAuth handler
│   │       ├── register/          ← Admin registration
│   │       ├── setup/             ← Business config
│   │       ├── customers/         ← Customers CRUD
│   │       ├── services/          ← Services CRUD
│   │       ├── bills/             ← Bills and payment marking
│   │       ├── dashboard/         ← Dashboard stats and overdue alerts
│   │       └── export/            ← CSV export
│   ├── components/
│   │   ├── Sidebar.js             ← Left navigation
│   │   ├── Navbar.js              ← Top bar
│   │   ├── BillPDF.js             ← PDF invoice template
│   │   └── SessionWrapper.js      ← NextAuth provider
│   ├── lib/
│   │   ├── prisma.js              ← Prisma client singleton
│   │   └── auth.js                ← NextAuth configuration
│   └── middleware.js              ← Route protection
└── .env.example                   ← Environment variable template
```

---

## 🔌 API Reference

| Method | Endpoint | What it does |
|---|---|---|
| `POST` | `/api/register` | Create a new admin account |
| `GET / POST` | `/api/setup` | Get or save business configuration |
| `GET / POST` | `/api/customers` | List all or add a customer |
| `PUT / DELETE` | `/api/customers/[id]` | Edit or delete a customer |
| `GET / POST / PATCH / DELETE` | `/api/services` | Full service management |
| `GET / POST / PATCH` | `/api/bills` | List bills, generate bill, mark as paid |
| `GET` | `/api/dashboard` | Dashboard stats and overdue services |
| `GET` | `/api/export?type=customers` | Download customers as CSV |
| `GET` | `/api/export?type=services` | Download services as CSV |
| `GET` | `/api/export?type=bills` | Download bills as CSV |

---

## 🔐 Security

- Passwords hashed with **bcrypt** — never stored in plain text
- All API routes verify `adminId` from session — users cannot access another admin's data
- JWT sessions via NextAuth — stateless and secure
- Unauthenticated users are redirected to login by middleware
- Billed services are locked — cannot be edited or deleted after billing
- `.env` file is in `.gitignore` — your secrets are never pushed to GitHub

---

## 📦 Useful Commands

```bash
# Development
npm run dev                  # Start dev server at http://localhost:3000
npm run build                # Build for production
npm start                    # Start production server

# Database
npx prisma db push           # Push schema changes to MySQL
npx prisma generate          # Regenerate Prisma client
npx prisma studio            # Open visual database browser

# MySQL
sudo systemctl start mysql   # Start MySQL service
sudo systemctl stop mysql    # Stop MySQL service
```

> ⚠️ After any change to `prisma/schema.prisma`, always run:
> ```bash
> npx prisma db push && npx prisma generate
> ```
> Then **restart the dev server** so it loads the new Prisma client.

---

## 🗺️ Roadmap

- [ ] Daily email digest — auto-email owner every morning with yesterday's stats
- [ ] Recurring services — auto-create weekly or monthly services
- [ ] Customer Aadhaar profile — save Aadhaar number, DOB, father's name for auto-filling govt forms
- [ ] Document storage — attach scanned Aadhaar or PAN to a customer profile
- [ ] Monthly revenue report — month-wise earnings chart and downloadable PDF
- [ ] Bulk service update — select multiple services and change status at once
- [ ] Thermal receipt print — 58mm or 80mm receipt for thermal printers
- [ ] OCR Aadhaar scan — scan Aadhaar card and auto-extract customer details
- [ ] Browser push notifications — alert when a service is pending too long
- [ ] AI query — ask "how much did I earn this week?" in plain text

---

## 🙋 How to Explain This in an Interview

> *"I built BizFlow after talking to a real cyber cafe owner who was wasting hours every day on manual work — billing customers one by one, combining Aadhaar card photos in Paint, arranging passport photos using separate software, and constantly searching for government portal URLs.*
>
> *BizFlow is a full-stack web app that automates all of this. It supports 3 business types — cyber cafes, retail stores, and medical clinics. Each admin registers, sets up their business, and gets a fully customized system with customer management, service tracking, auto-billing with GST, PDF invoices, payment tracking, and a dedicated Tools page built specifically for cyber cafe workflows.*
>
> *The system prevents double billing by tracking which services are billed, auto-generates invoice numbers, auto-completes services when billed, and shows an alert when any work is overdue for more than 24 hours. The Tools page handles Aadhaar card combining, passport photo arrangement, and print cost calculation — all in the browser with no external software.*
>
> *Built with Next.js 16, MySQL, Prisma ORM, NextAuth, and Tailwind CSS. Multi-tenant design means every admin's data is completely isolated."*

---

## 👨‍💻 Author

**Gagan** — Built step by step, learning every concept along the way.

GitHub: [@Gagan144-blip](https://github.com/Gagan144-blip)

---

<div align="center">

**⭐ If this project helped you, please give it a star on GitHub!**

*Built with ❤️ to solve real problems for real business owners*

</div>
```
---END---
