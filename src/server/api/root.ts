import { categoriasRouter } from "@/server/api/routers/categorias";
import { cuentasRouter } from "@/server/api/routers/cuentas";
import { tarjetasRouter } from "@/server/api/routers/tarjetas";
import { transaccionesRouter } from "@/server/api/routers/transacciones";
import { adeudosRouter } from "@/server/api/routers/adeudos";
import { comprasMSIRouter } from "@/server/api/routers/compras-msi";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  categorias: categoriasRouter,
  cuentas: cuentasRouter,
  tarjetas: tarjetasRouter,
  transacciones: transaccionesRouter,
  adeudos: adeudosRouter,
  comprasMSI: comprasMSIRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
