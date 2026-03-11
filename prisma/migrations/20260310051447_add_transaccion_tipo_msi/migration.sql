-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('GASTO', 'INGRESO');

-- AlterTable
ALTER TABLE "Transaccion" ADD COLUMN     "compraMSIId" TEXT,
ADD COLUMN     "pagoNumero" INTEGER,
ADD COLUMN     "tipo" "TipoTransaccion" NOT NULL DEFAULT 'GASTO';

-- AddForeignKey
ALTER TABLE "Transaccion" ADD CONSTRAINT "Transaccion_compraMSIId_fkey" FOREIGN KEY ("compraMSIId") REFERENCES "CompraMSI"("id") ON DELETE SET NULL ON UPDATE CASCADE;
