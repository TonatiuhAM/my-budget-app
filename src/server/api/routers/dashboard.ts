import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TipoCuenta } from "../../../../generated/prisma";

export const dashboardRouter = createTRPCRouter({
  getSaldos: protectedProcedure.query(async ({ ctx }) => {
    const cuentas = await ctx.db.cuenta.findMany({
      where: { userId: ctx.session.user.id },
    });

    const saldoDebitoEfectivo = cuentas
      .filter(
        (c) => c.tipo === TipoCuenta.DEBITO || c.tipo === TipoCuenta.EFECTIVO,
      )
      .reduce((sum, c) => sum + Number(c.saldo), 0);

    const saldoInversiones = cuentas
      .filter((c) => c.tipo === TipoCuenta.INVERSION)
      .reduce((sum, c) => sum + Number(c.saldo), 0);

    return {
      saldoDebitoEfectivo,
      saldoInversiones,
      cuentas: cuentas.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        tipo: c.tipo,
        saldo: Number(c.saldo),
      })),
    };
  }),
});
