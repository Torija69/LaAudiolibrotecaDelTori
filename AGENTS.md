# Reglas de LaAudiolibrotecaDelTori

## Antes de cambiar

Leer README, docs/spec.md, docs/decisiones.md y CHANGELOG. Consultar el catálogo ASDLC y reutilizar el kit Torija sin rediseñar otras aplicaciones.

## Seguridad y datos

- Solo modificar tablas con prefijo `audiolibroteca_`.
- Desde v1.3.2, todas las tablas y funciones de esta aplicación pertenecen al esquema exacto `"Audiobiblioteca"`. No crear tablas ni alias en `public`. La migración 05 fue una excepción de traslado expresamente autorizada; no reescribir las migraciones históricas.
- Leer el esquema real antes de migrar. Cambios aditivos; no destruir, renombrar ni truncar.
- Nunca usar `service_role`, secretos, contraseñas o sesiones en el frontend.
- Una clave publicable no sustituye RLS. Pruebas obligatorias para anónimo, autenticado no administrador y administrador.
- No publicar Excel, originales de importación, correo del administrador ni su UUID en Git.
- No crear usuarios, cambiar contraseñas ni configuración Auth compartida por iniciativa propia.
- No considerar a todos los autenticados administradores. Preservar la lista explícita de administradores.
- Todos los textos de usuarios deben escaparse; prohibido interpolar HTML sin `escapeHTML`.
- Notas de ficha públicas; originales y notas de importación privados.
- No añadir guardado local como sustituto de persistencia compartida.

## Producto y diseño

- Torija Taller: marfil, carbón, lima mate; Cabinet Grotesk y Satoshi locales.
- Iconos pequeños de libros, no emojis ni portadas falsas.
- Tipos desconocidos se muestran «Sin clasificar»; series desconocidas «Sin serie asignada».
- No deducir fechas, progreso de saga completa, narradores ni autores de créditos ambiguos.
- Fuentes verificables para nuevos metadatos; no tratar títulos sugeridos por IA como datos confirmados.

## Entrega

- Aprobación previa del usuario antes de trabajos con consumo de recursos.
- `npm run check`, pruebas de permisos, escritorio y 375 px.
- Revisar estado vacío, error de conexión, formularios, teclado y textos largos.
- No afirmar login real comprobado con la cuenta del propietario si solo se probó con mocks.
- Versionar, actualizar documentación, catálogo y dosier cuando corresponda.
- Publicar solo con autorización; conservar URLs existentes.
