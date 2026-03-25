-- Report/dashboard filter optimization indexes
CREATE INDEX "Trade_userId_accountId_entryDate_idx" ON "public"."Trade"("userId", "accountId", "entryDate" DESC);
CREATE INDEX "Trade_userId_phaseAccountId_entryDate_idx" ON "public"."Trade"("userId", "phaseAccountId", "entryDate" DESC);
CREATE INDEX "Trade_userId_modelId_entryDate_idx" ON "public"."Trade"("userId", "modelId", "entryDate" DESC);
CREATE INDEX "Trade_userId_ruleBroken_entryDate_idx" ON "public"."Trade"("userId", "ruleBroken", "entryDate" DESC);
CREATE INDEX "Trade_userId_outcome_entryDate_idx" ON "public"."Trade"("userId", "outcome", "entryDate" DESC);
