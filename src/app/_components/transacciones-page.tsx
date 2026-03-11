"use client";

import { useState, useMemo } from "react";
import { api } from "@/trpc/react";
import { formatMXN } from "@/lib/format";
import { Modal } from "./modal";
import Link from "next/link";

type TipoFiltro = "TODOS" | "GASTO" | "INGRESO" | "ADEUDO" | "MSI";

interface TransactionFilters {
  tipo: TipoFiltro;
  cuentaIds: string[];
  categoriaIds: string[];
  fechaDesde: string;
  fechaHasta: string;
}

function Badge({
  variant,
  children,
}: {
  variant: "ingreso" | "gasto" | "msi" | "adeudo" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    ingreso: "bg-green-500/10 text-green-400 border-green-500/20",
    gasto: "bg-red-500/10 text-red-400 border-red-500/20",
    msi: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    adeudo: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    neutral: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function FilterMultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { id: string; nombre: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white hover:border-gray-700"
      >
        <span>
          {selected.length === 0
            ? label
            : `${selected.length} seleccionado${selected.length > 1 ? "s" : ""}`}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-800 bg-gray-900 py-1 shadow-lg">
          {options.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-800"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.id)}
                onChange={() => toggleOption(opt.id)}
                className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-indigo-500"
              />
              <span className="text-sm text-gray-300">{opt.nombre}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function TransaccionesPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    tipo: "TODOS",
    cuentaIds: [],
    categoriaIds: [],
    fechaDesde: "",
    fechaHasta: "",
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTransaccion, setSelectedTransaccion] = useState<string | null>(
    null,
  );
  const [editMonto, setEditMonto] = useState("");
  const [editCategoriaId, setEditCategoriaId] = useState("");

  const { data: categorias } = api.categorias.getAll.useQuery();
  const { data: cuentas } = api.cuentas.getAll.useQuery();
  const { data: tarjetas } = api.tarjetas.getAll.useQuery();

  const utils = api.useUtils();

  const queryInput = useMemo(() => {
    const input: {
      tipo?: "GASTO" | "INGRESO";
      soloAdeudos?: boolean;
      soloMSI?: boolean;
      cuentaId?: string;
      categoriaId?: string;
      fechaDesde?: Date;
      fechaHasta?: Date;
    } = {};

    if (filters.tipo === "GASTO") input.tipo = "GASTO";
    if (filters.tipo === "INGRESO") input.tipo = "INGRESO";
    if (filters.tipo === "ADEUDO") input.soloAdeudos = true;
    if (filters.tipo === "MSI") input.soloMSI = true;

    if (filters.cuentaIds.length === 1) input.cuentaId = filters.cuentaIds[0];

    if (filters.categoriaIds.length === 1)
      input.categoriaId = filters.categoriaIds[0];

    if (filters.fechaDesde) input.fechaDesde = new Date(filters.fechaDesde);
    if (filters.fechaHasta) {
      const fecha = new Date(filters.fechaHasta);
      fecha.setHours(23, 59, 59, 999);
      input.fechaHasta = fecha;
    }

    return input;
  }, [filters]);

  const { data: transaccionesData, isLoading } =
    api.transacciones.getAll.useQuery(queryInput);

  const deleteMutation = api.transacciones.delete.useMutation({
    onSuccess: () => {
      void utils.transacciones.getAll.invalidate();
      void utils.dashboard.getSaldos.invalidate();
      void utils.cuentas.getAll.invalidate();
      setDeleteModalOpen(false);
      setSelectedTransaccion(null);
    },
  });

  const updateMutation = api.transacciones.update.useMutation({
    onSuccess: () => {
      void utils.transacciones.getAll.invalidate();
      void utils.dashboard.getSaldos.invalidate();
      setEditModalOpen(false);
      setSelectedTransaccion(null);
    },
  });

  const filteredTransacciones = useMemo(() => {
    if (!transaccionesData?.items) return [];

    return transaccionesData.items.filter((t) => {
      if (
        filters.cuentaIds.length > 1 &&
        t.cuentaId &&
        !filters.cuentaIds.includes(t.cuentaId)
      ) {
        return false;
      }
      if (
        filters.categoriaIds.length > 1 &&
        t.categoriaId &&
        !filters.categoriaIds.includes(t.categoriaId)
      ) {
        return false;
      }
      return true;
    });
  }, [transaccionesData, filters.cuentaIds, filters.categoriaIds]);

  const handleEdit = (id: string) => {
    const transaccion = transaccionesData?.items.find((t) => t.id === id);
    if (transaccion) {
      setSelectedTransaccion(id);
      setEditMonto(String(transaccion.monto));
      setEditCategoriaId(transaccion.categoriaId ?? "");
      setEditModalOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    setSelectedTransaccion(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTransaccion) {
      deleteMutation.mutate({ id: selectedTransaccion });
    }
  };

  const confirmEdit = () => {
    if (selectedTransaccion) {
      updateMutation.mutate({
        id: selectedTransaccion,
        monto: parseFloat(editMonto) || undefined,
        categoriaId: editCategoriaId || undefined,
      });
    }
  };

  const resetFilters = () => {
    setFilters({
      tipo: "TODOS",
      cuentaIds: [],
      categoriaIds: [],
      fechaDesde: "",
      fechaHasta: "",
    });
  };

  const hasActiveFilters =
    filters.tipo !== "TODOS" ||
    filters.cuentaIds.length > 0 ||
    filters.categoriaIds.length > 0 ||
    filters.fechaDesde ||
    filters.fechaHasta;

  const allCuentas = [
    ...(cuentas?.map((c) => ({
      id: c.id,
      nombre: `${c.nombre} (${c.tipo})`,
    })) ?? []),
    ...(tarjetas?.map((t) => ({ id: t.id, nombre: `${t.nombre} (TDC)` })) ??
      []),
  ];

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
          <h1 className="text-lg font-bold text-white">Historial</h1>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Filter Bar */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-400">Filtros</h2>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Tipo filter */}
            <div>
              <label className="mb-1 block text-xs text-gray-500">Tipo</label>
              <select
                value={filters.tipo}
                onChange={(e) =>
                  setFilters({ ...filters, tipo: e.target.value as TipoFiltro })
                }
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="TODOS">Todos</option>
                <option value="GASTO">Gastos</option>
                <option value="INGRESO">Ingresos</option>
                <option value="ADEUDO">Adeudos</option>
                <option value="MSI">Compras MSI</option>
              </select>
            </div>

            {/* Cuentas filter */}
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                Cuentas
              </label>
              <FilterMultiSelect
                label="Todas las cuentas"
                options={allCuentas}
                selected={filters.cuentaIds}
                onChange={(ids) => setFilters({ ...filters, cuentaIds: ids })}
              />
            </div>

            {/* Categorías filter */}
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                Categorías
              </label>
              <FilterMultiSelect
                label="Todas las categorías"
                options={categorias ?? []}
                selected={filters.categoriaIds}
                onChange={(ids) =>
                  setFilters({ ...filters, categoriaIds: ids })
                }
              />
            </div>

            {/* Date range */}
            <div>
              <label className="mb-1 block text-xs text-gray-500">Desde</label>
              <input
                type="date"
                value={filters.fechaDesde}
                onChange={(e) =>
                  setFilters({ ...filters, fechaDesde: e.target.value })
                }
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">Hasta</label>
              <input
                type="date"
                value={filters.fechaHasta}
                onChange={(e) =>
                  setFilters({ ...filters, fechaHasta: e.target.value })
                }
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : filteredTransacciones.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-gray-500">
              <svg
                className="mb-4 h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p>No hay transacciones</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="border-b border-gray-800 bg-gray-950/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Categoría
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Cuenta
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredTransacciones.map((transaccion) => {
                      const isMSI = !!transaccion.compraMSI;
                      const hasAdeudos =
                        transaccion.adeudos && transaccion.adeudos.length > 0;
                      const origen =
                        transaccion.cuenta?.nombre ??
                        transaccion.tarjeta?.nombre ??
                        "-";

                      return (
                        <tr
                          key={transaccion.id}
                          className="transition-colors hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-300">
                            {new Date(transaccion.fecha).toLocaleDateString(
                              "es-MX",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-white">
                            {transaccion.categoria?.nombre ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {origen}
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-sm font-medium whitespace-nowrap ${
                              transaccion.tipo === "INGRESO"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {transaccion.tipo === "INGRESO" ? "+" : "-"}
                            {formatMXN(Number(transaccion.monto))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Badge
                                variant={
                                  transaccion.tipo === "INGRESO"
                                    ? "ingreso"
                                    : "gasto"
                                }
                              >
                                {transaccion.tipo === "INGRESO"
                                  ? "Ingreso"
                                  : "Gasto"}
                              </Badge>
                              {isMSI && transaccion.compraMSI && (
                                <Badge variant="msi">
                                  MSI {transaccion.pagoNumero}/
                                  {transaccion.compraMSI.mesesTotales}
                                </Badge>
                              )}
                              {hasAdeudos && (
                                <Badge variant="adeudo">
                                  {transaccion.adeudos.length} adeudo
                                  {transaccion.adeudos.length > 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(transaccion.id)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
                                title="Editar"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(transaccion.id)}
                                className="rounded p-1 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                                title="Eliminar"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-gray-800 md:hidden">
                {filteredTransacciones.map((transaccion) => {
                  const isMSI = !!transaccion.compraMSI;
                  const hasAdeudos =
                    transaccion.adeudos && transaccion.adeudos.length > 0;
                  const origen =
                    transaccion.cuenta?.nombre ??
                    transaccion.tarjeta?.nombre ??
                    "-";

                  return (
                    <div key={transaccion.id} className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">
                            {transaccion.categoria?.nombre ?? "Ingreso"}
                          </p>
                          <p className="text-sm text-gray-500">{origen}</p>
                        </div>
                        <p
                          className={`font-semibold ${
                            transaccion.tipo === "INGRESO"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {transaccion.tipo === "INGRESO" ? "+" : "-"}
                          {formatMXN(Number(transaccion.monto))}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant={
                              transaccion.tipo === "INGRESO"
                                ? "ingreso"
                                : "gasto"
                            }
                          >
                            {transaccion.tipo === "INGRESO"
                              ? "Ingreso"
                              : "Gasto"}
                          </Badge>
                          {isMSI && transaccion.compraMSI && (
                            <Badge variant="msi">
                              MSI {transaccion.pagoNumero}/
                              {transaccion.compraMSI.mesesTotales}
                            </Badge>
                          )}
                          {hasAdeudos && (
                            <Badge variant="adeudo">
                              {transaccion.adeudos.length} adeudo
                              {transaccion.adeudos.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(transaccion.fecha).toLocaleDateString(
                              "es-MX",
                              { day: "numeric", month: "short" },
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEdit(transaccion.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(transaccion.id)}
                            className="rounded p-1 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        {filteredTransacciones.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-sm text-gray-500">Total Ingresos</p>
              <p className="text-xl font-bold text-green-400">
                {formatMXN(
                  filteredTransacciones
                    .filter((t) => t.tipo === "INGRESO")
                    .reduce((sum, t) => sum + Number(t.monto), 0),
                )}
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-sm text-gray-500">Total Gastos</p>
              <p className="text-xl font-bold text-red-400">
                {formatMXN(
                  filteredTransacciones
                    .filter((t) => t.tipo === "GASTO")
                    .reduce((sum, t) => sum + Number(t.monto), 0),
                )}
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-sm text-gray-500">Balance</p>
              <p
                className={`text-xl font-bold ${
                  filteredTransacciones.reduce(
                    (sum, t) =>
                      sum +
                      (t.tipo === "INGRESO"
                        ? Number(t.monto)
                        : -Number(t.monto)),
                    0,
                  ) >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {formatMXN(
                  filteredTransacciones.reduce(
                    (sum, t) =>
                      sum +
                      (t.tipo === "INGRESO"
                        ? Number(t.monto)
                        : -Number(t.monto)),
                    0,
                  ),
                )}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTransaccion(null);
        }}
        title="Editar Transacción"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Monto</label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={editMonto}
                onChange={(e) =>
                  setEditMonto(e.target.value.replace(/[^0-9.]/g, ""))
                }
                className="w-full rounded-lg border border-gray-800 bg-gray-950 py-3 pr-4 pl-8 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">
              Categoría
            </label>
            <select
              value={editCategoriaId}
              onChange={(e) => setEditCategoriaId(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
            >
              {categorias?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false);
                setSelectedTransaccion(null);
              }}
              className="flex-1 rounded-lg border border-gray-700 py-3 font-medium text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmEdit}
              disabled={updateMutation.isPending}
              className="flex-1 rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedTransaccion(null);
        }}
        title="Eliminar Transacción"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            ¿Estás seguro de que deseas eliminar esta transacción? Esta acción
            no se puede deshacer.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedTransaccion(null);
              }}
              className="flex-1 rounded-lg border border-gray-700 py-3 font-medium text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-lg bg-red-600 py-3 font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
