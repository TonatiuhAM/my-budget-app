import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { CuentasPage } from "@/app/_components/cuentas-page";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <CuentasPage />;
}
