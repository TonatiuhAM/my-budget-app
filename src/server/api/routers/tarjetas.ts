import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const tarjetasRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.tarjetaCredito.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { nombre: "asc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tarjetaCredito.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { comprasMSI: true },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        nombre: z.string().min(1).max(50),
        limite: z.number().positive(),
        diaCorte: z.number().int().min(1).max(31),
        diaPago: z.number().int().min(1).max(31),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tarjetaCredito.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nombre: z.string().min(1).max(50).optional(),
        limite: z.number().positive().optional(),
        diaCorte: z.number().int().min(1).max(31).optional(),
        diaPago: z.number().int().min(1).max(31).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.tarjetaCredito.update({
        where: { id, userId: ctx.session.user.id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tarjetaCredito.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  getResumenCredito: protectedProcedure.query(async ({ ctx }) => {
    const tarjetas = await ctx.db.tarjetaCredito.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        transacciones: true,
        comprasMSI: {
          where: { mesesRestantes: { gt: 0 } },
        },
      },
    });

    return tarjetas.map((tarjeta) => {
      const now = new Date();
      const diaCorte = tarjeta.diaCorte;

      const inicioPerido = new Date(
        now.getFullYear(),
        now.getMonth(),
        diaCorte,
      );
      if (now.getDate() <= diaCorte) {
        inicioPerido.setMonth(inicioPerido.getMonth() - 1);
      }

      const gastoPeriodoActual = tarjeta.transacciones
        .filter((t) => t.fecha >= inicioPerido)
        .reduce((sum, t) => sum + Number(t.monto), 0);

      const mensualidadMSI = tarjeta.comprasMSI.reduce((sum, msi) => {
        const mensualidad = Number(msi.montoTotal) / msi.mesesTotales;
        return sum + mensualidad;
      }, 0);

      const totalUsado = gastoPeriodoActual + mensualidadMSI;
      const limite = Number(tarjeta.limite);
      const disponible = limite - totalUsado;
      const porcentajeUsado = limite > 0 ? (totalUsado / limite) * 100 : 0;

      return {
        id: tarjeta.id,
        nombre: tarjeta.nombre,
        limite,
        totalUsado,
        disponible,
        porcentajeUsado: Math.min(porcentajeUsado, 100),
        gastoPeriodoActual,
        mensualidadMSI,
        diaCorte: tarjeta.diaCorte,
        diaPago: tarjeta.diaPago,
      };
    });
  }),
});
