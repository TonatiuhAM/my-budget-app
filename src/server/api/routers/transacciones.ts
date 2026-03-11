import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const transaccionesRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().nullish(),
          categoriaId: z.string().optional(),
          tarjetaId: z.string().optional(),
          cuentaId: z.string().optional(),
          tipo: z.enum(["GASTO", "INGRESO"]).optional(),
          fechaDesde: z.date().optional(),
          fechaHasta: z.date().optional(),
          soloAdeudos: z.boolean().optional(),
          soloMSI: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;

      const items = await ctx.db.transaccion.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          userId: ctx.session.user.id,
          categoriaId: input?.categoriaId,
          tarjetaId: input?.tarjetaId,
          cuentaId: input?.cuentaId,
          tipo: input?.tipo,
          fecha: {
            gte: input?.fechaDesde,
            lte: input?.fechaHasta,
          },
          ...(input?.soloAdeudos ? { adeudos: { some: {} } } : {}),
          ...(input?.soloMSI ? { compraMSIId: { not: null } } : {}),
        },
        include: {
          categoria: true,
          cuenta: true,
          tarjeta: true,
          adeudos: true,
          compraMSI: true,
        },
        orderBy: { fecha: "desc" },
      });

      let nextCursor: string | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return { items, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.transaccion.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { adeudos: true },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        tipo: z.enum(["GASTO", "INGRESO"]),
        monto: z.number().positive(),
        categoriaId: z.string().optional(),
        cuentaId: z.string().optional(),
        tarjetaId: z.string().optional(),
        esRecurrente: z.boolean().default(false),
        fecha: z.date().optional(),
        adeudos: z
          .array(
            z.object({
              nombrePersona: z.string().min(1),
              monto: z.number().positive(),
              tipo: z.enum(["POR_COBRAR", "POR_PAGAR"]),
            }),
          )
          .optional(),
        msi: z
          .object({
            descripcion: z.string().min(1).max(100),
            meses: z.number().int().min(2).max(48),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { adeudos, msi, tipo, ...transaccionData } = input;

      const totalAdeudos =
        adeudos && tipo === "GASTO"
          ? adeudos.reduce((sum, a) => sum + a.monto, 0)
          : 0;
      const montoReal = input.monto - totalAdeudos;

      return ctx.db.$transaction(async (tx) => {
        let compraMSI = null;

        if (msi && input.tarjetaId) {
          compraMSI = await tx.compraMSI.create({
            data: {
              descripcion: msi.descripcion,
              montoTotal: input.monto,
              mesesTotales: msi.meses,
              mesesRestantes: msi.meses,
              tarjetaId: input.tarjetaId,
              userId: ctx.session.user.id,
            },
          });
        }

        const transaccion = await tx.transaccion.create({
          data: {
            ...transaccionData,
            tipo,
            monto: montoReal,
            categoriaId: transaccionData.categoriaId,
            userId: ctx.session.user.id,
            compraMSIId: compraMSI?.id,
            pagoNumero: compraMSI ? 1 : null,
            ...(adeudos && adeudos.length > 0
              ? {
                  adeudos: {
                    create: adeudos,
                  },
                }
              : {}),
          },
          include: { adeudos: true, compraMSI: true },
        });

        if (input.cuentaId) {
          if (tipo === "GASTO") {
            await tx.cuenta.update({
              where: { id: input.cuentaId },
              data: { saldo: { decrement: montoReal } },
            });
          } else {
            await tx.cuenta.update({
              where: { id: input.cuentaId },
              data: { saldo: { increment: input.monto } },
            });
          }
        }

        return transaccion;
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        monto: z.number().positive().optional(),
        categoriaId: z.string().optional(),
        fecha: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.db.transaccion.findFirst({
        where: { id, userId: ctx.session.user.id },
      });
      if (!existing) throw new Error("Transacción no encontrada");

      return ctx.db.$transaction(async (tx) => {
        if (data.monto && existing.cuentaId) {
          const diferencia = data.monto - Number(existing.monto);
          if (existing.tipo === "GASTO") {
            await tx.cuenta.update({
              where: { id: existing.cuentaId },
              data: { saldo: { decrement: diferencia } },
            });
          } else {
            await tx.cuenta.update({
              where: { id: existing.cuentaId },
              data: { saldo: { increment: diferencia } },
            });
          }
        }

        return tx.transaccion.update({
          where: { id },
          data,
          include: {
            categoria: true,
            cuenta: true,
            tarjeta: true,
            adeudos: true,
          },
        });
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const transaccion = await ctx.db.transaccion.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { adeudos: true },
      });
      if (!transaccion) throw new Error("Transacción no encontrada");

      return ctx.db.$transaction(async (tx) => {
        if (transaccion.cuentaId) {
          if (transaccion.tipo === "GASTO") {
            await tx.cuenta.update({
              where: { id: transaccion.cuentaId },
              data: { saldo: { increment: transaccion.monto } },
            });
          } else {
            await tx.cuenta.update({
              where: { id: transaccion.cuentaId },
              data: { saldo: { decrement: transaccion.monto } },
            });
          }
        }

        return tx.transaccion.delete({
          where: { id: input.id },
        });
      });
    }),

  toggleRecurrencia: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const transaccion = await ctx.db.transaccion.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!transaccion) throw new Error("Transacción no encontrada");

      return ctx.db.transaccion.update({
        where: { id: input.id },
        data: { estaActiva: !transaccion.estaActiva },
      });
    }),

  getSuscripciones: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.transaccion.findMany({
      where: {
        userId: ctx.session.user.id,
        esRecurrente: true,
      },
      include: { categoria: true, tarjeta: true, cuenta: true },
      orderBy: { fecha: "desc" },
    });
  }),
});
