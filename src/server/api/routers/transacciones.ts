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
          fechaDesde: z.date().optional(),
          fechaHasta: z.date().optional(),
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
          fecha: {
            gte: input?.fechaDesde,
            lte: input?.fechaHasta,
          },
        },
        include: {
          categoria: true,
          cuenta: true,
          tarjeta: true,
          adeudo: true,
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
        adeudo: z
          .object({
            nombrePersona: z.string().min(1),
            monto: z.number().positive(),
            tipo: z.enum(["POR_COBRAR", "POR_PAGAR"]),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { adeudo, tipo, ...transaccionData } = input;

      const montoReal =
        adeudo && tipo === "GASTO" ? input.monto - adeudo.monto : input.monto;

      return ctx.db.$transaction(async (tx) => {
        const transaccion = await tx.transaccion.create({
          data: {
            ...transaccionData,
            monto: montoReal,
            categoriaId: transaccionData.categoriaId ?? "",
            userId: ctx.session.user.id,
            ...(adeudo
              ? {
                  adeudo: {
                    create: adeudo,
                  },
                }
              : {}),
          },
          include: { adeudo: true },
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

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaccion.delete({
        where: { id: input.id, userId: ctx.session.user.id },
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
