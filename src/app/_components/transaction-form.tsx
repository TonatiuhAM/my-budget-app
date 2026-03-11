"use client";

import { useState, useCallback } from "react";
import { api } from "@/trpc/react";
import { formatMXN } from "@/lib/format";

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type TipoTransaccion = "GASTO" | "INGRESO";
type TipoAdeudo = "POR_COBRAR" | "POR_PAGAR";

const MSI_OPTIONS = [3, 6, 9, 12, 18, 24] as const;

export function TransactionForm({ onSuccess, onCancel }: TransactionFormProps) {
  const [tipo, setTipo] = useState<TipoTransaccion>("GASTO");
  const [monto, setMonto] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [origenId, setOrigenId] = useState("");
  const [origenTipo, setOrigenTipo] = useState<"cuenta" | "tarjeta">("cuenta");

  const [tieneAdeudos, setTieneAdeudos] = useState(false);
  const [adeudos, setAdeudos] = useState<
    Array<{
      id: string;
      nombrePersona: string;
      monto: string;
      tipo: TipoAdeudo;
    }>
  >([]);

  const [esMSI, setEsMSI] = useState(false);
  const [mesesMSI, setMesesMSI] = useState<number>(6);
  const [descripcionMSI, setDescripcionMSI] = useState("");

  const [esRecurrente, setEsRecurrente] = useState(false);

  const utils = api.useUtils();
  const { data: categorias } = api.categorias.getAll.useQuery();
  const { data: cuentas } = api.cuentas.getAll.useQuery();
  const { data: tarjetas } = api.tarjetas.getAll.useQuery();

  const resetForm = useCallback(() => {
    setTipo("GASTO");
    setMonto("");
    setCategoriaId("");
    setOrigenId("");
    setOrigenTipo("cuenta");
    setTieneAdeudos(false);
    setAdeudos([]);
    setEsMSI(false);
    setMesesMSI(6);
    setDescripcionMSI("");
    setEsRecurrente(false);
  }, []);

  const createMutation = api.transacciones.create.useMutation({
    onSuccess: () => {
      void utils.dashboard.getSaldos.invalidate();
      void utils.cuentas.getAll.invalidate();
      void utils.tarjetas.getResumenCredito.invalidate();
      void utils.adeudos.getResumen.invalidate();
      void utils.adeudos.getAll.invalidate();
      void utils.transacciones.getSuscripciones.invalidate();
      void utils.comprasMSI.getResumen.invalidate();
      void utils.comprasMSI.getAll.invalidate();
      resetForm();
      onSuccess?.();
    },
  });

  const montoNumerico = parseFloat(monto.replace(/[^0-9.]/g, "")) || 0;

  const totalAdeudos = adeudos.reduce((sum, a) => {
    const monto = parseFloat(a.monto.replace(/[^0-9.]/g, "")) || 0;
    return sum + monto;
  }, 0);

  const mensualidadMSI =
    esMSI && montoNumerico > 0 ? montoNumerico / mesesMSI : 0;

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

  const addAdeudo = (tipoAdeudo: TipoAdeudo) => {
    const newAdeudo = {
      id: `adeudo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombrePersona: "",
      monto: "",
      tipo: tipoAdeudo,
    };
    setAdeudos((prev) => [...prev, newAdeudo]);
  };

  const removeAdeudo = (id: string) => {
    setAdeudos(adeudos.filter((a) => a.id !== id));
  };

  const updateAdeudo = (
    id: string,
    field: "nombrePersona" | "monto",
    value: string,
  ) => {
    setAdeudos(
      adeudos.map((a) =>
        a.id === id
          ? {
              ...a,
              [field]:
                field === "monto" ? value.replace(/[^0-9.]/g, "") : value,
            }
          : a,
      ),
    );
  };

  const handleOrigenTipoChange = (newTipo: "cuenta" | "tarjeta") => {
    setOrigenTipo(newTipo);
    setOrigenId("");
    if (newTipo !== "tarjeta") {
      setEsMSI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (montoNumerico <= 0) return;
    if (tipo === "GASTO" && !categoriaId) return;
    if (!origenId) return;

    const adeudosToSubmit =
      tieneAdeudos && adeudos.length > 0
        ? adeudos
            .filter((a) => a.nombrePersona && parseFloat(a.monto) > 0)
            .map((a) => ({
              nombrePersona: a.nombrePersona,
              monto: parseFloat(a.monto),
              tipo: a.tipo,
            }))
        : undefined;

    const msi =
      esMSI && origenTipo === "tarjeta"
        ? {
            descripcion:
              descripcionMSI ??
              categorias?.find((c) => c.id === categoriaId)?.nombre ??
              "Compra MSI",
            meses: mesesMSI,
          }
        : undefined;

    createMutation.mutate({
      tipo,
      monto: montoNumerico,
      categoriaId: tipo === "GASTO" ? categoriaId : undefined,
      cuentaId: origenTipo === "cuenta" ? origenId : undefined,
      tarjetaId: origenTipo === "tarjeta" ? origenId : undefined,
      esRecurrente,
      adeudos: adeudosToSubmit,
      msi,
    });
  };

  const adeudosValidos = adeudos.every(
    (a) => a.nombrePersona.trim() && parseFloat(a.monto) > 0,
  );

  const isValid =
    montoNumerico > 0 &&
    origenId &&
    (tipo === "INGRESO" || categoriaId) &&
    (!tieneAdeudos || (adeudos.length > 0 && adeudosValidos)) &&
    (!esMSI || mesesMSI > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo toggle: GASTO / INGRESO */}
      <div className="flex rounded-lg border border-gray-800 bg-gray-950 p-1">
        <button
          type="button"
          onClick={() => {
            setTipo("GASTO");
            setOrigenTipo("cuenta");
            setOrigenId("");
            setEsMSI(false);
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
            setTieneAdeudos(false);
            setAdeudos([]);
            setEsMSI(false);
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

      {/* Monto */}
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

      {/* Categoría (solo para gastos) */}
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

      {/* Origen / Destino */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">
          {tipo === "GASTO" ? "Origen" : "Destino"}
        </label>
        <div className="space-y-3">
          {tipo === "GASTO" && tarjetas && tarjetas.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleOrigenTipoChange("cuenta")}
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
                onClick={() => handleOrigenTipoChange("tarjeta")}
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

      {/* MSI Toggle - Solo visible si es tarjeta de crédito */}
      {tipo === "GASTO" && origenTipo === "tarjeta" && origenId && (
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={esMSI}
              onChange={(e) => setEsMSI(e.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-300">
              Compra a Meses Sin Intereses (MSI)
            </span>
          </label>

          {esMSI && (
            <div className="space-y-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  Número de meses
                </label>
                <div className="flex flex-wrap gap-2">
                  {MSI_OPTIONS.map((meses) => (
                    <button
                      key={meses}
                      type="button"
                      onClick={() => setMesesMSI(meses)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        mesesMSI === meses
                          ? "border-indigo-500 bg-indigo-500/20 text-indigo-400"
                          : "border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {meses}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={descripcionMSI}
                  onChange={(e) => setDescripcionMSI(e.target.value)}
                  placeholder="Ej: Laptop, TV, etc."
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {montoNumerico > 0 && (
                <div className="rounded-lg bg-gray-900/50 p-3">
                  <p className="text-sm text-gray-400">
                    Mensualidad:{" "}
                    <span className="font-bold text-indigo-400">
                      {formatMXN(mensualidadMSI)}
                    </span>
                    <span className="text-gray-500"> × {mesesMSI} meses</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Adeudos - Multiple debtors */}
      {tipo === "GASTO" && (
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={tieneAdeudos}
              onChange={(e) => {
                setTieneAdeudos(e.target.checked);
                if (!e.target.checked) setAdeudos([]);
              }}
              className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-300">Registrar adeudos</span>
          </label>

          {tieneAdeudos && (
            <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addAdeudo("POR_COBRAR")}
                  className="flex-1 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400 transition-colors hover:bg-green-500/20"
                >
                  + Me deben
                </button>
                <button
                  type="button"
                  onClick={() => addAdeudo("POR_PAGAR")}
                  className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
                >
                  + Yo debo
                </button>
              </div>

              {adeudos.map((adeudo) => (
                <div
                  key={adeudo.id}
                  className={`rounded-lg border p-3 ${
                    adeudo.tipo === "POR_COBRAR"
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${
                        adeudo.tipo === "POR_COBRAR"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {adeudo.tipo === "POR_COBRAR" ? "Me debe" : "Yo debo"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAdeudo(adeudo.id)}
                      className="text-gray-500 transition-colors hover:text-red-400"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={adeudo.nombrePersona}
                      onChange={(e) =>
                        updateAdeudo(adeudo.id, "nombrePersona", e.target.value)
                      }
                      placeholder="Nombre de la persona"
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={adeudo.monto}
                        onChange={(e) =>
                          updateAdeudo(adeudo.id, "monto", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-800 bg-gray-950 py-2 pr-3 pl-8 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {adeudos.length === 0 && (
                <p className="text-center text-sm text-gray-500">
                  Agrega personas que te deben o a quienes les debes
                </p>
              )}

              {totalAdeudos > 0 && montoNumerico > 0 && (
                <div className="rounded-lg bg-gray-900/50 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total adeudos:</span>
                    <span className="font-medium text-white">
                      {formatMXN(totalAdeudos)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-gray-400">Tu gasto real:</span>
                    <span className="font-medium text-indigo-400">
                      {formatMXN(Math.max(0, montoNumerico - totalAdeudos))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recurrente */}
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

      {/* Botones */}
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
