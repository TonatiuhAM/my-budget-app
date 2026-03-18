import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

function getBillingPeriod(diaCorte: number): { desde: Date; hasta: Date } {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const beforeCutDate = currentDay <= diaCorte;

  if (beforeCutDate) {
    return {
      desde: new Date(currentYear, currentMonth - 1, diaCorte + 1),
      hasta: new Date(currentYear, currentMonth, diaCorte),
    };
  }

  return {
    desde: new Date(currentYear, currentMonth, diaCorte + 1),
    hasta: new Date(currentYear, currentMonth + 1, diaCorte),
  };
}

export const comprasMSIRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          tarjetaId: z.string().optional(),
          soloActivas: z.boolean().default(true),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.compraMSI.findMany({
        where: {
          userId: ctx.session.user.id,
          tarjetaId: input?.tarjetaId,
          ...(input?.soloActivas !== false
            ? { mesesRestantes: { gt: 0 } }
            : {}),
        },
        include: { tarjeta: true },
        orderBy: { fechaInicio: "desc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        descripcion: z.string().min(1).max(100),
        montoTotal: z.number().positive(),
        mesesTotales: z.number().int().min(2).max(48),
        tarjetaId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.compraMSI.create({
        data: {
          ...input,
          mesesRestantes: input.mesesTotales,
          userId: ctx.session.user.id,
        },
      });
    }),

  adelantarMensualidades: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        cantidad: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const compra = await ctx.db.compraMSI.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!compra) throw new Error("Compra MSI no encontrada");

      const nuevosMesesRestantes = Math.max(
        0,
        compra.mesesRestantes - input.cantidad,
      );

      return ctx.db.compraMSI.update({
        where: { id: input.id },
        data: { mesesRestantes: nuevosMesesRestantes },
      });
    }),

  liquidar: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const compra = await ctx.db.compraMSI.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!compra) throw new Error("Compra MSI no encontrada");

      return ctx.db.compraMSI.update({
        where: { id: input.id },
        data: { mesesRestantes: 0 },
      });
    }),

  getResumen: protectedProcedure.query(async ({ ctx }) => {
    const compras = await ctx.db.compraMSI.findMany({
      where: {
        userId: ctx.session.user.id,
        mesesRestantes: { gt: 0 },
      },
      include: { tarjeta: true },
    });

    const totalMensualidad = compras.reduce((sum, c) => {
      const mensualidad = Number(c.montoTotal) / c.mesesTotales;
      return sum + mensualidad;
    }, 0);

    const totalDeudaPendiente = compras.reduce((sum, c) => {
      const mensualidad = Number(c.montoTotal) / c.mesesTotales;
      return sum + mensualidad * c.mesesRestantes;
    }, 0);

    return {
      totalComprasActivas: compras.length,
      totalMensualidad,
      totalDeudaPendiente,
      compras,
    };
  }),

  generateMonthlyPayments: protectedProcedure
    .input(
      z
        .object({
          tarjetaId: z.string().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const comprasActivas = await ctx.db.compraMSI.findMany({
        where: {
          userId: ctx.session.user.id,
          mesesRestantes: { gt: 0 },
          ...(input?.tarjetaId ? { tarjetaId: input.tarjetaId } : {}),
        },
        include: {
          tarjeta: true,
          transacciones: {
            orderBy: { pagoNumero: "desc" },
            take: 1,
          },
        },
      });

      const transaccionesCreadas: string[] = [];

      for (const compra of comprasActivas) {
        const { desde: periodStart } = getBillingPeriod(
          compra.tarjeta.diaCorte,
        );
        const lastTransaction = compra.transacciones[0];
        const lastPaymentNumber = lastTransaction?.pagoNumero ?? 0;
        const nextPaymentNumber = lastPaymentNumber + 1;

        if (nextPaymentNumber > compra.mesesTotales) {
          continue;
        }

        const lastPaymentDate = lastTransaction?.fecha ?? compra.fechaInicio;
        const shouldGeneratePayment = periodStart > lastPaymentDate;

        if (!shouldGeneratePayment) {
          continue;
        }

        const mensualidad =
          Math.round((Number(compra.montoTotal) / compra.mesesTotales) * 100) /
          100;

        await ctx.db.$transaction(async (tx) => {
          const transaccion = await tx.transaccion.create({
            data: {
              tipo: "GASTO",
              descripcion: `${compra.descripcion} (${nextPaymentNumber}/${compra.mesesTotales})`,
              monto: mensualidad,
              fecha: periodStart,
              tarjetaId: compra.tarjetaId,
              userId: ctx.session.user.id,
              compraMSIId: compra.id,
              pagoNumero: nextPaymentNumber,
            },
          });

          await tx.compraMSI.update({
            where: { id: compra.id },
            data: { mesesRestantes: { decrement: 1 } },
          });

          transaccionesCreadas.push(transaccion.id);
        });
      }

      return {
        transaccionesCreadas: transaccionesCreadas.length,
        ids: transaccionesCreadas,
      };
    }),
});
