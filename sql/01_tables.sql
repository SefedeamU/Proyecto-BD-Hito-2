-- =====================================================================
-- 01_tables.sql
-- Creación de todas las tablas con PK, FK, UNIQUE, NOT NULL y CHECK.
--
-- Base: modelo relacional del Hito 1 (diccionario de datos 3.3).
-- Este archivo incorpora las CORRECCIONES del Hito 2. Cada desviación
-- respecto al Hito 1 está marcada con la etiqueta [Cambio X] y se
-- explica en docs/cambios_respecto_hito1.md.
--
-- Convenciones de tipos (Hito 1 -> PostgreSQL):
--   Bigint           -> BIGINT
--   Int              -> INTEGER
--   Varchar(n)       -> VARCHAR(n)
--   Date             -> DATE
--   Double Precision -> DOUBLE PRECISION
--
-- El orden de creación respeta las dependencias de llaves foráneas.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. AgeRate
-- ---------------------------------------------------------------------
CREATE TABLE AgeRate (
    Code        BIGINT       NOT NULL,
    Label       VARCHAR(5)   NOT NULL,
    Language    INTEGER      NOT NULL,
    Violence    INTEGER      NOT NULL,
    Sexuality   INTEGER      NOT NULL,
    Topics      INTEGER      NOT NULL,
    CONSTRAINT pk_agerate PRIMARY KEY (Code),
    CONSTRAINT ck_agerate_language  CHECK (Language  BETWEEN 1 AND 10),
    CONSTRAINT ck_agerate_violence  CHECK (Violence  BETWEEN 1 AND 10),
    CONSTRAINT ck_agerate_sexuality CHECK (Sexuality BETWEEN 1 AND 10),
    CONSTRAINT ck_agerate_topics    CHECK (Topics    BETWEEN 1 AND 10)
);


-- ---------------------------------------------------------------------
-- 2. Warning  (entidad débil de AgeRate, cascada en borrado)
-- ---------------------------------------------------------------------
CREATE TABLE Warning (
    AgeRate_Code BIGINT        NOT NULL,
    Texto        VARCHAR(500)  NOT NULL,
    CONSTRAINT pk_warning PRIMARY KEY (AgeRate_Code, Texto),
    CONSTRAINT fk_warning_agerate FOREIGN KEY (AgeRate_Code)
        REFERENCES AgeRate (Code) ON DELETE CASCADE
);


-- ---------------------------------------------------------------------
-- 3. Editorial
-- ---------------------------------------------------------------------
CREATE TABLE Editorial (
    Id        BIGINT        NOT NULL,
    Nombre    VARCHAR(50)   NOT NULL,
    Pais      VARCHAR(30)   NOT NULL,
    Fundacion DATE          NOT NULL,
    WebPage   VARCHAR(100),
    CONSTRAINT pk_editorial PRIMARY KEY (Id)
);


-- ---------------------------------------------------------------------
-- 4. Genero
-- ---------------------------------------------------------------------
CREATE TABLE Genero (
    Nombre      VARCHAR(50)   NOT NULL,
    Descripcion VARCHAR(500)  NOT NULL,
    CONSTRAINT pk_genero PRIMARY KEY (Nombre)
);


-- ---------------------------------------------------------------------
-- 5. SubGenero  (entidad débil de Genero, cascada en borrado)
-- ---------------------------------------------------------------------
CREATE TABLE SubGenero (
    Genero_Nombre VARCHAR(50)   NOT NULL,
    Nombre        VARCHAR(50)   NOT NULL,
    Descripcion   VARCHAR(500)  NOT NULL,
    CONSTRAINT pk_subgenero PRIMARY KEY (Genero_Nombre, Nombre),
    CONSTRAINT fk_subgenero_genero FOREIGN KEY (Genero_Nombre)
        REFERENCES Genero (Nombre) ON DELETE CASCADE
);


-- ---------------------------------------------------------------------
-- 6. Autor
-- ---------------------------------------------------------------------
CREATE TABLE Autor (
    Id         BIGINT        NOT NULL,
    Nombre     VARCHAR(50)   NOT NULL,
    Apellido   VARCHAR(50)   NOT NULL,
    Pais       VARCHAR(30)   NOT NULL,
    Nacimiento DATE          NOT NULL,
    Biografia  VARCHAR(500),
    CONSTRAINT pk_autor PRIMARY KEY (Id)
);


-- ---------------------------------------------------------------------
-- 7. Premio
-- ---------------------------------------------------------------------
CREATE TABLE Premio (
    Nombre     VARCHAR(50)  NOT NULL,
    Categoria  VARCHAR(50)  NOT NULL,
    Relevancia INTEGER,
    CONSTRAINT pk_premio PRIMARY KEY (Nombre),
    CONSTRAINT ck_premio_relevancia CHECK (Relevancia BETWEEN 1 AND 5)
);


-- ---------------------------------------------------------------------
-- 8. Ilustracion
-- ---------------------------------------------------------------------
CREATE TABLE Ilustracion (
    Code       BIGINT       NOT NULL,
    Artista    VARCHAR(50)  NOT NULL,
    TipoDeArte VARCHAR(50)  NOT NULL,
    ImagenURL  VARCHAR(100) NOT NULL,
    Fecha      DATE         NOT NULL,
    CONSTRAINT pk_ilustracion PRIMARY KEY (Code)
);


-- ---------------------------------------------------------------------
-- 9. Curiosidad
-- ---------------------------------------------------------------------
CREATE TABLE Curiosidad (
    Code        BIGINT        NOT NULL,
    Descripcion VARCHAR(500)  NOT NULL,
    CONSTRAINT pk_curiosidad PRIMARY KEY (Code)
);


-- ---------------------------------------------------------------------
-- 10. Usuario  (PK compuesta (Username, Email) — se mantiene por
--     fidelidad al Hito 1; ambos además son únicos individualmente)
-- ---------------------------------------------------------------------
CREATE TABLE Usuario (
    Username  VARCHAR(50)   NOT NULL,
    Email     VARCHAR(100)  NOT NULL,
    Password  VARCHAR(12)   NOT NULL,
    Nombre    VARCHAR(20)   NOT NULL,
    Apellido  VARCHAR(20)   NOT NULL,
    Edad      INTEGER       NOT NULL,
    Telefono  BIGINT        NOT NULL,
    Ciudad    VARCHAR(20)   NOT NULL,
    Rol       VARCHAR(20)   NOT NULL,
    CONSTRAINT pk_usuario PRIMARY KEY (Username, Email),
    CONSTRAINT uq_usuario_username UNIQUE (Username),
    CONSTRAINT uq_usuario_email    UNIQUE (Email),
    CONSTRAINT ck_usuario_password CHECK (CHAR_LENGTH(Password) = 12),
    CONSTRAINT ck_usuario_edad     CHECK (Edad >= 12)
);


-- ---------------------------------------------------------------------
-- 11. Material  (superclase)
--     [Cambio A] Se agrega el discriminador Tipo para garantizar la
--     herencia TOTAL y DISJUNTA (cada material es exactamente un
--     subtipo). NOT NULL = totalidad; CHECK de un único valor = disjunción.
-- ---------------------------------------------------------------------
CREATE TABLE Material (
    Id               BIGINT       NOT NULL,
    Numero_Paginas   INTEGER      NOT NULL,
    Anio_Publicacion BIGINT       NOT NULL,
    Eslogan          VARCHAR(100),
    Alias            VARCHAR(50),
    Pais             VARCHAR(15)  NOT NULL,
    Idioma           VARCHAR(15)  NOT NULL,
    Tipo             VARCHAR(10)  NOT NULL,        -- [Cambio A] discriminador de subtipo
    AgeRate_Code     BIGINT       NOT NULL,
    Editorial_Id     BIGINT       NOT NULL,
    CONSTRAINT pk_material PRIMARY KEY (Id),
    CONSTRAINT ck_material_tipo CHECK              -- [Cambio A]
        (Tipo IN ('Libro','Ensayo','Revista','Poema','AudioBook')),
    CONSTRAINT fk_material_agerate FOREIGN KEY (AgeRate_Code)
        REFERENCES AgeRate (Code),
    CONSTRAINT fk_material_editorial FOREIGN KEY (Editorial_Id)
        REFERENCES Editorial (Id)
);


-- ---------------------------------------------------------------------
-- 12. Subtipos de Material (se mantienen por fidelidad al Hito 1;
--     deben poblarse en coherencia con Material.Tipo — ver [Cambio A])
-- ---------------------------------------------------------------------
CREATE TABLE Libro (
    Material_Id BIGINT NOT NULL,
    CONSTRAINT pk_libro PRIMARY KEY (Material_Id),
    CONSTRAINT fk_libro_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE
);

CREATE TABLE Ensayo (
    Material_Id BIGINT NOT NULL,
    CONSTRAINT pk_ensayo PRIMARY KEY (Material_Id),
    CONSTRAINT fk_ensayo_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE
);

CREATE TABLE Revista (
    Material_Id BIGINT NOT NULL,
    CONSTRAINT pk_revista PRIMARY KEY (Material_Id),
    CONSTRAINT fk_revista_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE
);

CREATE TABLE Poema (
    Material_Id BIGINT NOT NULL,
    CONSTRAINT pk_poema PRIMARY KEY (Material_Id),
    CONSTRAINT fk_poema_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE
);

CREATE TABLE AudioBook (
    Material_Id BIGINT NOT NULL,
    CONSTRAINT pk_audiobook PRIMARY KEY (Material_Id),
    CONSTRAINT fk_audiobook_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE
);


-- ---------------------------------------------------------------------
-- 13. Escribe  (M:N  Autor - Material)
--     Participación total "material >= 1 autor" enforzada por trigger
--     diferido (ver 02_triggers.sql, [Cambio B]).
-- ---------------------------------------------------------------------
CREATE TABLE Escribe (
    Material_Id BIGINT NOT NULL,
    Autor_Id    BIGINT NOT NULL,
    CONSTRAINT pk_escribe PRIMARY KEY (Material_Id, Autor_Id),
    CONSTRAINT fk_escribe_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE,
    CONSTRAINT fk_escribe_autor FOREIGN KEY (Autor_Id)
        REFERENCES Autor (Id)
);


-- ---------------------------------------------------------------------
-- 14. Pertenece  (M:N  Material - Genero)
-- ---------------------------------------------------------------------
CREATE TABLE Pertenece (
    Material_Id   BIGINT      NOT NULL,
    Genero_Nombre VARCHAR(50) NOT NULL,
    CONSTRAINT pk_pertenece PRIMARY KEY (Material_Id, Genero_Nombre),
    CONSTRAINT fk_pertenece_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE,
    CONSTRAINT fk_pertenece_genero FOREIGN KEY (Genero_Nombre)
        REFERENCES Genero (Nombre)
);


-- ---------------------------------------------------------------------
-- [Cambio I] 14b. PerteneceSubGenero  (M:N  Material - SubGenero)
--     NUEVA tabla. El Hito 1 dejó SubGenero sin relación con Material,
--     lo que impedía la consulta "materiales por subgénero" (requisito
--     del propio Hito 1). Esta tabla la habilita.
-- ---------------------------------------------------------------------
CREATE TABLE PerteneceSubGenero (
    Material_Id      BIGINT      NOT NULL,
    Genero_Nombre    VARCHAR(50) NOT NULL,
    SubGenero_Nombre VARCHAR(50) NOT NULL,
    CONSTRAINT pk_pertenecesub
        PRIMARY KEY (Material_Id, Genero_Nombre, SubGenero_Nombre),
    CONSTRAINT fk_pertenecesub_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE,
    CONSTRAINT fk_pertenecesub_subgenero FOREIGN KEY (Genero_Nombre, SubGenero_Nombre)
        REFERENCES SubGenero (Genero_Nombre, Nombre)
);


-- ---------------------------------------------------------------------
-- 15. Popularizo  (M:N  Autor - Genero)
--     Participación total "genero >= 1 autor" enforzada por trigger
--     diferido (ver 02_triggers.sql, [Cambio C]).
-- ---------------------------------------------------------------------
CREATE TABLE Popularizo (
    Autor_Id      BIGINT      NOT NULL,
    Genero_Nombre VARCHAR(50) NOT NULL,
    CONSTRAINT pk_popularizo PRIMARY KEY (Autor_Id, Genero_Nombre),
    CONSTRAINT fk_popularizo_autor FOREIGN KEY (Autor_Id)
        REFERENCES Autor (Id),
    CONSTRAINT fk_popularizo_genero FOREIGN KEY (Genero_Nombre)
        REFERENCES Genero (Nombre)
);


-- ---------------------------------------------------------------------
-- 16. Ganar  (M:N  Material - Premio)
-- ---------------------------------------------------------------------
CREATE TABLE Ganar (
    Material_Id   BIGINT      NOT NULL,
    Premio_Nombre VARCHAR(50) NOT NULL,
    Fecha         DATE,
    CONSTRAINT pk_ganar PRIMARY KEY (Material_Id, Premio_Nombre),
    CONSTRAINT fk_ganar_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE,
    CONSTRAINT fk_ganar_premio FOREIGN KEY (Premio_Nombre)
        REFERENCES Premio (Nombre)
);


-- ---------------------------------------------------------------------
-- 17. Contiene  (M:N  Material - Ilustracion)
-- ---------------------------------------------------------------------
CREATE TABLE Contiene (
    Material_Id      BIGINT  NOT NULL,
    Ilustracion_Code BIGINT  NOT NULL,
    NumeroDePagina   INTEGER,
    CONSTRAINT pk_contiene PRIMARY KEY (Material_Id, Ilustracion_Code),
    CONSTRAINT fk_contiene_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE,
    CONSTRAINT fk_contiene_ilustracion FOREIGN KEY (Ilustracion_Code)
        REFERENCES Ilustracion (Code)
);


-- ---------------------------------------------------------------------
-- 18. Tiene  (1:N parcial  Material - Curiosidad)
-- ---------------------------------------------------------------------
CREATE TABLE Tiene (
    Curiosidad_Code BIGINT NOT NULL,
    Material_Id     BIGINT,
    CONSTRAINT pk_tiene PRIMARY KEY (Curiosidad_Code),
    CONSTRAINT fk_tiene_curiosidad FOREIGN KEY (Curiosidad_Code)
        REFERENCES Curiosidad (Code) ON DELETE CASCADE,
    CONSTRAINT fk_tiene_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE
);


-- ---------------------------------------------------------------------
-- 19. Likes  (M:N  Usuario - Material)
--     [Cambio H] ON UPDATE CASCADE para permitir corregir credenciales
--     del usuario (Username/Email) sin romper la integridad referencial.
-- ---------------------------------------------------------------------
CREATE TABLE Likes (
    Material_Id      BIGINT       NOT NULL,
    Usuario_Username VARCHAR(50)  NOT NULL,
    Usuario_Email    VARCHAR(100) NOT NULL,
    CONSTRAINT pk_likes PRIMARY KEY (Material_Id, Usuario_Username, Usuario_Email),
    CONSTRAINT fk_likes_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_usuario FOREIGN KEY (Usuario_Username, Usuario_Email)
        REFERENCES Usuario (Username, Email)
        ON DELETE CASCADE ON UPDATE CASCADE          -- [Cambio H]
);


-- ---------------------------------------------------------------------
-- 20. Leer  (M:N  Usuario - Material)
--     [Cambio D] Fecha pasa a formar parte de la PK y es NOT NULL, para
--     permitir RELECTURAS (un usuario puede leer el mismo material en
--     fechas distintas). Antes la PK era (Material,Usuario) y solo
--     admitía una lectura por material.
--     [Cambio H] ON UPDATE CASCADE en la FK a Usuario.
-- ---------------------------------------------------------------------
CREATE TABLE Leer (
    Material_Id      BIGINT       NOT NULL,
    Usuario_Username VARCHAR(50)  NOT NULL,
    Usuario_Email    VARCHAR(100) NOT NULL,
    Fecha            DATE         NOT NULL,           -- [Cambio D]
    CONSTRAINT pk_leer PRIMARY KEY                    -- [Cambio D]
        (Material_Id, Usuario_Username, Usuario_Email, Fecha),
    CONSTRAINT fk_leer_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE,
    CONSTRAINT fk_leer_usuario FOREIGN KEY (Usuario_Username, Usuario_Email)
        REFERENCES Usuario (Username, Email)
        ON DELETE CASCADE ON UPDATE CASCADE          -- [Cambio H]
);


-- ---------------------------------------------------------------------
-- 21. Resena  (entidad asociativa Usuario - Material)
--     [Cambio E] UNIQUE(Material, Usuario) -> una reseña por usuario y
--                material (evita reseñas duplicadas del mismo usuario).
--     [Cambio F] CHECK Likes >= 0.
--     [Cambio G] Puntaje pasa de DOUBLE PRECISION a NUMERIC(3,1) para
--                garantizar "un decimal de precisión" (regla del Hito 1).
--     [Cambio H] ON UPDATE CASCADE en la FK a Usuario.
-- ---------------------------------------------------------------------
CREATE TABLE Resena (
    Code             BIGINT       NOT NULL,
    Material_Id      BIGINT       NOT NULL,
    Usuario_Username VARCHAR(50)  NOT NULL,
    Usuario_Email    VARCHAR(100) NOT NULL,
    Comentario       VARCHAR(500) NOT NULL,
    Puntaje          NUMERIC(3,1) NOT NULL,           -- [Cambio G]
    Fecha            DATE         NOT NULL,
    Likes            INTEGER      NOT NULL,
    CONSTRAINT pk_resena PRIMARY KEY (Code),
    CONSTRAINT uq_resena_usuario_material                 -- [Cambio E]
        UNIQUE (Material_Id, Usuario_Username, Usuario_Email),
    CONSTRAINT fk_resena_material FOREIGN KEY (Material_Id)
        REFERENCES Material (Id) ON DELETE CASCADE,
    CONSTRAINT fk_resena_usuario FOREIGN KEY (Usuario_Username, Usuario_Email)
        REFERENCES Usuario (Username, Email)
        ON DELETE CASCADE ON UPDATE CASCADE,          -- [Cambio H]
    CONSTRAINT ck_resena_puntaje CHECK (Puntaje BETWEEN 0 AND 10),
    CONSTRAINT ck_resena_likes   CHECK (Likes >= 0)   -- [Cambio F]
);
