import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { api, HydrateClient } from "@/trpc/server";
import { Dashboard } from "./_components/dashboard";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  void api.dashboard.getSaldos.prefetch();
  void api.tarjetas.getResumenCredito.prefetch();
  void api.adeudos.getResumen.prefetch();
  void api.comprasMSI.getResumen.prefetch();
  void api.cuentas.getInversionesDesactualizadas.prefetch();
  void api.transacciones.getSuscripciones.prefetch();

  return (
    <HydrateClient>
      <Dashboard user={session.user} />
    </HydrateClient>
  );
}
