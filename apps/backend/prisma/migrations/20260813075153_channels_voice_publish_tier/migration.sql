-- CreateEnum
CREATE TYPE "PublishTier" AS ENUM ('STANDARD', 'BOOSTED', 'BOUNTY');

-- AlterEnum
ALTER TYPE "ConversationType" ADD VALUE 'CHANNEL';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "category" TEXT,
ADD COLUMN     "isVoiceRoom" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ConversationParticipant" ADD COLUMN     "inVoiceRoom" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "publishTier" "PublishTier" NOT NULL DEFAULT 'STANDARD';
