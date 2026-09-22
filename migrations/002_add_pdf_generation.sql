ALTER TABLE archivos_pdf
ADD COLUMN IF NOT EXISTS generation VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS idx_archivos_pdf_storage_path
ON archivos_pdf(storage_path)