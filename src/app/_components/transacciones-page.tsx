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

function groupByDate<T extends { fecha: Date | string }>(transactions: T[]) {
  const groups = new Map<string, T[]>();
  for (const t of transactions) {
    const dateKey = new Date(t.fecha).toISOString().split("T")[0] ?? "";
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(t);
  }
  return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split("T")[0]) return "Hoy";
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Ayer";

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getBillingCycleDates(diaCorte: number): { desde: Date; hasta: Date } {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let hasta: Date;
  let desde: Date;

  if (currentDay <= diaCorte) {
    hasta = new Date(currentYear, currentMonth, diaCorte);
    desde = new Date(currentYear, currentMonth - 1, diaCorte + 1);
  } else {
    hasta = new Date(currentYear, currentMonth + 1, diaCorte);
    desde = new Date(currentYear, currentMonth, diaCorte + 1);
  }

  return { desde, hasta };
}

export function TransaccionesPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    tipo: "TODOS",
    cuentaIds: [],
    categoriaIds: [],
    fechaDesde: "",
    fechaHasta: "",
  });
  const [tempFilters, setTempFilters] = useState<TransactionFilters>(filters);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = (id: string) => {
    const transaccion = transaccionesData?.items.find((t) => t.id === id);
    if (transaccion) {
      setSelectedTransaccion(id);
      setEditMonto(String(transaccion.monto));
      setEditCategoriaId(transaccion.categoriaId ?? "");
      setEditModalOpen(true);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const openFilterModal = () => {
    setTempFilters(filters);
    setFilterModalOpen(true);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setFilterModalOpen(false);
  };

  const cancelFilters = () => {
    setTempFilters(filters);
    setFilterModalOpen(false);
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
    ...(tarjetas?.map((t) => ({
      id: t.id,
      nombre: `${t.nombre} (TDC)`,
      diaCorte: t.diaCorte,
    })) ?? []),
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
          <h1 className="text-lg font-bold text-white">Transacciones</h1>
        </div>
        <button
          onClick={openFilterModal}
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filtros
          {hasActiveFilters && (
            <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
          )}
        </button>
      </nav>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Data Table */}
        <div className="space-y-6">
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
            </div>
          ) : (
            <div className="space-y-6">
              {groupByDate(filteredTransacciones).map(
                ([dateStr, transacciones]) => (
                  <div key={dateStr} className="space-y-2">
                    <h3 className="sticky top-14 z-10 bg-gray-950/90 py-2 text-sm font-medium text-gray-400 backdrop-blur">
                      {formatDateHeader(dateStr)}
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
                      <div className="divide-y divide-gray-800">
                        {transacciones.map((transaccion) => (
                          <div
                            key={transaccion.id}
                            className="flex items-center justify-between p-4 transition-colors hover:bg-gray-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium text-white">
                                  {transaccion.categoria?.nombre ?? "Ingreso"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
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
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </main>

      {/* Filter Modal */}
      <Modal isOpen={filterModalOpen} onClose={cancelFilters} title="Filtros">
        <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
          {/* Transacción */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Tipo de Transacción
            </label>
            <div className="flex gap-2 rounded-lg bg-gray-950 p-1">
              {(["TODOS", "INGRESO", "GASTO"] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setTempFilters({ ...tempFilters, tipo })}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    tempFilters.tipo === tipo
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {tipo === "TODOS"
                    ? "Todos"
                    : tipo === "INGRESO"
                      ? "Ingreso"
                      : "Gasto"}
                </button>
              ))}
            </div>
          </div>

          {/* Cuentas */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Cuentas
            </label>
            <div className="space-y-2">
              {allCuentas.map((cuenta) => (
                <label
                  key={cuenta.id}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={tempFilters.cuentaIds.includes(cuenta.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTempFilters({
                          ...tempFilters,
                          cuentaIds: [...tempFilters.cuentaIds, cuenta.id],
                        });
                      } else {
                        setTempFilters({
                          ...tempFilters,
                          cuentaIds: tempFilters.cuentaIds.filter(
                            (id) => id !== cuenta.id,
                          ),
                        });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-sm text-gray-300">{cuenta.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Categorías */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Categorías
            </label>
            <div className="space-y-2">
              {categorias?.map((cat) => (
                <label
                  key={cat.id}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={tempFilters.categoriaIds.includes(cat.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTempFilters({
                          ...tempFilters,
                          categoriaIds: [...tempFilters.categoriaIds, cat.id],
                        });
                      } else {
                        setTempFilters({
                          ...tempFilters,
                          categoriaIds: tempFilters.categoriaIds.filter(
                            (id) => id !== cat.id,
                          ),
                        });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-sm text-gray-300">{cat.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Fecha
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Desde
                </label>
                <input
                  type="date"
                  value={tempFilters.fechaDesde}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      fechaDesde: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Hasta
                </label>
                <input
                  type="date"
                  value={tempFilters.fechaHasta}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      fechaHasta: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Billing Cycle Shortcuts */}
            {tarjetas && tarjetas.length > 0 && (
              <div className="mt-3 space-y-2">
                <label className="block text-xs text-gray-500">
                  Periodos de facturación
                </label>
                <div className="flex flex-wrap gap-2">
                  {tarjetas.map((tarjeta) => (
                    <button
                      key={tarjeta.id}
                      type="button"
                      onClick={() => {
                        const { desde, hasta } = getBillingCycleDates(
                          tarjeta.diaCorte,
                        );
                        setTempFilters({
                          ...tempFilters,
                          fechaDesde: desde.toISOString().split("T")[0]!,
                          fechaHasta: hasta.toISOString().split("T")[0]!,
                        });
                      }}
                      className="rounded-md border border-gray-800 bg-gray-950 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800"
                    >
                      {tarjeta.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-gray-800 pt-4">
          <button
            type="button"
            onClick={cancelFilters}
            className="flex-1 rounded-lg border border-gray-700 py-2.5 font-medium text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500"
          >
            Aplicar
          </button>
        </div>
      </Modal>

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
