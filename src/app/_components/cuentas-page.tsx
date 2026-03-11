"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { formatMXN } from "@/lib/format";
import { Modal } from "./modal";
import { AccountForm } from "./account-form";

export function CuentasPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: cuentas, isLoading: isLoadingCuentas } =
    api.cuentas.getAll.useQuery();
  const { data: tarjetas, isLoading: isLoadingTarjetas } =
    api.tarjetas.getResumenCredito.useQuery();

  const isLoading = isLoadingCuentas || isLoadingTarjetas;

  return (
    <div className="min-h-screen bg-gray-950 pb-24 font-sans text-gray-100">
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white">Cuentas</h1>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-indigo-500 active:bg-indigo-700"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Crear nueva cuenta
        </button>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cuentas?.map((cuenta) => (
              <div
                key={cuenta.id}
                className="flex flex-col justify-between rounded-xl border border-gray-800 bg-gray-900 p-5 transition-colors hover:border-gray-700 hover:bg-gray-800/50"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="font-semibold text-white">
                      {cuenta.nombre}
                    </h3>
                    <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300">
                      {cuenta.tipo === "DEBITO"
                        ? "Débito"
                        : cuenta.tipo === "EFECTIVO"
                          ? "Efectivo"
                          : "Inversión"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-2xl font-bold text-white">
                      {formatMXN(Number(cuenta.saldo))}
                    </p>
                  </div>
                </div>
                {cuenta.tipo === "INVERSION" && cuenta.ultimaActualizacion && (
                  <div className="mt-4 border-t border-gray-800 pt-4">
                    <p className="text-xs text-gray-500">
                      Última actualización:{" "}
                      {new Date(cuenta.ultimaActualizacion).toLocaleDateString(
                        "es-MX",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {tarjetas?.map((tarjeta) => (
              <div
                key={tarjeta.id}
                className="flex flex-col justify-between rounded-xl border border-gray-800 bg-gray-900 p-5 transition-colors hover:border-gray-700 hover:bg-gray-800/50"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="font-semibold text-white">
                      {tarjeta.nombre}
                    </h3>
                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400">
                      Crédito
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Límite</span>
                      <span className="font-medium text-white">
                        {formatMXN(Number(tarjeta.limite))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Usado</span>
                      <span className="font-medium text-red-400">
                        {formatMXN(Number(tarjeta.totalUsado))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Disponible</span>
                      <span className="font-medium text-green-400">
                        {formatMXN(Number(tarjeta.disponible))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-800 pt-4">
                  <p className="text-xs text-gray-500">
                    Corte: día {tarjeta.diaCorte} | Pago: día {tarjeta.diaPago}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Crear Nueva Cuenta"
      >
        <AccountForm
          onSuccess={() => setCreateModalOpen(false)}
          onCancel={() => setCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
