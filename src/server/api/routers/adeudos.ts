import { z } from "zod";
import { TipoAdeudo } from "../../../../generated/prisma";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const adeudosRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          soloActivos: z.boolean().default(true),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.adeudo.findMany({
        where: {
          transaccion: { userId: ctx.session.user.id },
          ...(input?.soloActivos !== false ? { estaPagado: false } : {}),
        },
        include: { transaccion: { include: { categoria: true } } },
        orderBy: { transaccion: { fecha: "desc" } },
      });
    }),

  marcarPagado: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adeudo = await ctx.db.adeudo.findFirst({
        where: { id: input.id, transaccion: { userId: ctx.session.user.id } },
      });
      if (!adeudo) throw new Error("Adeudo no encontrado");

      return ctx.db.adeudo.update({
        where: { id: input.id },
        data: { estaPagado: true },
      });
    }),

  getResumen: protectedProcedure.query(async ({ ctx }) => {
    const adeudos = await ctx.db.adeudo.findMany({
      where: {
        transaccion: { userId: ctx.session.user.id },
        estaPagado: false,
      },
    });

    const porCobrar = adeudos
      .filter((a) => a.tipo === TipoAdeudo.POR_COBRAR)
      .reduce((sum, a) => sum + Number(a.monto), 0);

    const porPagar = adeudos
      .filter((a) => a.tipo === TipoAdeudo.POR_PAGAR)
      .reduce((sum, a) => sum + Number(a.monto), 0);

    return { porCobrar, porPagar, total: adeudos.length };
  }),
});
