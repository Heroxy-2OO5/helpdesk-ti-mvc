-- HelpDesk TI - Paso 1: crear la base de datos
-- Ejecutar una sola vez conectado a la base de datos "postgres".
-- PostgreSQL no permite CREATE DATABASE dentro de una transacción.

CREATE DATABASE helpdesk_ti
    WITH
    ENCODING = 'UTF8'
    TEMPLATE = template0;

-- Después de ejecutarlo, conéctese a "helpdesk_ti" y continúe con
-- 01_esquema.sql.
