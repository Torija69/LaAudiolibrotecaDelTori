# Especificación

## Propósito y alcance

LaAudiolibrotecaDelTori conserva una colección de audiolibros escuchados, consultable desde cualquier dispositivo. No distribuye audio ni requiere cuenta para navegar.

## Requisitos

| Área | Criterio de aceptación |
|---|---|
| Identidad | Nombre LaAudiolibrotecaDelTori; diseño Torija aprobado e iconos pequeños de libros |
| Importación | 70 registros del Excel, sin duplicación; originales recuperables por el administrador |
| Consulta | Búsqueda insensible a tildes y mayúsculas por título, créditos o serie |
| Tipos | Filtros públicos por tipo, con «Sin clasificar» para valores no confirmados |
| Valoración | Filtro público por valoración: todas, sin valorar o valorados (v1.2.0) |
| Series | Agrupación y orden numérico; precuela diferenciada; sin inferir integridad de una saga |
| Alta y edición | Correo y contraseña; solo el administrador autorizado puede escribir |
| Creación de categorías | Nuevo tipo o serie desde el formulario; guardado atómico |
| Validación | Obligatorios, límites de longitud, número no negativo, duplicado exacto |
| Concurrencia | No sobrescribir silenciosamente una ficha que cambió desde su apertura |
| Portada, resumen y reseña | Imagen opcional por ficha (subir, cambiar, quitar); resumen y reseña públicos de hasta 5000 caracteres |
| Valoración | 1 a 5 estrellas o sin valorar; visible en tarjeta y ficha; orden «Mejor valorados» |
| Error | Mensaje y reintento al fallar la carga; no datos ficticios de sustitución |
| Infraestructura | Repositorio público autorizado, GitHub Pages, Supabase existente aislado por tablas y RLS |
| Integración | Documentación ASDLC, catálogo y ficha del dosier |

## Modelo de datos

Todas las tablas y funciones siguientes residen en el esquema exacto `"Audiobiblioteca"` desde v1.3.2. `public` no contiene tablas de esta aplicación y sigue disponible para otras aplicaciones.

- `audiolibroteca_books` (v1.1.0 añade `summary`, `review`, `rating` y `cover_path`): título, créditos, tipo, serie y orden, etiqueta, estado, plataforma, notas públicas, marca de revisión, fuentes de metadatos, número de Excel y fechas técnicas.
- `audiolibroteca_genres`: tipos editables mediante alta de fichas.
- `audiolibroteca_series`: series y URL de referencia.
- `audiolibroteca_admins`: lista de usuarios autorizados, sin permisos API de autoalta.
- `audiolibroteca_imports`: literales y fila original, con observaciones privadas de importación.

Los `created_at` y `updated_at` son fechas técnicas, no fechas de escucha. Los créditos combinados del Excel no se separan automáticamente en autor, traductor y narrador.

## Fuera de alcance

Reproducción o almacenamiento de audio, compra de audiolibros, catálogo externo automático, cuentas abiertas, recomendaciones IA, borrado y clasificación bibliográfica exhaustiva. Los campos pendientes pueden completarse desde la administración.
