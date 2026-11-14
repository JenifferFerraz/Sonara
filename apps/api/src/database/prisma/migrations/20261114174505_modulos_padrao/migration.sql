-- AlterTable
ALTER TABLE "public"."usuarios" ALTER COLUMN "modulos" SET DEFAULT ARRAY['abdome', 'pelve', 'tireoide', 'mamas']::TEXT[];
