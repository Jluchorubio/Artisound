# Sistema Academico (Cursos y Clases)

## Endpoints implementados

### Cursos
- `GET /api/courses`
  - `USUARIO`: solo cursos `ACTIVE`.
  - `ADMIN/PROFESOR`: todos los cursos.
- `GET /api/courses/:id`
- `GET /api/courses/mine` (`PROFESOR`)
- `POST /api/courses` (`ADMIN`)
  - Crea curso con categoria `ARTE|MUSICA`.
  - Regla: inicia en `INACTIVE`.
- `PATCH /api/courses/:id` (`ADMIN`)
  - Permite editar `title`, `description`, `category`, `professorId`, `status/published`.
  - Regla: para pasar a `ACTIVE`, el curso debe tener minimo 10 clases.
- `DELETE /api/courses/:id` (`ADMIN`)

### Inscripciones
- `POST /api/courses/:courseId/enroll` (`USUARIO`)
  - Solo permite inscripcion en cursos `ACTIVE`.
- `GET /api/me/enrollments` (`USUARIO`)
- `GET /api/courses/:courseId/students` (`ADMIN|PROFESOR`)

### Clases
- `GET /api/courses/:courseId/classes`
  - `USUARIO`: debe estar inscrito y el curso debe estar `ACTIVE`.
  - `PROFESOR`: solo sus cursos.
  - `ADMIN`: acceso total.
- `POST /api/courses/:courseId/classes` (`ADMIN|PROFESOR`)
- `PATCH /api/classes/:id` (`ADMIN|PROFESOR`)
- `DELETE /api/classes/:id` (`ADMIN|PROFESOR`)

### Calificaciones
- `POST /api/classes/:classId/grades` (`ADMIN|PROFESOR`)
- `GET /api/me/grades` (`USUARIO`)

### Progreso
- `POST /api/classes/:classId/complete` (`USUARIO`)
  - Marca clase completada y sincroniza estado de inscripcion (`ACTIVE` o `COMPLETED`).
- `GET /api/me/progress?courseId=:id` (`USUARIO`)
  - Retorna progreso por curso: clases completadas, porcentaje, promedio.
- `GET /api/me/overview` (`USUARIO`)
  - Retorna resumen para dashboard: cursos activos/finalizados, promedio global y detalle por curso.

## Logica de progreso

1. `progress` guarda completitud por (`class_id`, `student_id`).
2. `% progreso` = `completed_classes / total_classes * 100`.
3. Al completar una clase, se recalcula:
   - Si `completed_classes >= total_classes` y `total_classes > 0`: inscripcion `COMPLETED`.
   - En otro caso: `ACTIVE`.

## Logica de promedio

1. Promedio por curso:
   - `AVG(grades.grade)` filtrado por `student_id` y clases del `course_id`.
2. Promedio global dashboard:
   - Media de promedios por curso del estudiante con notas disponibles.

## Integracion con dashboard del estudiante

1. Consumir `GET /api/me/overview` para tarjetas/resumen:
   - `enrolledCourses`
   - `activeCourses`
   - `completedCourses`
   - `overallAverage`
2. Consumir `courses[]` de `overview` para listado de cursos:
   - categoria (`ARTE|MUSICA`)
   - progreso (%)
   - estado (`ACTIVE|COMPLETED`)
   - promedio del curso
3. Para detalle puntual de un curso, usar `GET /api/me/progress?courseId=:id`.
