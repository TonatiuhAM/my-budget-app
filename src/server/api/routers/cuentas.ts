import { z } from "zod";
import { TipoCuenta } from "../../../../generated/prisma";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const cuentasRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.cuenta.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { nombre: "asc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.cuenta.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        nombre: z.string().min(1).max(50),
        tipo: z.nativeEnum(TipoCuenta),
        saldo: z.number(),
        tasaRendimiento: z.number().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cuenta.create({
        data: {
          nombre: input.nombre,
          tipo: input.tipo,
          saldo: input.saldo,
          tasaRendimiento: input.tasaRendimiento,
          userId: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nombre: z.string().min(1).max(50).optional(),
        saldo: z.number().optional(),
        tasaRendimiento: z.number().min(0).max(100).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.cuenta.update({
        where: { id, userId: ctx.session.user.id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cuenta.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  getInversionesDesactualizadas: protectedProcedure.query(async ({ ctx }) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return ctx.db.cuenta.findMany({
      where: {
        userId: ctx.session.user.id,
        tipo: TipoCuenta.INVERSION,
        ultimaActualizacion: { lt: sevenDaysAgo },
      },
    });
  }),
});
