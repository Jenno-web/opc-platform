-- CreateEnum
CREATE TYPE "ProjectKind" AS ENUM ('DEMAND', 'SUPPLY', 'MUTUAL');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "kind" "ProjectKind" NOT NULL DEFAULT 'DEMAND';
