-- Create multi-tenant infrastructure
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3b82f6',
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  plan_type VARCHAR(20) DEFAULT 'demo', -- demo, basic, premium
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add tenant_id to existing tables
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tratamientos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE usuarios_sistema ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE obras_sociales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Create seed tenants
INSERT INTO tenants (subdomain, company_name, phone, email, plan_type) VALUES 
('eleodontologia', 'Ele Odontología', '+54 9 3875350657', 'info@eleodontologia.com', 'premium'),
('demo1', 'Clínica Dental Norte', '+54 9 1234567890', 'demo@clinicadentalnorte.com', 'demo'),
('demo2', 'Odontología Sur', '+54 9 0987654321', 'demo@odontologiasur.com', 'demo');

-- Update existing data to belong to eleodontologia tenant
UPDATE pacientes SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'eleodontologia') WHERE tenant_id IS NULL;
UPDATE turnos SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'eleodontologia') WHERE tenant_id IS NULL;
UPDATE tratamientos SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'eleodontologia') WHERE tenant_id IS NULL;
UPDATE productos SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'eleodontologia') WHERE tenant_id IS NULL;
UPDATE ventas SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'eleodontologia') WHERE tenant_id IS NULL;
UPDATE usuarios_sistema SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'eleodontologia') WHERE tenant_id IS NULL;
UPDATE obras_sociales SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'eleodontologia') WHERE tenant_id IS NULL;

-- Create RLS policies for tenant isolation
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tratamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_sociales ENABLE ROW LEVEL SECURITY;

-- Policies for tenant isolation
CREATE POLICY tenant_isolation_pacientes ON pacientes FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation_turnos ON turnos FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation_tratamientos ON tratamientos FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation_productos ON productos FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation_ventas ON ventas FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_isolation_obras_sociales ON obras_sociales FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
