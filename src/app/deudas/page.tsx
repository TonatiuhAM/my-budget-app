import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { DeudasPage } from "../_components/deudas-page";

export default async function Deudas() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <DeudasPage />;
}
