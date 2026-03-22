# PIB - Portal Inmobiliario Bahiense

## Requisitos previos
- Node.js v20+ → https://nodejs.org
- Git → https://git-scm.com

---

## Instalación

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Editá el .env con tus credenciales
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

El portal estará en: http://localhost:5173
La API estará en: http://localhost:4000

---

## Variables de entorno (.env)

Completá el archivo `backend/.env` con:
- `DATABASE_URL` → URL de tu base de datos PostgreSQL (Render te la da gratis)
- `CLOUDINARY_*` → Credenciales de tu cuenta en cloudinary.com (gratis)
- `SMTP_*` → Credenciales de email (Gmail con App Password)
- `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` → Strings aleatorios de 32+ caracteres
- `ENCRYPTION_KEY` → String de exactamente 32 caracteres
- `FRONTEND_URL` → http://localhost:5173 en desarrollo

---

## Stack

**Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL  
**Frontend:** React + TypeScript + Vite + Tailwind CSS  
**Imágenes:** Cloudinary  
**Seguridad:** bcrypt, JWT, Helmet, Rate Limiting, Zod, AES-256

---

## Estructura

```
PIBB/
├── backend/
│   ├── src/
│   │   ├── config/        # env, prisma, cloudinary, mailer
│   │   ├── controllers/   # auth, property, admin
│   │   ├── middleware/    # auth, validate, upload
│   │   ├── routes/        # auth, property, agency, particular, admin
│   │   └── utils/         # security (jwt, bcrypt, aes), validators (zod)
│   └── prisma/
│       └── schema.prisma
└── frontend/
    └── src/
        ├── components/ui/ # Navbar, PropertyCard, ImageCarousel, Filters
        ├── context/       # AuthContext
        ├── pages/         # Home, Login, Register, Dashboard, Publish
        ├── services/      # api.ts, property.service.ts
        └── types/         # index.ts
```
