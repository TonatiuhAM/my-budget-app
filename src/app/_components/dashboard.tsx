"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { formatMXN } from "@/lib/format";
import { GaugeChart } from "./gauge-chart";
import { ExpandableCard, DetailTable } from "./expandable-card";
import { Modal } from "./modal";
import { TransactionForm } from "./transaction-form";
import { AccountForm } from "./account-form";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface DashboardProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function Dashboard({ user }: DashboardProps) {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const { data: saldos } = api.dashboard.getSaldos.useQuery();
  const { data: tarjetas } = api.tarjetas.getResumenCredito.useQuery();
  const { data: adeudos } = api.adeudos.getResumen.useQuery();
  const { data: adeudosDetalle } = api.adeudos.getAll.useQuery();
  const { data: comprasMSI } = api.comprasMSI.getResumen.useQuery();
  const { data: inversionesDesactualizadas } =
    api.cuentas.getInversionesDesactualizadas.useQuery();
  const { data: cuentas } = api.cuentas.getAll.useQuery();
  const { data: suscripciones } = api.transacciones.getSuscripciones.useQuery();

  if (
    !saldos ||
    !tarjetas ||
    !adeudos ||
    !adeudosDetalle ||
    !comprasMSI ||
    !inversionesDesactualizadas ||
    !cuentas ||
    !suscripciones
  ) {
    return null;
  }

  const inversiones = cuentas.filter((c) => c.tipo === "INVERSION");

  return (
    <div className="min-h-screen bg-gray-950 pb-24 font-sans text-gray-100">
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-white">Mi Presupuesto</h1>
          <Link
            href="/transacciones"
            className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
          >
            Historial
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {user.name ?? user.email}
          </span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="text-sm text-gray-500 transition-colors hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {inversionesDesactualizadas.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-500">
            <span className="text-xl">⚠</span>
            <p className="font-medium">
              {inversionesDesactualizadas.length} cajita(s) sin actualizar hace
              más de 7 días
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ExpandableCard
            className="lg:col-span-2"
            hasData={saldos.cuentas.length > 0}
            detailContent={
              <DetailTable
                headers={["Cuenta", "Tipo", "Saldo"]}
                rows={saldos.cuentas.map((cuenta) => [
                  <span key="nombre" className="font-medium text-white">
                    {cuenta.nombre}
                  </span>,
                  <span
                    key="tipo"
                    className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
                  >
                    {cuenta.tipo}
                  </span>,
                  <span
                    key="saldo"
                    className={`font-medium ${cuenta.saldo >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {formatMXN(cuenta.saldo)}
                  </span>,
                ])}
                emptyMessage="Sin cuentas registradas"
              />
            }
          >
            <div>
              <h2 className="mb-2 text-sm font-medium tracking-wider text-gray-400 uppercase">
                Saldo Total
              </h2>
              {saldos.cuentas.length === 0 ? (
                <p className="text-2xl font-bold text-white sm:text-3xl">
                  $0.00
                </p>
              ) : (
                <p className="text-2xl font-bold text-white sm:text-3xl">
                  {formatMXN(saldos.saldoDebitoEfectivo)}
                </p>
              )}
            </div>
            {saldos.cuentas.length > 0 && (
              <div className="mt-4 space-y-2">
                {saldos.cuentas.map((cuenta) => (
                  <div
                    key={cuenta.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-400">{cuenta.nombre}</span>
                    <span className="font-medium">
                      {formatMXN(cuenta.saldo)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ExpandableCard>

          <ExpandableCard
            hasData={inversiones.length > 0}
            detailContent={
              <DetailTable
                headers={["Cajita", "Saldo", "Actualizado"]}
                rows={inversiones.map((inv) => [
                  <span key="nombre" className="font-medium text-white">
                    {inv.nombre}
                  </span>,
                  <span key="saldo" className="font-medium text-indigo-400">
                    {formatMXN(Number(inv.saldo))}
                  </span>,
                  <span key="fecha" className="text-xs text-gray-500">
                    {new Date(inv.ultimaActualizacion).toLocaleDateString(
                      "es-MX",
                      { day: "numeric", month: "short" },
                    )}
                  </span>,
                ])}
                emptyMessage="Sin inversiones registradas"
              />
            }
          >
            <div className="flex items-start justify-between">
              <h2 className="mb-2 text-sm font-medium tracking-wider text-gray-400 uppercase">
                Inversiones / Cajitas
              </h2>
              {inversionesDesactualizadas.length > 0 && (
                <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-sm font-medium text-amber-500">
                  ⚠ {inversionesDesactualizadas.length}
                </span>
              )}
            </div>
            <p className="mt-auto text-2xl font-bold text-white sm:text-3xl">
              {formatMXN(saldos.saldoInversiones)}
            </p>
          </ExpandableCard>

          {tarjetas.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-900 p-4 sm:p-5">
              <p className="font-medium text-gray-500">
                Sin tarjetas de crédito
              </p>
            </div>
          ) : (
            tarjetas.slice(0, 3).map((tarjeta) => (
              <div
                key={tarjeta.id}
                className="flex flex-col rounded-xl border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-700 sm:p-5"
              >
                <h2
                  className="mb-4 truncate text-sm font-medium tracking-wider text-gray-400 uppercase"
                  title={tarjeta.nombre}
                >
                  {tarjeta.nombre}
                </h2>
                <div className="mb-4 flex justify-center">
                  <GaugeChart percentage={tarjeta.porcentajeUsado} />
                </div>
                <div className="mt-auto space-y-1">
                  <p className="flex justify-between text-sm text-gray-300">
                    <span>Usado:</span>
                    <span className="font-medium">
                      {formatMXN(tarjeta.totalUsado)} /{" "}
                      {formatMXN(tarjeta.limite)}
                    </span>
                  </p>
                  <p className="flex justify-between text-sm text-gray-300">
                    <span>Disponible:</span>
                    <span className="font-medium text-green-400">
                      {formatMXN(tarjeta.disponible)}
                    </span>
                  </p>
                  {tarjeta.mensualidadMSI > 0 && (
                    <p className="flex justify-between text-sm text-gray-300">
                      <span>MSI:</span>
                      <span className="font-medium text-indigo-400">
                        {formatMXN(tarjeta.mensualidadMSI)}/mes
                      </span>
                    </p>
                  )}
                  <div className="mt-3 border-t border-gray-800 pt-3 text-center text-xs text-gray-500">
                    Corte: día {tarjeta.diaCorte} | Pago: día {tarjeta.diaPago}
                  </div>
                </div>
              </div>
            ))
          )}

          <ExpandableCard
            hasData={adeudosDetalle.length > 0}
            detailContent={
              <DetailTable
                headers={["Persona", "Tipo", "Monto"]}
                rows={adeudosDetalle.map((adeudo) => [
                  <span key="nombre" className="font-medium text-white">
                    {adeudo.nombrePersona}
                  </span>,
                  <span
                    key="tipo"
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      adeudo.tipo === "POR_COBRAR"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {adeudo.tipo === "POR_COBRAR" ? "Me debe" : "Le debo"}
                  </span>,
                  <span
                    key="monto"
                    className={`font-medium ${adeudo.tipo === "POR_COBRAR" ? "text-green-400" : "text-red-400"}`}
                  >
                    {formatMXN(Number(adeudo.monto))}
                  </span>,
                ])}
                emptyMessage="Sin adeudos activos"
              />
            }
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-sm font-medium tracking-wider text-gray-400 uppercase">
                Adeudos
              </h2>
              <span className="rounded-md bg-gray-800 px-2 py-1 text-xs font-medium text-gray-300">
                {adeudos.total} activos
              </span>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-800/50 bg-gray-950/50 p-3">
                <p className="mb-1 text-xs text-gray-500">Me deben</p>
                <p className="text-lg font-bold text-green-500">
                  {formatMXN(adeudos.porCobrar)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-800/50 bg-gray-950/50 p-3">
                <p className="mb-1 text-xs text-gray-500">Debo</p>
                <p className="text-lg font-bold text-red-500">
                  {formatMXN(adeudos.porPagar)}
                </p>
              </div>
            </div>
          </ExpandableCard>

          <ExpandableCard
            hasData={comprasMSI.compras.length > 0}
            detailContent={
              <DetailTable
                headers={["Descripción", "Mensualidad", "Restante", "Tarjeta"]}
                rows={comprasMSI.compras.map((compra) => {
                  const mensualidad =
                    Number(compra.montoTotal) / compra.mesesTotales;
                  const deudaRestante = mensualidad * compra.mesesRestantes;
                  return [
                    <span key="desc" className="font-medium text-white">
                      {compra.descripcion}
                    </span>,
                    <span key="mens" className="text-indigo-400">
                      {formatMXN(mensualidad)}
                    </span>,
                    <span key="rest" className="text-gray-400">
                      {formatMXN(deudaRestante)}{" "}
                      <span className="text-xs text-gray-500">
                        ({compra.mesesRestantes}/{compra.mesesTotales})
                      </span>
                    </span>,
                    <span key="tarj" className="truncate text-xs text-gray-500">
                      {compra.tarjeta.nombre}
                    </span>,
                  ];
                })}
                emptyMessage="Sin compras MSI activas"
              />
            }
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-sm font-medium tracking-wider text-gray-400 uppercase">
                Compras MSI
              </h2>
              <span className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400">
                {comprasMSI.totalComprasActivas} activas
              </span>
            </div>
            <div className="mt-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Mensualidad:</span>
                <span className="text-lg font-bold text-white">
                  {formatMXN(comprasMSI.totalMensualidad)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Deuda restante:</span>
                <span className="text-sm font-medium text-gray-300">
                  {formatMXN(comprasMSI.totalDeudaPendiente)}
                </span>
              </div>
            </div>
          </ExpandableCard>

          <ExpandableCard
            hasData={suscripciones.length > 0}
            detailContent={
              <DetailTable
                headers={["Servicio", "Estado", "Monto"]}
                rows={suscripciones.map((sub) => [
                  <span key="cat" className="font-medium text-white">
                    {sub.categoria?.nombre ?? "Sin categoría"}
                  </span>,
                  <span
                    key="estado"
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      sub.estaActiva
                        ? "bg-green-500/10 text-green-400"
                        : "bg-gray-500/10 text-gray-400"
                    }`}
                  >
                    {sub.estaActiva ? "Activa" : "Pausada"}
                  </span>,
                  <span
                    key="monto"
                    className={`font-medium ${sub.estaActiva ? "text-white" : "text-gray-500"}`}
                  >
                    {formatMXN(Number(sub.monto))}
                  </span>,
                ])}
                emptyMessage="Sin suscripciones"
              />
            }
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-sm font-medium tracking-wider text-gray-400 uppercase">
                Suscripciones
              </h2>
              <span className="rounded-md bg-gray-800 px-2 py-1 text-xs font-medium text-gray-300">
                {suscripciones.filter((s) => s.estaActiva).length} activas
              </span>
            </div>

            {suscripciones.length === 0 ? (
              <p className="mt-auto py-4 text-center text-sm text-gray-500">
                Sin suscripciones activas
              </p>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-2xl font-bold text-white">
                    {formatMXN(
                      suscripciones
                        .filter((s) => s.estaActiva)
                        .reduce((acc, s) => acc + Number(s.monto), 0),
                    )}
                    <span className="ml-1 text-sm font-normal text-gray-500">
                      /mes
                    </span>
                  </p>
                </div>
                <div className="mt-auto space-y-2">
                  {suscripciones
                    .filter((s) => s.estaActiva)
                    .slice(0, 4)
                    .map((sub, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate pr-2 text-gray-300">
                          {sub.categoria?.nombre ?? "Sin categoría"}
                        </span>
                        <span className="font-medium whitespace-nowrap text-gray-400">
                          {formatMXN(Number(sub.monto))}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </ExpandableCard>
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent px-4 pt-10 pb-6 sm:px-6">
        <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-3">
          <button
            type="button"
            onClick={() => setAccountModalOpen(true)}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-gray-700/50 bg-gray-800/90 px-5 text-sm font-medium text-gray-200 shadow-lg backdrop-blur transition-all hover:bg-gray-700 active:scale-95"
          >
            <span className="text-xl">🏦</span>
            <span className="hidden sm:inline">Cuenta</span>
          </button>
          <button
            type="button"
            onClick={() => setTransactionModalOpen(true)}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-base font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 active:scale-95"
          >
            <span className="text-xl">💸</span>
            Nueva Transacción
          </button>
        </div>
      </div>

      <Modal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        title="Nueva Transacción"
      >
        <TransactionForm
          onSuccess={() => setTransactionModalOpen(false)}
          onCancel={() => setTransactionModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        title="Nueva Cuenta"
      >
        <AccountForm
          onSuccess={() => setAccountModalOpen(false)}
          onCancel={() => setAccountModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
