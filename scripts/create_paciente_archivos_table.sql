-- Tabla para almacenar archivos y links relacionados a cada paciente
CREATE TABLE IF NOT EXISTS paciente_archivos (
    id SERIAL PRIMARY KEY,
    paciente_dni VARCHAR REFERENCES pacientes(dni) ON DELETE CASCADE,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    tipo VARCHAR NOT NULL CHECK (tipo IN ('archivo', 'link')),
    url TEXT NOT NULL, -- URL del archivo en blob storage o link externo
    categoria VARCHAR, -- radiografia, tomografia, ecografia, estudio, etc.
    fecha_estudio DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_paciente_archivos_dni ON paciente_archivos(paciente_dni);
CREATE INDEX IF NOT EXISTS idx_paciente_archivos_categoria ON paciente_archivos(categoria);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_paciente_archivos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_paciente_archivos_updated_at
    BEFORE UPDATE ON paciente_archivos
    FOR EACH ROW
    EXECUTE FUNCTION update_paciente_archivos_updated_at();

-- Habilitar RLS
ALTER TABLE paciente_archivos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow all operations for authenticated users" ON paciente_archivos
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for service role" ON paciente_archivos
    FOR ALL USING (auth.role() = 'service_role');
