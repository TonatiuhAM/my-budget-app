-- DropForeignKey
ALTER TABLE "Transaccion" DROP CONSTRAINT "Transaccion_categoriaId_fkey";

-- AlterTable
ALTER TABLE "Transaccion" ALTER COLUMN "categoriaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaccion" ADD CONSTRAINT "Transaccion_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
