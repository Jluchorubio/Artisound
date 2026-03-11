CREATE DATABASE IF NOT EXISTS artisound_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE artisound_db;

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  twofa_secret VARCHAR(255) NULL,
  twofa_temp_secret VARCHAR(255) NULL,
  twofa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_id (role_id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('ARTE','MUSICA') NOT NULL DEFAULT 'ARTE',
  image_url VARCHAR(500) NULL,
  professor_id BIGINT NOT NULL,
  total_classes INT NOT NULL DEFAULT 0,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'INACTIVE',
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_courses_professor_id (professor_id),
  CONSTRAINT fk_courses_professor FOREIGN KEY (professor_id) REFERENCES users(id)
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS classes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT NOT NULL,
  professor_id BIGINT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  scheduled_at DATETIME NULL,
  class_order INT NOT NULL DEFAULT 1,
  duration_minutes INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_class_order (course_id, class_order),
  INDEX idx_classes_course_id (course_id),
  INDEX idx_classes_professor_id (professor_id),
  CONSTRAINT fk_classes_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_classes_professor FOREIGN KEY (professor_id) REFERENCES users(id)
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  status ENUM('ACTIVE','PAUSED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enrollment_user_course (user_id, course_id),
  INDEX idx_enrollments_course_id (course_id),
  CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS grades (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  class_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  professor_id BIGINT NOT NULL,
  grade DECIMAL(5,2) NOT NULL,
  feedback TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_grade_class_student (class_id, student_id),
  INDEX idx_grades_student_id (student_id),
  CONSTRAINT chk_grade_range CHECK (grade >= 0 AND grade <= 100),
  CONSTRAINT fk_grades_class FOREIGN KEY (class_id) REFERENCES classes(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_grades_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_grades_professor FOREIGN KEY (professor_id) REFERENCES users(id)
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS progress (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  class_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progress_class_student (class_id, student_id),
  INDEX idx_progress_student_id (student_id),
  CONSTRAINT fk_progress_class FOREIGN KEY (class_id) REFERENCES classes(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_progress_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS drawings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(150) NULL,
  description VARCHAR(255) NULL,
  format VARCHAR(20) NOT NULL DEFAULT 'image/png',
  image_base64 LONGTEXT NULL,
  image_url TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_drawings_user_id (user_id),
  CONSTRAINT fk_drawings_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  purpose ENUM('REGISTER','LOGIN') NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_codes_user (user_id),
  INDEX idx_email_codes_expires (expires_at),
  CONSTRAINT fk_email_codes_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Seed data (roles, users, courses, classes)
-- This keeps the project runnable right after executing this schema.sql.

SET FOREIGN_KEY_CHECKS = 0;

INSERT IGNORE INTO roles (id, name) VALUES
  (1, 'ADMIN'),
  (2, 'PROFESOR'),
  (3, 'USUARIO');

INSERT IGNORE INTO users (id, name, email, password_hash, role_id, twofa_secret, twofa_temp_secret, twofa_enabled, active) VALUES
  (1, 'Administrador', 'admin@artisound.com', '$2b$12$V.YUtTCdm.bY8RwUHx/3gOUZxHE7M9NQGkzstmW5NYV3hetNAoqMy', 1, NULL, NULL, FALSE, TRUE),
  (2, 'Profesor', 'profesor@artisound.com', '$2b$12$TyIgwhSvu3sY6zqBNwAcfORhBGjJpYpXdzmOOWDkmKBoEEYGsMJW6', 2, NULL, NULL, FALSE, TRUE),
  (3, 'Usuario Demo', 'joselu.rubio2008@gmail.com', '$2b$12$zNcfZzX7ltNaJ9TQAK6Xh.uZGPVM1AQfF3m57YAqEI8ckMjofqNmK', 3, NULL, NULL, FALSE, TRUE);

INSERT IGNORE INTO courses (id, title, description, category, image_url, professor_id, total_classes, status, published) VALUES
  (1, 'Sombreado y tecnicas de sombras', 'Aprende a construir volumen, contraste y profundidad con tecnicas de sombreado tradicionales y digitales.', 'ARTE', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (2, 'Iluminacion y luces en dibujo', 'Domina fuentes de luz, reflejos y atmosfera para escenas realistas e ilustraciones expresivas.', 'ARTE', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (3, 'Teoria del color y paletas de colores', 'Entiende armonias, contraste cromatico y seleccion de paletas para piezas visuales profesionales.', 'ARTE', 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (4, 'Como dibujar personas usando formas geometricas', 'Construye figuras humanas desde formas base para mejorar proporcion, pose y estructura.', 'ARTE', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (5, 'Perspectiva en ilustracion', 'Aplica perspectiva de 1, 2 y 3 puntos para escenarios y composiciones con profundidad coherente.', 'ARTE', 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (6, 'Dibujo anatomico basico', 'Estudia proporciones, volumen y articulaciones para representar anatomia humana con precision.', 'ARTE', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (7, 'Introduccion a la guitarra', 'Fundamentos tecnicos de digitacion, acordes basicos y coordinacion de manos para principiantes.', 'MUSICA', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (8, 'Teoria musical basica', 'Lectura ritmica, intervalos y construccion de acordes para comprender el lenguaje musical.', 'MUSICA', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (9, 'Escalas musicales', 'Practica escalas mayores, menores y modos para mejorar tecnica e improvisacion.', 'MUSICA', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (10, 'Ritmo y tempo', 'Desarrolla precision ritmica con subdivisiones, metrico interno y ejercicios con metronomo.', 'MUSICA', 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (11, 'Composicion musical', 'Crea piezas originales aplicando forma, melodia, armonia y desarrollo tematico.', 'MUSICA', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (12, 'Improvisacion en guitarra', 'Entrena fraseo, articulacion y recursos armonicos para improvisar con identidad.', 'MUSICA', 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1200&q=80', 2, 0, 'ACTIVE', TRUE),
  (16, 'animacion 3d', 'gvh bjkjlnb gcvh nm', 'ARTE', NULL, 2, 1, 'ACTIVE', TRUE),
  (17, 'primeros pasos de teoria', 'teoria musical', 'MUSICA', NULL, 2, 1, 'ACTIVE', TRUE);

INSERT IGNORE INTO classes (id, course_id, professor_id, title, description, scheduled_at, class_order, duration_minutes) VALUES
  (2, 16, 2, 'mamejo blender', 'trdtfyhijklkmbncvxx<zxcvhbjk', '2026-03-08 00:49:00', 1, 120),
  (3, 17, 2, 'bases de teoria 1', 'zdxfcgvhjjklnk,mnb', '2026-03-21 14:50:00', 1, 120);

SET FOREIGN_KEY_CHECKS = 1;
