CREATE TABLE formularios (
  id BIGSERIAL PRIMARY KEY,
  tipo VARCHAR(60) NOT NULL CHECK (tipo IN ('contacto', 'cotizacion', 'personalizado')),
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  telefono VARCHAR(50),
  empresa VARCHAR(150),
  asunto VARCHAR(180),
  mensaje TEXT,
  estado VARCHAR(30) DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'en_revision', 'respondido', 'cerrado')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE archivos_pdf (
  id BIGSERIAL PRIMARY KEY,
  formulario_id BIGINT NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE storage_cleanup_pending (
  id BIGSERIAL PRIMARY KEY,
  storage_path TEXT NOT NULL,
  bucket_name VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'cleaned', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_formularios_updated_at
BEFORE UPDATE ON formularios
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_storage_cleanup_pending_updated_at
BEFORE UPDATE ON storage_cleanup_pending
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_formularios_created_at ON formularios(created_at DESC);
CREATE INDEX idx_formularios_estado ON formularios(estado);
CREATE INDEX idx_archivos_formulario_id ON archivos_pdf(formulario_id);
CREATE INDEX idx_storage_cleanup_pending_status ON storage_cleanup_pending(status);
CREATE UNIQUE INDEX idx_storage_cleanup_pending_storage_path
ON storage_cleanup_pending(storage_path)
WHERE status IN ('pending', 'failed');
