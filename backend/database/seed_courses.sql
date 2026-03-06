USE artisound_db;

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
SELECT 'Sombreado y tecnicas de sombras',
       'Aprende a construir volumen, contraste y profundidad con tecnicas de sombreado tradicionales y digitales.',
       'ARTE',
       'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
       @prof1, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Sombreado y tecnicas de sombras');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Iluminacion y luces en dibujo',
       'Domina fuentes de luz, reflejos y atmosfera para escenas realistas e ilustraciones expresivas.',
       'ARTE',
       'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
       @prof2, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Iluminacion y luces en dibujo');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Teoria del color y paletas de colores',
       'Entiende armonias, contraste cromatico y seleccion de paletas para piezas visuales profesionales.',
       'ARTE',
       'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
       @prof3, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Teoria del color y paletas de colores');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Como dibujar personas usando formas geometricas',
       'Construye figuras humanas desde formas base para mejorar proporcion, pose y estructura.',
       'ARTE',
       'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
       @prof1, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Como dibujar personas usando formas geometricas');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Perspectiva en ilustracion',
       'Aplica perspectiva de 1, 2 y 3 puntos para escenarios y composiciones con profundidad coherente.',
       'ARTE',
       'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
       @prof2, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Perspectiva en ilustracion');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Dibujo anatomico basico',
       'Estudia proporciones, volumen y articulaciones para representar anatomia humana con precision.',
       'ARTE',
       'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80',
       @prof3, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Dibujo anatomico basico');

-- MUSICA
INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Introduccion a la guitarra',
       'Fundamentos tecnicos de digitacion, acordes basicos y coordinacion de manos para principiantes.',
       'MUSICA',
       'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80',
       @prof1, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Introduccion a la guitarra');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Teoria musical basica',
       'Lectura ritmica, intervalos y construccion de acordes para comprender el lenguaje musical.',
       'MUSICA',
       'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
       @prof2, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Teoria musical basica');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Escalas musicales',
       'Practica escalas mayores, menores y modos para mejorar tecnica e improvisacion.',
       'MUSICA',
       'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
       @prof3, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Escalas musicales');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Ritmo y tempo',
       'Desarrolla precision ritmica con subdivisiones, metrico interno y ejercicios con metronomo.',
       'MUSICA',
       'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80',
       @prof1, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Ritmo y tempo');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Composicion musical',
       'Crea piezas originales aplicando forma, melodia, armonia y desarrollo tematico.',
       'MUSICA',
       'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
       @prof2, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Composicion musical');

INSERT INTO courses (title, description, category, image_url, professor_id, total_classes, status, published)
SELECT 'Improvisacion en guitarra',
       'Entrena fraseo, articulacion y recursos armonicos para improvisar con identidad.',
       'MUSICA',
       'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1200&q=80',
       @prof3, 0, 'ACTIVE', TRUE
FROM DUAL
WHERE @prof1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Improvisacion en guitarra');
