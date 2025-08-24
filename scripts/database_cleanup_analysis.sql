-- ANÁLISIS DE TABLAS DE LA BASE DE DATOS
-- Revisión de todas las tablas para identificar uso y necesidad

-- ========================================
-- TABLAS ACTIVAMENTE UTILIZADAS (CONFIRMADAS EN CÓDIGO)
-- ========================================

-- 1. TURNOS (21 usos) - ESENCIAL
-- Tabla principal para gestión de citas
-- Usada en: admin, paciente, API, webhooks
-- MANTENER

-- 2. PACIENTES (13 usos) - ESENCIAL  
-- Gestión de pacientes
-- Usada en: admin, paciente portal, autenticación
-- MANTENER

-- 3. OBRAS_SOCIALES (7 usos) - ESENCIAL
-- Gestión de obras sociales/seguros
-- Usada en: admin, formularios paciente, API
-- MANTENER

-- 4. PRODUCTOS (9 usos) - ESENCIAL
-- Gestión de productos e inventario
-- Usada en: admin productos, inventario, ventas
-- MANTENER

-- 5. VENTAS (4 usos) - ESENCIAL
-- Gestión de ventas
-- Usada en: admin ventas
-- MANTENER

-- 6. TRATAMIENTOS (8 usos) - ESENCIAL
-- Gestión de tratamientos médicos
-- Usada en: admin tratamientos, turnos
-- MANTENER

-- ========================================
-- TABLAS DE SOPORTE NECESARIAS
-- ========================================

-- 7. USUARIOS_SISTEMA - ESENCIAL
-- Autenticación y roles de usuarios
-- Usada en middleware y autenticación
-- MANTENER

-- 8. TENANTS - ESENCIAL (MULTI-TENANT)
-- Sistema multi-tenant
-- Necesaria para separación de datos por cliente
-- MANTENER

-- 9. PERMISOS_ROL - ESENCIAL
-- Control de permisos por rol
-- Necesaria para seguridad
-- MANTENER

-- 10. CATEGORIAS_PRODUCTOS - NECESARIA
-- Categorización de productos
-- Referenciada por productos.categoria_id
-- MANTENER

-- ========================================
-- TABLAS DE AUDITORÍA Y HISTORIAL
-- ========================================

-- 11. TURNOS_AUDIT - NECESARIA
-- Auditoría de cambios en turnos
-- Implementada recientemente para tracking
-- MANTENER

-- 12. TURNOS_STATUS_HISTORY - POSIBLE DUPLICACIÓN
-- Historial de estados de turnos
-- REVISAR: Podría estar duplicando funcionalidad con turnos_audit
-- EVALUAR CONSOLIDACIÓN

-- ========================================
-- TABLAS DE FUNCIONALIDADES ESPECÍFICAS
-- ========================================

-- 13. PACIENTE_ARCHIVOS - NECESARIA
-- Archivos de pacientes (estudios, documentos)
-- Funcionalidad específica importante
-- MANTENER

-- 14. DETALLE_VENTAS - NECESARIA
-- Detalles de líneas de venta
-- Necesaria para sistema de ventas completo
-- MANTENER

-- 15. LOTES_PRODUCTOS - NECESARIA
-- Control de lotes de productos
-- Importante para inventario y trazabilidad
-- MANTENER

-- 16. DETALLE_VENTAS_LOTES - NECESARIA
-- Relación entre ventas y lotes
-- Necesaria para trazabilidad completa
-- MANTENER

-- ========================================
-- TABLAS POCO UTILIZADAS O DUPLICADAS
-- ========================================

-- 17. TURNO_TODOS - POSIBLE ELIMINACIÓN
-- Tareas relacionadas con turnos
-- NO ENCONTRADA EN CÓDIGO ACTUAL
-- CANDIDATA PARA ELIMINACIÓN

-- 18. TRATAMIENTO_TAREAS_TEMPLATE - POSIBLE ELIMINACIÓN
-- Templates de tareas para tratamientos
-- NO ENCONTRADA EN CÓDIGO ACTUAL
-- CANDIDATA PARA ELIMINACIÓN

-- 19. INSUMOS - POSIBLE ELIMINACIÓN
-- Gestión de insumos
-- NO ENCONTRADA EN CÓDIGO ACTUAL
-- CANDIDATA PARA ELIMINACIÓN

-- 20. VISTA_GANANCIAS_VENTAS - MANTENER
-- Vista para reportes de ganancias
-- Útil para reportes aunque no se use actualmente
-- MANTENER

-- ========================================
-- RECOMENDACIONES DE LIMPIEZA
-- ========================================

-- ELIMINAR ESTAS TABLAS (NO UTILIZADAS):
DROP TABLE IF EXISTS turno_todos;
DROP TABLE IF EXISTS tratamiento_tareas_template;
DROP TABLE IF EXISTS insumos;

-- EVALUAR CONSOLIDACIÓN:
-- turnos_status_history podría consolidarse con turnos_audit
-- para evitar duplicación de funcionalidad

-- MANTENER TODAS LAS DEMÁS TABLAS
-- Son necesarias para el funcionamiento completo del sistema

-- ========================================
-- RESUMEN
-- ========================================
-- TOTAL TABLAS: 20
-- ESENCIALES: 16
-- CANDIDATAS ELIMINACIÓN: 3
-- EVALUAR CONSOLIDACIÓN: 1
-- RESULTADO: Base de datos bien estructurada con mínima limpieza necesaria
