-- Step 1: Add descripcion column to Transaccion
ALTER TABLE "Transaccion" ADD COLUMN "descripcion" TEXT NOT NULL DEFAULT '';

-- Step 2: Copy category names to descripcion
UPDATE "Transaccion" t 
SET "descripcion" = COALESCE(c."nombre", '')
FROM "Categoria" c 
WHERE t."categoriaId" = c."id";

-- Step 3: Drop the index on categoriaId
DROP INDEX IF EXISTS "Transaccion_categoriaId_idx";

-- Step 4: Drop the foreign key constraint
ALTER TABLE "Transaccion" DROP CONSTRAINT IF EXISTS "Transaccion_categoriaId_fkey";

-- Step 5: Drop the categoriaId column from Transaccion
ALTER TABLE "Transaccion" DROP COLUMN "categoriaId";

-- Step 6: Drop the Categoria table
DROP TABLE "Categoria";
