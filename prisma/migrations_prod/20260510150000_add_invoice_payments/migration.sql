-- Add invoiceId to PaymentOrder for invoice payment tracking
ALTER TABLE "PaymentOrder" ADD COLUMN "invoiceId" TEXT;
CREATE INDEX "PaymentOrder_invoiceId_idx" ON "PaymentOrder"("invoiceId");
