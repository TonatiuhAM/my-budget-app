"use client";

import { api } from "@/trpc/react";
import { formatMXN } from "@/lib/format";
import Link from "next/link";

export function DeudasPage() {
  const utils = api.useUtils();
  const { data: adeudos, isLoading } = api.adeudos.getAll.useQuery({
    soloActivos: false,
  });

  const marcarPagado = api.adeudos.marcarPagado.useMutation({
    onSuccess: () => {
      void utils.adeudos.getAll.invalidate();
      void utils.adeudos.getResumen.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-500" />
      </div>
    );
  }

  const meDeben =
    adeudos?.filter((a) => a.tipo === "POR_COBRAR" && !a.estaPagado) ?? [];
  const lesDebo =
    adeudos?.filter((a) => a.tipo === "POR_PAGAR" && !a.estaPagado) ?? [];
  const historial = adeudos?.filter((a) => a.estaPagado) ?? [];

  const totalMeDeben = meDeben.reduce((sum, a) => sum + Number(a.monto), 0);
  const totalLesDebo = lesDebo.reduce((sum, a) => sum + Number(a.monto), 0);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-24 font-sans text-gray-100">
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white">Deudas</h1>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-sm text-green-400/80">Me deben</p>
            <p className="text-2xl font-bold text-green-400">
              {formatMXN(totalMeDeben)}
            </p>
            <p className="text-xs text-gray-500">{meDeben.length} pendientes</p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400/80">Debo</p>
            <p className="text-2xl font-bold text-red-400">
              {formatMXN(totalLesDebo)}
            </p>
            <p className="text-xs text-gray-500">{lesDebo.length} pendientes</p>
          </div>
        </div>

        {/* Tabla: Me deben (POR_COBRAR) */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wider text-green-400 uppercase">
            <span className="text-lg">💰</span>
            Me deben
          </h2>
          {meDeben.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-6 text-center text-gray-500">
              No tienes deudas por cobrar
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
                      Persona
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-400 uppercase">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-400 uppercase">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {meDeben.map((adeudo) => (
                    <tr
                      key={adeudo.id}
                      className="transition-colors hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">
                          {adeudo.nombrePersona}
                        </p>
                        <p className="text-xs text-gray-500">
                          {adeudo.transaccion.categoria?.nombre ??
                            "Sin categoría"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-green-400">
                          {formatMXN(Number(adeudo.monto))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => marcarPagado.mutate({ id: adeudo.id })}
                          disabled={marcarPagado.isPending}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
                        >
                          {marcarPagado.isPending ? "..." : "Abonado"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Tabla: Les debo (POR_PAGAR) */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wider text-red-400 uppercase">
            <span className="text-lg">💸</span>
            Les debo
          </h2>
          {lesDebo.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-6 text-center text-gray-500">
              No tienes deudas pendientes
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
                      Persona
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-400 uppercase">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-400 uppercase">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {lesDebo.map((adeudo) => (
                    <tr
                      key={adeudo.id}
                      className="transition-colors hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">
                          {adeudo.nombrePersona}
                        </p>
                        <p className="text-xs text-gray-500">
                          {adeudo.transaccion.categoria?.nombre ??
                            "Sin categoría"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-red-400">
                          {formatMXN(Number(adeudo.monto))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => marcarPagado.mutate({ id: adeudo.id })}
                          disabled={marcarPagado.isPending}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                        >
                          {marcarPagado.isPending ? "..." : "Abonado"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Tabla: Historial de deudas pagadas */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wider text-gray-400 uppercase">
            <span className="text-lg">✅</span>
            Historial de pagos
          </h2>
          {historial.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-6 text-center text-gray-500">
              No hay deudas pagadas aún
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
                      Persona
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-400 uppercase">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-400 uppercase">
                      Creada
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-400 uppercase">
                      Pagada
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {historial.map((adeudo) => (
                    <tr
                      key={adeudo.id}
                      className="transition-colors hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-300">
                          {adeudo.nombrePersona}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            adeudo.tipo === "POR_COBRAR"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {adeudo.tipo === "POR_COBRAR"
                            ? "Me debía"
                            : "Le debía"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-medium ${
                            adeudo.tipo === "POR_COBRAR"
                              ? "text-green-400/70"
                              : "text-red-400/70"
                          }`}
                        >
                          {formatMXN(Number(adeudo.monto))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        {formatDate(adeudo.fechaCreacion)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        {adeudo.fechaPago ? formatDate(adeudo.fechaPago) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
