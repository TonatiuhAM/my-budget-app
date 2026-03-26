# My Budget App

![Next.js](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.6-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

**Aplicación web para la gestión de finanzas personales**

Una herramienta moderna y elegante diseñada para el control integral de tus finanzas: cuentas bancarias, tarjetas de crédito, inversiones, adeudos y suscripciones — todo en un solo lugar.

---

## Tabla de Contenidos

- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Scripts Disponibles](#scripts-disponibles)
- [Flujo de Desarrollo](#flujo-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Testing](#testing)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

---

## Características Principales

### Dashboard Inteligente

- **Tarjetas expandibles** con información detallada de cada módulo
- **Visualización de saldo total** consolidado de todas tus cuentas
- **Gráficas de gauge** para monitoreo de límites de crédito
- Diseño **Mobile-First** optimizado para uso diario

### Gestión de Cuentas

- Soporte para múltiples tipos: **Débito, Efectivo, Inversión y Crédito**
- Campos dinámicos según el tipo de cuenta
- Configuración de tasas de rendimiento para inversiones
- Límites de crédito y fechas de corte para tarjetas

### Registro de Transacciones

- Toggle intuitivo entre **Gastos e Ingresos**
- **Descripción libre**: Escribe de qué fue el gasto sin categorías predefinidas
- Selección de cuenta origen/destino
- **Compras MSI**: Divide automáticamente compras a meses sin intereses según fechas de corte
- **Múltiples deudores**: Registra gastos compartidos con varias personas a la vez
- Actualización automática de saldos
- **Barra de acceso rápido**: Botones siempre visibles para registro inmediato

### Módulos Adicionales

- **Adeudos**: Control de deudas (me deben / debo) con soporte para múltiples personas por transacción
- **Compras MSI**: Gestión de compras a meses sin intereses con cálculo automático de mensualidades
- **Suscripciones**: Seguimiento de pagos recurrentes
- **Transacciones**: Vista agrupada por fecha con filtros avanzados (cuentas, tipo, periodos de facturación)

---

## Stack Tecnológico

Este proyecto está construido con el [T3 Stack](https://create.t3.gg/), una arquitectura moderna y type-safe:

| Tecnología                               | Versión  | Propósito                                  |
| ---------------------------------------- | -------- | ------------------------------------------ |
| [Next.js](https://nextjs.org)            | 15.2.3   | Framework React con App Router y Turbopack |
| [React](https://react.dev)               | 19.0     | Biblioteca de UI con Server Components     |
| [tRPC](https://trpc.io)                  | 11.0     | API end-to-end type-safe                   |
| [Prisma](https://prisma.io)              | 6.6.0    | ORM con migraciones automáticas            |
| [NextAuth.js](https://next-auth.js.org)  | 5.0-beta | Autenticación segura con credentials       |
| [Tailwind CSS](https://tailwindcss.com)  | 4.0      | Estilos utilitarios                        |
| [PostgreSQL](https://postgresql.org)     | 14+      | Base de datos relacional                   |
| [TypeScript](https://typescriptlang.org) | 5.8      | Tipado estático                            |
| [Zod](https://zod.dev)                   | 3.24     | Validación de esquemas                     |

---

## Arquitectura del Proyecto

La aplicación sigue una arquitectura de capas basada en el T3 Stack:

```
┌─────────────────────────────────────────────────────────────┐
│                     Cliente (Browser)                       │
│                   React + Tailwind CSS                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Next.js App Router                       │
│              Server Components + Client Components          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                         tRPC                                │
│               Type-safe API Layer (routers)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Prisma ORM                               │
│              Database Access + Migrations                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     PostgreSQL                              │
│                 Relational Database                         │
└─────────────────────────────────────────────────────────────┘
```

### Modelo de Datos

- **User**: Usuarios con autenticación por credenciales
- **Cuenta**: Cuentas financieras (débito, efectivo, inversión)
- **TarjetaCredito**: Tarjetas con límites y fechas de corte
- **Transaccion**: Gastos e ingresos con soporte para MSI
- **Adeudo**: Deudas por cobrar/pagar con múltiples personas
- **CompraMSI**: Compras a meses sin intereses

---

## Requisitos Previos

- **Node.js** 18.x o superior
- **pnpm** 10.x (recomendado) o npm
- **PostgreSQL** 14.x o superior
- **Docker** (opcional, para despliegue containerizado)

---

## Instalación

### Opción 1: Desarrollo Local

1. **Clonar el repositorio**

   ```bash
   git clone git@github.com:TonatiuhAM/my-budget-app.git
   cd my-budget-app
   ```

2. **Instalar dependencias**

   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   ```

   Editar `.env` con tus credenciales:

   ```env
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/my_budget_app"
   AUTH_SECRET="tu-secreto-seguro-de-32-caracteres"
   ```

4. **Ejecutar migraciones y seed**

   ```bash
   pnpm db:push
   pnpm prisma db seed  # Crea usuario: admin@budget.local / admin123
   ```

5. **Iniciar servidor de desarrollo**

   ```bash
   pnpm dev
   ```

   La aplicación estará disponible en `http://localhost:3000`

### Opción 2: Docker (Producción)

1. **Clonar y configurar**

   ```bash
   git clone git@github.com:TonatiuhAM/my-budget-app.git
   cd my-budget-app
   cp .env.example .env
   ```

2. **Construir y ejecutar**

   ```bash
   docker compose up -d --build
   ```

   La aplicación estará disponible en `http://localhost:3000`

---

## Estructura del Proyecto

```
my-budget-app/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   ├── migrations/            # Historial de migraciones SQL
│   └── seed.ts                # Datos iniciales (usuario de prueba)
├── src/
│   ├── app/
│   │   ├── _components/       # Componentes React compartidos
│   │   │   ├── dashboard.tsx      # Dashboard principal
│   │   │   ├── account-form.tsx   # Formulario de cuentas
│   │   │   ├── transaction-form.tsx # Formulario de transacciones
│   │   │   ├── cuentas-page.tsx   # Página de cuentas
│   │   │   ├── deudas-page.tsx    # Página de adeudos
│   │   │   ├── transacciones-page.tsx # Página de transacciones
│   │   │   ├── expandable-card.tsx # Tarjeta expandible
│   │   │   ├── gauge-chart.tsx    # Gráfica de gauge
│   │   │   └── modal.tsx          # Modal reutilizable
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ # Endpoints NextAuth
│   │   │   └── trpc/[trpc]/       # Handler tRPC
│   │   ├── auth/signin/           # Página de login
│   │   ├── cuentas/               # Ruta de cuentas
│   │   ├── deudas/                # Ruta de adeudos
│   │   ├── transacciones/         # Ruta de transacciones
│   │   ├── layout.tsx             # Layout raíz
│   │   └── page.tsx               # Página principal (Dashboard)
│   ├── lib/
│   │   └── format.ts              # Utilidades de formato (moneda, fechas)
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/           # Routers tRPC
│   │   │   │   ├── adeudos.ts         # CRUD adeudos
│   │   │   │   ├── compras-msi.ts     # CRUD compras MSI
│   │   │   │   ├── cuentas.ts         # CRUD cuentas
│   │   │   │   ├── dashboard.ts       # Datos del dashboard
│   │   │   │   ├── tarjetas.ts        # CRUD tarjetas
│   │   │   │   └── transacciones.ts   # CRUD transacciones
│   │   │   ├── root.ts            # Router raíz tRPC
│   │   │   └── trpc.ts            # Configuración tRPC
│   │   ├── auth/
│   │   │   ├── config.ts          # Configuración NextAuth
│   │   │   └── index.ts           # Exports de auth
│   │   └── db.ts                  # Cliente Prisma
│   ├── styles/
│   │   └── globals.css            # Estilos globales Tailwind
│   ├── trpc/
│   │   ├── query-client.ts        # Cliente React Query
│   │   ├── react.tsx              # Provider tRPC/React
│   │   └── server.ts              # Cliente tRPC servidor
│   └── env.js                     # Validación de env con Zod
├── public/
│   └── favicon.ico                # Favicon
├── docker-compose.yml             # Configuración Docker Compose
├── Dockerfile                     # Imagen de producción
├── eslint.config.js               # Configuración ESLint
├── postcss.config.js              # Configuración PostCSS
├── prettier.config.js             # Configuración Prettier
├── tsconfig.json                  # Configuración TypeScript
└── next.config.js                 # Configuración Next.js
```

---

## Scripts Disponibles

| Comando             | Descripción                                    |
| ------------------- | ---------------------------------------------- |
| `pnpm dev`          | Inicia el servidor de desarrollo con Turbopack |
| `pnpm build`        | Compila la aplicación para producción          |
| `pnpm start`        | Inicia el servidor de producción               |
| `pnpm preview`      | Build + start en un solo comando               |
| `pnpm check`        | Ejecuta lint + typecheck                       |
| `pnpm lint`         | Ejecuta ESLint                                 |
| `pnpm lint:fix`     | Corrige errores de lint automáticamente        |
| `pnpm typecheck`    | Verifica tipos TypeScript                      |
| `pnpm format:check` | Verifica formato con Prettier                  |
| `pnpm format:write` | Formatea archivos con Prettier                 |
| `pnpm db:push`      | Sincroniza el esquema con la base de datos     |
| `pnpm db:generate`  | Crea una nueva migración                       |
| `pnpm db:migrate`   | Ejecuta migraciones pendientes                 |
| `pnpm db:studio`    | Abre Prisma Studio para gestión visual         |

---

## Flujo de Desarrollo

### Branching Strategy

Se recomienda seguir Git Flow simplificado:

1. `main` - Rama de producción estable
2. `feature/*` - Nuevas funcionalidades
3. `fix/*` - Corrección de bugs
4. `refactor/*` - Refactorizaciones

### Workflow

1. Crear rama desde `main`:

   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. Desarrollar y verificar:

   ```bash
   pnpm check  # lint + typecheck
   ```

3. Commit con mensaje descriptivo:

   ```bash
   git commit -m "feat: agregar filtro de transacciones por fecha"
   ```

4. Abrir Pull Request hacia `main`

---

## Estándares de Código

### TypeScript

- Tipado estricto habilitado (`strict: true`)
- Sin uso de `any` - usar tipos específicos o `unknown`
- Interfaces para props de componentes
- Zod para validación de datos externos

### React

- Componentes funcionales con hooks
- Server Components por defecto (Next.js App Router)
- `"use client"` solo cuando sea necesario
- Nombres PascalCase para componentes

### Convenciones de Nombres

- **Archivos**: kebab-case (`transaction-form.tsx`)
- **Componentes**: PascalCase (`TransactionForm`)
- **Variables/Funciones**: camelCase (`handleSubmit`)
- **Constantes**: SCREAMING_SNAKE_CASE (`MAX_ITEMS`)
- **Modelos Prisma**: PascalCase (`TarjetaCredito`)

### Formateo

- Prettier configurado con plugin Tailwind
- Indentación: 2 espacios
- Comillas dobles
- Punto y coma al final

---

## Testing

_Sección en desarrollo - Se planea implementar:_

- **Unit Tests**: Vitest para lógica de negocio
- **Integration Tests**: Testing Library para componentes
- **E2E Tests**: Playwright para flujos críticos

---

## Configuración Regional

La aplicación está configurada para México:

- **Moneda**: MXN (Peso Mexicano)
- **Zona Horaria**: America/Mexico_City
- **Formato de números**: Separador de miles con coma

---

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. **Fork** el repositorio
2. **Crea** una rama para tu feature:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. **Verifica** el código antes del commit:
   ```bash
   pnpm check
   ```
4. **Realiza** commits descriptivos siguiendo [Conventional Commits](https://conventionalcommits.org):
   - `feat:` nueva funcionalidad
   - `fix:` corrección de bug
   - `refactor:` refactorización
   - `docs:` documentación
   - `style:` cambios de formato
   - `test:` tests
5. **Abre** un Pull Request con descripción detallada

### Guía de Código

- Revisa los componentes existentes en `src/app/_components/` como ejemplos
- Sigue los patrones establecidos en los routers tRPC
- Usa las utilidades de formato de `src/lib/format.ts`

---

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## Autor

Desarrollado por [TonatiuhAM](https://github.com/TonatiuhAM)

---

<p align="center">
  <strong>My Budget App</strong> — Control total de tus finanzas personales
</p>
