-- CreateIndex
CREATE INDEX "Incident_status_startedAt_idx" ON "Incident"("status", "startedAt");

-- CreateIndex
CREATE INDEX "Incident_monitorId_status_idx" ON "Incident"("monitorId", "status");

-- CreateIndex
CREATE INDEX "Incident_monitorId_resolvedAt_idx" ON "Incident"("monitorId", "resolvedAt");

-- CreateIndex
CREATE INDEX "MonitorCheck_status_idx" ON "MonitorCheck"("status");

-- CreateIndex
CREATE INDEX "MonitorCheck_monitorId_status_createdAt_idx" ON "MonitorCheck"("monitorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
