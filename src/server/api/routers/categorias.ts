import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const categoriasRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.categoria.findMany({
      orderBy: { nombre: "asc" },
    });
  }),

  create: protectedProcedure
    .input(z.object({ nombre: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.categoria.create({
        data: { nombre: input.nombre },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.categoria.delete({
        where: { id: input.id },
      });
    }),
});
