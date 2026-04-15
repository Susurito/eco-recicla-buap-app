# Eco-Recicla BUAP App

Sistema de gestión de reciclaje inteligente para la BUAP con autenticación, seguimiento de puntos y gestión de premios.

## 🚀 Quick Start

### Requisitos Previos
- Node.js 20+ (recomendado v24.13.0)
- PostgreSQL 12+
- pnpm (o npm/yarn)

### Instalación Inicial (Primera Vez)

Sigue estos pasos en orden para iniciar el proyecto correctamente:

```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd eco-recicla-buap-app

# 2. Instalar dependencias
pnpm install

# 3. Crear archivo .env (si no existe)
# Copia el contenido a continuación a un archivo .env en la raíz del proyecto
# NEXTAUTH_SECRET=<tu-secret>
# BETTER_AUTH_SECRET=<tu-secret>
# DATABASE_URL=postgres://usuario:contraseña@localhost:5432/eco-db

# 4. Configurar variables de entorno
# Si no tienes NEXTAUTH_SECRET generado, ejecuta:
npx auth secret

# 5. Sincronizar base de datos con Prisma
npx prisma db push

# 6. (Opcional) Generar cliente Prisma si necesario
npx prisma generate

# 7. Iniciar servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📋 Comandos Disponibles

```bash
# Desarrollo
pnpm dev          # Inicia servidor en http://localhost:3000

# Producción
pnpm build        # Compilar proyecto
pnpm start        # Iniciar servidor en producción

# Base de datos (Prisma)
npx prisma db push              # Sincronizar schema con BD
npx prisma migrate dev          # Crear nueva migración
npx prisma generate            # Regenerar cliente Prisma
npx prisma studio              # Abrir Prisma Studio (GUI)
npx prisma db seed             # Ejecutar seed (si existe)

# Calidad de código
pnpm lint         # Ejecutar ESLint
```

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas
```
eco-recicla-buap-app/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   └── page.tsx        # Home page
├── components/         # Componentes React
├── lib/                # Utilidades
│   └── prisma.ts      # Cliente Prisma singleton
├── prisma/
│   ├── schema.prisma  # Esquema de BD
│   └── migrations/    # Historial de migraciones
├── auth.ts            # Configuración NextAuth.js
└── README.md          # Este archivo
```

### Stack Tecnológico
- **Frontend**: Next.js 16.1.6, React 19.2.4, TypeScript
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js v5
- **UI**: Radix UI + Tailwind CSS
- **Mapas**: Leaflet
- **Formularios**: React Hook Form

---

## 🔐 Configuración de Autenticación

### Variables de Entorno Requeridas

```env
# Generado con: npx auth secret
NEXTAUTH_SECRET=tu_secret_aleatorio_aqui

# (Opcional) Para BetterAuth
BETTER_AUTH_SECRET=tu_secret_aqui

# Base de datos
DATABASE_URL=postgres://user:password@localhost:5432/eco-db
```

### Agregar Providers (Google, GitHub, etc.)

Edita `auth.ts` y agrega tus providers:

```typescript
import GoogleProvider from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
})
```

---

## 🗄️ Base de Datos

### Modelos Principales

- **User**: Usuarios del sistema
- **Account**: Cuentas OAuth/autenticación
- **Session**: Sesiones activas
- **Student**: Información de estudiantes (boleta, puntos, etc.)
- **TrashPoint**: Puntos de recolección inteligentes
- **Prize**: Premios disponibles
- **PolygonArea**: Áreas geográficas (mapas)

### Comandos Prisma Útiles

```bash
# Abrir GUI para ver/editar datos
npx prisma studio

# Ver estado actual
npx prisma db push --skip-generate

# Crear migración manual (sin cambios auto)
npx prisma migrate dev --name descripcion_cambio
```

---

## 🐛 Troubleshooting

### Error: "MissingSecret: Please define a `secret`"
- Asegúrate de tener `NEXTAUTH_SECRET` en `.env`
- Generalo con: `npx auth secret`
- Reinicia el servidor de desarrollo

### Error: "Cannot find module '@prisma/client'"
```bash
# Regenera el cliente Prisma
npx prisma generate
```

### Puerto 3000 en uso
```bash
# El servidor usará automáticamente otro puerto
# O matar el proceso anterior:
pkill -f "next dev"
```

### Problemas de conexión a BD
```bash
# Verifica la URL en .env:
DATABASE_URL=postgres://user:password@localhost:5432/db_name

# Prueba la conexión:
npx prisma db push
```

---

## 📚 Documentación Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [NextAuth.js Documentation](https://authjs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs/primitives/overview/introduction)

---

## 🔄 Cambios Recientes

### v0.2.0 - Reconfiguración de Prisma y Auth.js

**Cambios Implementados:**
- ✅ Eliminada configuración incorrecta de Prisma v7
- ✅ Downgradeado a Prisma v6.19.3 (compatible con Auth.js)
- ✅ Importaciones Prisma corregidas (`@prisma/client`)
- ✅ Configuración NextAuth.js con secret
- ✅ Migraciones de autenticación sincronizadas

**Archivos Modificados:**
- `lib/prisma.ts` - Importación correcta de PrismaClient
- `auth.ts` - Configuración completa de NextAuth.js
- `prisma/schema.prisma` - Generator y datasource estándar
- `.env` - Variables de entorno actualizadas

**Eliminados:**
- `prisma.config.ts` (no necesario en v6)
- `app/generated/prisma/` (salida personalizada innecesaria)

---

## 📝 Variables de Entorno Ejemplo

```env
# .env.local
NEXTAUTH_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BETTER_AUTH_SECRET=abc123def456...
DATABASE_URL=postgres://postgres:postgres@localhost:5432/eco-db

# Opcional - para providers OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

---

## 🎯 Próximos Pasos

- [ ] Agregar providers OAuth (Google, GitHub)
- [ ] Implementar autorización con roles
- [ ] Crear seeders para datos iniciales
- [ ] Agregar tests unitarios
- [ ] Configurar CI/CD

---

Este proyecto fue bootstrapped con [v0.app](https://v0.app) y ha sido reconfigurado para producción.
