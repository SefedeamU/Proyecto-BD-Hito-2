-- =====================================================================
-- 02_triggers.sql
-- Funciones y triggers para reglas que dependen de más de una tabla.
--
-- Reglas implementadas:
--   (a) Anio_Publicacion(Material) >= año de Fundacion(Editorial).
--   (b) año(Fecha de Reseña) >= Anio_Publicacion(Material).
--   [Cambio B] (c) Un Material no puede tener cero autores (Escribe).
--   [Cambio C] (d) Un Genero debe ser representado por >=1 Autor (Popularizo).
--
-- Los cambios [B] y [C] usan CONSTRAINT TRIGGER DEFERRABLE INITIALLY
-- DEFERRED: la validación ocurre al COMMIT, no fila por fila. Esto exige
-- que la carga relacionada (Material + Escribe, Genero + Popularizo)
-- ocurra dentro de UNA MISMA TRANSACCIÓN. El populate.py debe envolver
-- la carga en BEGIN ... COMMIT (o cargar por lotes coherentes).
-- =====================================================================


-- ---------------------------------------------------------------------
-- (a) Anio_Publicacion(Material) >= año de Fundacion(Editorial)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_material_anio_vs_editorial()
RETURNS TRIGGER AS $$
DECLARE
    v_anio_fundacion INTEGER;
BEGIN
    SELECT EXTRACT(YEAR FROM e.Fundacion)::INTEGER
      INTO v_anio_fundacion
      FROM Editorial e
     WHERE e.Id = NEW.Editorial_Id;

    IF v_anio_fundacion IS NULL THEN
        RAISE EXCEPTION
            'Editorial % no existe para el material %', NEW.Editorial_Id, NEW.Id;
    END IF;

    IF NEW.Anio_Publicacion < v_anio_fundacion THEN
        RAISE EXCEPTION
            'El año de publicación del material (%) no puede ser menor al año de fundación de la editorial (%).',
            NEW.Anio_Publicacion, v_anio_fundacion;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_material_anio_vs_editorial
    BEFORE INSERT OR UPDATE ON Material
    FOR EACH ROW
    EXECUTE FUNCTION fn_material_anio_vs_editorial();


-- ---------------------------------------------------------------------
-- (b) año(Fecha de Reseña) >= Anio_Publicacion(Material)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_resena_fecha_vs_material()
RETURNS TRIGGER AS $$
DECLARE
    v_anio_material BIGINT;
BEGIN
    SELECT m.Anio_Publicacion
      INTO v_anio_material
      FROM Material m
     WHERE m.Id = NEW.Material_Id;

    IF v_anio_material IS NULL THEN
        RAISE EXCEPTION
            'Material % no existe para la reseña %', NEW.Material_Id, NEW.Code;
    END IF;

    IF EXTRACT(YEAR FROM NEW.Fecha) < v_anio_material THEN
        RAISE EXCEPTION
            'La fecha de la reseña (año %) no puede ser anterior al año de publicación del material (%).',
            EXTRACT(YEAR FROM NEW.Fecha), v_anio_material;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_resena_fecha_vs_material
    BEFORE INSERT OR UPDATE ON Resena
    FOR EACH ROW
    EXECUTE FUNCTION fn_resena_fecha_vs_material();


-- ---------------------------------------------------------------------
-- [Cambio B] (c) Un Material debe tener al menos un Autor (Escribe).
--     Verificación diferida al COMMIT.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_material_min_un_autor()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Escribe e WHERE e.Material_Id = NEW.Id) THEN
        RAISE EXCEPTION
            'El material % debe tener al menos un autor (tabla Escribe).', NEW.Id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_material_min_un_autor
    AFTER INSERT ON Material
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION fn_material_min_un_autor();


-- ---------------------------------------------------------------------
-- [Cambio C] (d) Un Genero debe ser representado por al menos un Autor
--     (Popularizo). Verificación diferida al COMMIT.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_genero_min_un_autor()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Popularizo p WHERE p.Genero_Nombre = NEW.Nombre) THEN
        RAISE EXCEPTION
            'El género % debe ser representado por al menos un autor (tabla Popularizo).', NEW.Nombre;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_genero_min_un_autor
    AFTER INSERT ON Genero
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION fn_genero_min_un_autor();
