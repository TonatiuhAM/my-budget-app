"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { formatMXN } from "@/lib/format";

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type TipoTransaccion = "GASTO" | "INGRESO";

export function TransactionForm({ onSuccess, onCancel }: TransactionFormProps) {
  const [tipo, setTipo] = useState<TipoTransaccion>("GASTO");
  const [monto, setMonto] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [origenId, setOrigenId] = useState("");
  const [origenTipo, setOrigenTipo] = useState<"cuenta" | "tarjeta">("cuenta");
  const [tieneAdeudo, setTieneAdeudo] = useState(false);
  const [adeudoNombre, setAdeudoNombre] = useState("");
  const [adeudoMonto, setAdeudoMonto] = useState("");
  const [esRecurrente, setEsRecurrente] = useState(false);

  const utils = api.useUtils();
  const { data: categorias } = api.categorias.getAll.useQuery();
  const { data: cuentas } = api.cuentas.getAll.useQuery();
  const { data: tarjetas } = api.tarjetas.getAll.useQuery();

  const createMutation = api.transacciones.create.useMutation({
    onSuccess: () => {
      void utils.dashboard.getSaldos.invalidate();
      void utils.cuentas.getAll.invalidate();
      void utils.tarjetas.getResumenCredito.invalidate();
      void utils.adeudos.getResumen.invalidate();
      void utils.adeudos.getAll.invalidate();
      void utils.transacciones.getSuscripciones.invalidate();
      onSuccess?.();
    },
  });

  const montoNumerico = parseFloat(monto.replace(/[^0-9.]/g, "")) || 0;
  const adeudoMontoNumerico =
    parseFloat(adeudoMonto.replace(/[^0-9.]/g, "")) || 0;

  const cuentasFiltradas =
    tipo === "INGRESO"
      ? cuentas?.filter((c) =>
          ["DEBITO", "EFECTIVO", "INVERSION"].includes(c.tipo),
        )
      : cuentas?.filter((c) => ["DEBITO", "EFECTIVO"].includes(c.tipo));

  const handleMontoChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    setMonto(numericValue);
  };

  const handleAdeudoMontoChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    setAdeudoMonto(numericValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (montoNumerico <= 0) return;
    if (tipo === "GASTO" && !categoriaId) return;
    if (!origenId) return;

    const adeudo =
      tieneAdeudo && adeudoNombre && adeudoMontoNumerico > 0
        ? {
            nombrePersona: adeudoNombre,
            monto: adeudoMontoNumerico,
            tipo: "POR_COBRAR" as const,
          }
        : undefined;

    createMutation.mutate({
      tipo,
      monto: montoNumerico,
      categoriaId: tipo === "GASTO" ? categoriaId : undefined,
      cuentaId: origenTipo === "cuenta" ? origenId : undefined,
      tarjetaId: origenTipo === "tarjeta" ? origenId : undefined,
      esRecurrente,
      adeudo,
    });
  };

  const isValid =
    montoNumerico > 0 &&
    origenId &&
    (tipo === "INGRESO" || categoriaId) &&
    (!tieneAdeudo || (adeudoNombre && adeudoMontoNumerico > 0));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex rounded-lg border border-gray-800 bg-gray-950 p-1">
        <button
          type="button"
          onClick={() => {
            setTipo("GASTO");
            setOrigenTipo("cuenta");
            setOrigenId("");
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tipo === "GASTO"
              ? "bg-red-500/20 text-red-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => {
            setTipo("INGRESO");
            setTieneAdeudo(false);
            setOrigenTipo("cuenta");
            setOrigenId("");
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tipo === "INGRESO"
              ? "bg-green-500/20 text-green-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Ingreso
        </button>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">
          Monto
        </label>
        <div className="relative">
          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={monto}
            onChange={(e) => handleMontoChange(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-800 bg-gray-950 py-3 pr-4 pl-8 text-lg font-semibold text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        {montoNumerico > 0 && (
          <p className="mt-1 text-right text-sm text-gray-500">
            {formatMXN(montoNumerico)}
          </p>
        )}
      </div>

      {tipo === "GASTO" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-400">
            Categoría
          </label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Seleccionar categoría</option>
            {categorias?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">
          {tipo === "GASTO" ? "Origen" : "Destino"}
        </label>
        <div className="space-y-3">
          {tipo === "GASTO" && tarjetas && tarjetas.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setOrigenTipo("cuenta");
                  setOrigenId("");
                }}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  origenTipo === "cuenta"
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-gray-800 text-gray-400 hover:border-gray-700"
                }`}
              >
                Cuenta
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrigenTipo("tarjeta");
                  setOrigenId("");
                }}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  origenTipo === "tarjeta"
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-gray-800 text-gray-400 hover:border-gray-700"
                }`}
              >
                Tarjeta de Crédito
              </button>
            </div>
          )}

          <select
            value={origenId}
            onChange={(e) => setOrigenId(e.target.value)}
            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">
              Seleccionar {origenTipo === "tarjeta" ? "tarjeta" : "cuenta"}
            </option>
            {origenTipo === "cuenta"
              ? cuentasFiltradas?.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre} ({cuenta.tipo})
                  </option>
                ))
              : tarjetas?.map((tarjeta) => (
                  <option key={tarjeta.id} value={tarjeta.id}>
                    {tarjeta.nombre}
                  </option>
                ))}
          </select>
        </div>
      </div>

      {tipo === "GASTO" && (
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={tieneAdeudo}
              onChange={(e) => setTieneAdeudo(e.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-300">
              Alguien me debe parte de este gasto
            </span>
          </label>

          {tieneAdeudo && (
            <div className="grid gap-3 rounded-lg border border-gray-800 bg-gray-950/50 p-4 transition-all">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Nombre de la persona
                </label>
                <input
                  type="text"
                  value={adeudoNombre}
                  onChange={(e) => setAdeudoNombre(e.target.value)}
                  placeholder="Ej: Juan"
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Monto que me debe
                </label>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={adeudoMonto}
                    onChange={(e) => handleAdeudoMontoChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 py-2 pr-3 pl-8 text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              {adeudoMontoNumerico > 0 && montoNumerico > 0 && (
                <p className="text-sm text-gray-400">
                  Tu gasto real:{" "}
                  <span className="font-medium text-white">
                    {formatMXN(
                      Math.max(0, montoNumerico - adeudoMontoNumerico),
                    )}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={esRecurrente}
          onChange={(e) => setEsRecurrente(e.target.checked)}
          className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-indigo-500 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-300">
          {tipo === "GASTO"
            ? "Es un gasto recurrente (suscripción)"
            : "Es un ingreso recurrente"}
        </span>
      </label>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-700 py-3 font-medium text-gray-300 transition-colors hover:bg-gray-800"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || createMutation.isPending}
          className="flex-1 rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Guardando...
            </span>
          ) : (
            "Guardar"
          )}
        </button>
      </div>
    </form>
  );
}
