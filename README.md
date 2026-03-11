# My Budget App

**Aplicación web progresiva (PWA) para la gestión de finanzas personales**

Una herramienta moderna y elegante diseñada para el control integral de tus finanzas: cuentas bancarias, tarjetas de crédito, inversiones, adeudos y suscripciones — todo en un solo lugar.

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
- Categorización personalizada de movimientos
- Selección de cuenta origen/destino
- **Compras MSI**: Divide automáticamente compras a meses sin intereses según fechas de corte
- **Múltiples deudores**: Registra gastos compartidos con varias personas a la vez
- Actualización automática de saldos
- **Barra de acceso rápido**: Botones siempre visibles para registro inmediato

### Módulos Adicionales

- **Adeudos**: Control de deudas (me deben / debo) con soporte para múltiples personas por transacción
- **Compras MSI**: Gestión de compras a meses sin intereses con cálculo automático de mensualidades
- **Suscripciones**: Seguimiento de pagos recurrentes
- **Historial**: Vista completa de transacciones con filtros y detalles de adeudos

---

## Stack Tecnológico

Este proyecto está construido con el [T3 Stack](https://create.t3.gg/), una arquitectura moderna y type-safe:

| Tecnología                              | Propósito                       |
| --------------------------------------- | ------------------------------- |
| [Next.js 15](https://nextjs.org)        | Framework React con App Router  |
| [tRPC](https://trpc.io)                 | API end-to-end type-safe        |
| [Prisma](https://prisma.io)             | ORM con migraciones automáticas |
| [NextAuth.js](https://next-auth.js.org) | Autenticación segura            |
| [Tailwind CSS](https://tailwindcss.com) | Estilos utilitarios             |
| [PostgreSQL](https://postgresql.org)    | Base de datos relacional        |

---

## Requisitos Previos

- **Node.js** 18.x o superior
- **pnpm** (recomendado) o npm
- **PostgreSQL** 14.x o superior
- **Docker** (opcional, para despliegue)

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

4. **Ejecutar migraciones**

   ```bash
   pnpm db:push
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

## Scripts Disponibles

| Comando          | Descripción                                |
| ---------------- | ------------------------------------------ |
| `pnpm dev`       | Inicia el servidor de desarrollo           |
| `pnpm build`     | Compila la aplicación para producción      |
| `pnpm start`     | Inicia el servidor de producción           |
| `pnpm db:push`   | Sincroniza el esquema con la base de datos |
| `pnpm db:studio` | Abre Prisma Studio para gestión visual     |
| `pnpm lint`      | Ejecuta el linter                          |
| `pnpm typecheck` | Verifica tipos TypeScript                  |

---

## Estructura del Proyecto

```
my-budget-app/
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   ├── migrations/        # Historial de migraciones
│   └── seed.mjs           # Datos iniciales
├── src/
│   ├── app/
│   │   ├── _components/   # Componentes React
│   │   ├── api/           # Endpoints API
│   │   └── auth/          # Páginas de autenticación
│   ├── lib/               # Utilidades compartidas
│   └── server/
│       ├── api/
│       │   └── routers/   # Routers tRPC
│       └── auth/          # Configuración NextAuth
├── docker-compose.yml     # Configuración Docker
└── Dockerfile             # Imagen de producción
```

---

## Configuración Regional

La aplicación está configurada para México:

- **Moneda**: MXN (Peso Mexicano)
- **Zona Horaria**: America/Mexico_City
- **Formato de números**: Separador de miles con coma

---

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios con commits descriptivos
4. Abre un Pull Request

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
