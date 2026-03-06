USE artisound_db;

-- 1) ESTRUCTURA RECOMENDADA PARA CURSOS (compatible con backend actual)
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS category ENUM('ARTE','MUSICA') NOT NULL DEFAULT 'ARTE' AFTER description,
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER category,
  ADD COLUMN IF NOT EXISTS status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'INACTIVE' AFTER total_classes;

-- Mantener compatibilidad con campo legacy published
UPDATE courses
SET status = IF(published = TRUE, 'ACTIVE', 'INACTIVE')
WHERE status IS NULL OR status = '';

UPDATE courses
SET published = (status = 'ACTIVE');

-- Indices para filtros frontend por categoria/estado
SET @idx_cat_status_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'courses'
    AND index_name = 'idx_courses_category_status'
);
SET @sql_idx_cat_status := IF(
  @idx_cat_status_exists = 0,
  'CREATE INDEX idx_courses_category_status ON courses (category, status)',
  'SELECT 1'
);
PREPARE stmt_idx_cat_status FROM @sql_idx_cat_status;
EXECUTE stmt_idx_cat_status;
DEALLOCATE PREPARE stmt_idx_cat_status;

SET @idx_prof_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'courses'
    AND index_name = 'idx_courses_professor_id'
);
SET @sql_idx_prof := IF(
  @idx_prof_exists = 0,
  'CREATE INDEX idx_courses_professor_id ON courses (professor_id)',
  'SELECT 1'
);
PREPARE stmt_idx_prof FROM @sql_idx_prof;
EXECUTE stmt_idx_prof;
DEALLOCATE PREPARE stmt_idx_prof;

-- Relacion profesor_id -> users.id (si no existe)
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'courses'
    AND constraint_name = 'fk_courses_professor'
    AND constraint_type = 'FOREIGN KEY'
);

SET @sql_fk := IF(
  @fk_exists = 0,
  'ALTER TABLE courses ADD CONSTRAINT fk_courses_professor FOREIGN KEY (professor_id) REFERENCES users(id) ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

-- 2) CURSOS DE EJEMPLO
-- Selecciona profesores existentes (rol PROFESOR)
SET @prof1 := (
  SELECT u.id
  FROM users u
  JOIN roles r ON r.id = u.role_id
  WHERE r.name = 'PROFESOR' AND u.active = TRUE
  ORDER BY u.id ASC
  LIMIT 1
);
SET @prof2 := (
  SELECT u.id
  FROM users u
  JOIN roles r ON r.id = u.role_id
  WHERE r.name = 'PROFESOR' AND u.active = TRUE
  ORDER BY u.id ASC
  LIMIT 1 OFFSET 1
);
SET @prof3 := (
  SELECT u.id
  FROM users u
  JOIN roles r ON r.id = u.role_id
  WHERE r.name = 'PROFESOR' AND u.active = TRUE
  ORDER BY u.id ASC
  LIMIT 1 OFFSET 2
);
SET @prof2 := COALESCE(@prof2, @prof1);
SET @prof3 := COALESCE(@prof3, @prof1);

-- ARTE
INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Sombreado y tecnicas de sombras', 'Aprende volumen, contraste y profundidad con tecnicas clasicas y digitales.', 'ARTE',
       'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80', @prof1, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Sombreado y tecnicas de sombras');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Iluminacion y luces en dibujo', 'Control de fuentes de luz, sombras y reflejos para escenas realistas.', 'ARTE',
       'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80', @prof2, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Iluminacion y luces en dibujo');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Teoria del color y paletas de colores', 'Armonias, contraste cromatico y seleccion de paletas efectivas.', 'ARTE',
       'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80', @prof3, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Teoria del color y paletas de colores');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Como dibujar personas usando formas geometricas', 'Figura humana desde formas base para mejorar proporcion y pose.', 'ARTE',
       'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80', @prof1, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Como dibujar personas usando formas geometricas');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Perspectiva en ilustracion', 'Perspectiva 1, 2 y 3 puntos para composiciones con profundidad.', 'ARTE',
       'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80', @prof2, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Perspectiva en ilustracion');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Dibujo anatomico basico', 'Proporciones, volumen y articulaciones para anatomia humana.', 'ARTE',
       'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80', @prof3, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Dibujo anatomico basico');

-- MUSICA
INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Introduccion a la guitarra', 'Acordes basicos, digitacion y coordinacion para principiantes.', 'MUSICA',
       'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80', @prof1, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Introduccion a la guitarra');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Teoria musical basica', 'Lectura ritmica, intervalos y acordes para base solida.', 'MUSICA',
       'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80', @prof2, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Teoria musical basica');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Escalas musicales', 'Escalas mayores, menores y modos para tecnica e improvisacion.', 'MUSICA',
       'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80', @prof3, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Escalas musicales');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Ritmo y tempo', 'Precision ritmica con subdivisiones y practica con metronomo.', 'MUSICA',
       'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80', @prof1, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Ritmo y tempo');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Composicion musical', 'Creacion de piezas propias con estructura, melodia y armonia.', 'MUSICA',
       'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80', @prof2, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Composicion musical');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Improvisacion en guitarra', 'Fraseo, articulacion y recursos armonicos para improvisar.', 'MUSICA',
       'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1200&q=80', @prof3, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Improvisacion en guitarra');
