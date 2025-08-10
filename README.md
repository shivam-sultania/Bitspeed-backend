# Bitespeed Identity Resolution API

This project implements an identity resolution system where user contacts (email and phone numbers) are normalized into a single primary identity with associated secondary identities. It handles merging and linking of contacts intelligently based on matching input data.

### 🌐 Hosted API Endpoint:
> https://bitspeed-backend-yy0t.onrender.com/identify

---

## 🛠 Technologies Used

- **Node.js** with **Express** – Backend server
- **TypeScript** – Type-safe development
- **Prisma ORM** – Database modeling and querying
- **PostgreSQL** – Relational database
- **Render** – Deployment platform
- **Dotenv** – Environment variable management

---

## 📁 Folder Structure

```
├── prisma/
│ └── schema.prisma # Prisma schema and DB model
├── src/
│ ├── routes/
│ │ └── identify.ts # Main API route for /identify
│ └── index.ts # App entry point
├── .env # Environment variables
├── package.json # NPM scripts and dependencies
├── tsconfig.json # TypeScript config
└── README.md # Project documentation
```

---

## ⚙️ Setup Instructions

### 1. **Clone the repository**
```bash
git clone https://github.com/shivam-sultania/Bitspeed-backend
cd Bitspeed-backend
```

### 2. **Install dependencies**
```bash
npm install
```

 ### 3. **Configure environment variables**
```bash
DATABASE_URL=your_postgresql_database_url
```

 ### 4. **Set up the database**
```bash
npx prisma db push
```

 ### 5. **Run the project locally**
```bash
npm run dev
```
### 🚀 It runs locally on: http://localhost:3000/

---

## ✅ API Usage

### **POST**` /identify`

```json
{
  "email": "example@email.com",
  "phoneNumber": "1234567890"
}
```


