-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'RESEND';

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "affectedStatus" TEXT NOT NULL DEFAULT 'DEGRADED';

-- AlterTable
ALTER TABLE "MonitorNotification" ADD COLUMN     "notifyOnFirstCheck" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyOnMaintenance" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnPauseResume" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyOnSslExpiry" BOOLEAN NOT NULL DEFAULT true;
