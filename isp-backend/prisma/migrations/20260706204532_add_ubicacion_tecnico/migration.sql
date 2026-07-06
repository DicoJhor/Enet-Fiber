-- AlterTable
ALTER TABLE "tecnicos" ADD COLUMN     "ultima_lat" DOUBLE PRECISION,
ADD COLUMN     "ultima_lng" DOUBLE PRECISION,
ADD COLUMN     "ultima_ubicacion_at" TIMESTAMP(3);
