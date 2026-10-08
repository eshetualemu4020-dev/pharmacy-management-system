# 💊 Pharmacy Management System

A comprehensive, full-stack Pharmacy Drug Inventory and Management System designed to streamline pharmacy operations. It provides dedicated portals for **Administrators**, **Pharmacists**, and **Customers**, ensuring a seamless experience from inventory management to prescription processing and customer orders.

## 🌟 Key Features

### 👨‍💼 Admin Portal (RxAdmin)
- **Dashboard & Analytics:** Real-time insights into sales, orders, and inventory metrics.
- **User Management:** Create and manage pharmacist accounts and customer data.
- **Inventory Control:** Monitor all drugs, track batches, low stock alerts, and expiring/expired items.
- **Supplier & Purchase Orders:** Manage suppliers and track restock orders.
- **Audit Logs:** Track system activity for security and compliance.

### 👩‍⚕️ Pharmacist Portal
- **Prescription Verification:** Review and approve/reject customer prescription uploads.
- **Dispensary Control:** Manage daily drug dispensing and check for drug interactions.
- **Inventory Alerts:** Actionable notifications for low stock and expiring medicines.
- **Point of Sale (POS):** Process in-store sales efficiently.

### 🛒 Customer Portal
- **Browse & Search:** Explore available drugs by category or search term.
- **Prescription Uploads:** Securely upload prescription images for pharmacist approval.
- **Cart & Checkout:** Seamless shopping cart experience with order tracking.
- **Wishlist:** Save frequently needed medications for later.
- **Responsive Design:** Fully responsive layout with a collapsible sidebar for a great mobile and desktop experience.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [React 18](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State/Data Fetching:** [React Query (@tanstack/react-query)](https://tanstack.com/query/latest) & React Router Dom

### Backend
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (via `pg` pool)
- **Authentication:** JSON Web Tokens (JWT) & bcrypt for password hashing
- **File Uploads:** Multer (for prescription images)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL installed and running

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/pharmacy-management-system.git
cd pharmacy-management-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```
- Create a `.env` file in the `backend` directory with your database credentials:
```env
PORT=8000
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pharmacy_db
JWT_SECRET=your_super_secret_key
```
- Run database migrations/seeds if applicable, then start the server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
- Start the Vite development server:
```bash
npm run dev
```

---

## 🎨 UI / UX Highlights

- **Modern Glassmorphism Design:** Beautiful translucent overlays and subtle borders.
- **Dark/Light Mode:** Full theming support across all dashboards.
- **Collapsible "Mini" Sidebar:** The navigation sidebar neatly collapses to just icons on desktop to maximize screen real-estate.
- **Responsive Overlays:** On mobile, sidebars transition into touch-friendly modal overlays.

---

## 📝 License
This project is licensed under the [MIT License](LICENSE).