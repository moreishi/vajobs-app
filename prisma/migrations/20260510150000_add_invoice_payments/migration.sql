-- Add invoiceId to PaymentOrder for invoice payment tracking
ALTER TABLE PaymentOrder ADD COLUMN invoiceId TEXT;
CREATE INDEX IF NOT EXISTS PaymentOrder_invoiceId_idx ON PaymentOrder(invoiceId);
