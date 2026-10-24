# Changelog

## 1.3.0 · 2026-10-24

- Portada grande y cuadrada en la parte superior de cada tarjeta de la cuadrícula; icono de libro sobre fondo verde cuando no hay portada.
- Se elimina el orden «Orden del Excel»; el catálogo se ordena por título A–Z por defecto, sin tener en cuenta paréntesis ni signos (los Blackwater van en la B). El número de fila del Excel se sigue conservando para la trazabilidad del administrador.

## 1.2.0 · 2026-10-24

- Nuevo filtro público «Valoración» en «Más filtros»: todas, sin valorar o valorados. Se combina con el resto de filtros y se limpia al restablecerlos.

## 1.1.0 · 2026-10-24

- Portada por audiolibro: se sube desde el formulario, se reduce en el navegador a WebP (máx. 600×900 px, 1 MB) y se guarda en el bucket público `audiolibroteca-portadas`. Se puede cambiar o quitar; la imagen anterior se elimina.
- Resumen del libro y reseña personal, públicos, de hasta 5000 caracteres cada uno.
- Valoración de 1 a 5 estrellas o «Sin valorar», visible en tarjetas y fichas, y orden «Mejor valorados».
- Nueva función `audiolibroteca_save_book_v2` con las mismas protecciones: allowlist, RLS, conflicto de versión y duplicados.
- Solo el administrador puede subir o borrar portadas; los 70 audiolibros existentes se conservan.

## 1.0.0 · 2026-10-24

- Catálogo público con búsqueda, tipos, estados, ordenación y vista de series.
- 70 audiolibros importados, 9 series identificadas y originales privados conservados.
- Primera clasificación documentada de 31 títulos; 39 quedan sin clasificar.
- Alta y edición de administrador con Supabase Auth, lista de autorizados y RLS.
- Guardado atómico de libro, tipo y serie; protección de duplicados y conflictos.
- Diseño Torija Taller, fuentes locales e iconos de libros.
- GitHub Pages, CI, pruebas y documentación ASDLC.
- Integración en el catálogo de proyectos y el dosier de desarrollos.
