"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { formatMXN } from "@/lib/format";

interface AccountFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type TipoCuenta = "DEBITO" | "EFECTIVO" | "INVERSION" | "CREDITO";

export function AccountForm({ onSuccess, onCancel }: AccountFormProps) {
  const [tipo, setTipo] = useState<TipoCuenta>("DEBITO");
  const [nombre, setNombre] = useState("");
  const [saldo, setSaldo] = useState("");
  const [tasaRendimiento, setTasaRendimiento] = useState("");
  const [limite, setLimite] = useState("");
  const [diaCorte, setDiaCorte] = useState("");
  const [diaPago, setDiaPago] = useState("");

  const utils = api.useUtils();

  const createCuentaMutation = api.cuentas.create.useMutation({
    onSuccess: () => {
      void utils.cuentas.getAll.invalidate();
      void utils.dashboard.getSaldos.invalidate();
      onSuccess?.();
    },
  });

  const createTarjetaMutation = api.tarjetas.create.useMutation({
    onSuccess: () => {
      void utils.tarjetas.getAll.invalidate();
      void utils.tarjetas.getResumenCredito.invalidate();
      onSuccess?.();
    },
  });

  const isPending =
    createCuentaMutation.isPending || createTarjetaMutation.isPending;

  const saldoNumerico = parseFloat(saldo.replace(/[^0-9.-]/g, "")) || 0;
  const limiteNumerico = parseFloat(limite.replace(/[^0-9.]/g, "")) || 0;
  const tasaNumerico = parseFloat(tasaRendimiento.replace(/[^0-9.]/g, "")) || 0;
  const diaCorteNumerico = parseInt(diaCorte, 10) || 0;
  const diaPagoNumerico = parseInt(diaPago, 10) || 0;

  const handleMontoChange = (
    value: string,
    setter: (v: string) => void,
    allowNegative = false,
  ) => {
    const regex = allowNegative ? /[^0-9.-]/g : /[^0-9.]/g;
    setter(value.replace(regex, ""));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) return;

    if (tipo === "CREDITO") {
      if (
        limiteNumerico <= 0 ||
        diaCorteNumerico < 1 ||
        diaCorteNumerico > 31 ||
        diaPagoNumerico < 1 ||
        diaPagoNumerico > 31
      ) {
        return;
      }

      createTarjetaMutation.mutate({
        nombre: nombre.trim(),
        limite: limiteNumerico,
        diaCorte: diaCorteNumerico,
        diaPago: diaPagoNumerico,
      });
    } else {
      createCuentaMutation.mutate({
        nombre: nombre.trim(),
        tipo,
        saldo: saldoNumerico,
        tasaRendimiento: tipo === "INVERSION" ? tasaNumerico : undefined,
      });
    }
  };

  const isValid = () => {
    if (!nombre.trim()) return false;

    if (tipo === "CREDITO") {
      return (
        limiteNumerico > 0 &&
        diaCorteNumerico >= 1 &&
        diaCorteNumerico <= 31 &&
        diaPagoNumerico >= 1 &&
        diaPagoNumerico <= 31
      );
    }

    return true;
  };

  const tipoLabels: Record<TipoCuenta, string> = {
    DEBITO: "Débito",
    EFECTIVO: "Efectivo",
    INVERSION: "Ahorro / Inversión",
    CREDITO: "Tarjeta de Crédito",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">
          Tipo de Cuenta
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["DEBITO", "EFECTIVO", "INVERSION", "CREDITO"] as TipoCuenta[]).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  tipo === t
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white"
                }`}
              >
                {tipoLabels[t]}
              </button>
            ),
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">
          Nombre
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={
            tipo === "CREDITO"
              ? "Ej: Plata Card"
              : tipo === "INVERSION"
                ? "Ej: Cajita NU"
                : "Ej: BBVA Nómina"
          }
          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {tipo !== "CREDITO" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-400">
            Saldo Inicial
          </label>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={saldo}
              onChange={(e) =>
                handleMontoChange(e.target.value, setSaldo, true)
              }
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-800 bg-gray-950 py-3 pr-4 pl-8 text-lg font-semibold text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          {saldoNumerico !== 0 && (
            <p className="mt-1 text-right text-sm text-gray-500">
              {formatMXN(saldoNumerico)}
            </p>
          )}
        </div>
      )}

      {tipo === "INVERSION" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-400">
            Tasa de Rendimiento Anual (GAT)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={tasaRendimiento}
              onChange={(e) =>
                handleMontoChange(e.target.value, setTasaRendimiento)
              }
              placeholder="13.00"
              className="w-full rounded-lg border border-gray-800 bg-gray-950 py-3 pr-8 pl-4 text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500">
              %
            </span>
          </div>
          {tasaNumerico > 0 && saldoNumerico > 0 && (
            <p className="mt-2 text-sm text-gray-400">
              Proyección a 1 año:{" "}
              <span className="font-medium text-green-400">
                {formatMXN(saldoNumerico * (1 + tasaNumerico / 100))}
              </span>
            </p>
          )}
        </div>
      )}

      {tipo === "CREDITO" && (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-400">
              Límite de Crédito
            </label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={limite}
                onChange={(e) => handleMontoChange(e.target.value, setLimite)}
                placeholder="50,000.00"
                className="w-full rounded-lg border border-gray-800 bg-gray-950 py-3 pr-4 pl-8 text-lg font-semibold text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            {limiteNumerico > 0 && (
              <p className="mt-1 text-right text-sm text-gray-500">
                {formatMXN(limiteNumerico)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">
                Día de Corte
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={diaCorte}
                onChange={(e) => setDiaCorte(e.target.value)}
                placeholder="15"
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-center text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">
                Día de Pago
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={diaPago}
                onChange={(e) => setDiaPago(e.target.value)}
                placeholder="5"
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-center text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </>
      )}

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
          disabled={!isValid() || isPending}
          className="flex-1 rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
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
            "Crear Cuenta"
          )}
        </button>
      </div>
    </form>
  );
}
