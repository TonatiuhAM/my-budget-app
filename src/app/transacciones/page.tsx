import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { TransaccionesPage } from "@/app/_components/transacciones-page";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <TransaccionesPage />;
}
