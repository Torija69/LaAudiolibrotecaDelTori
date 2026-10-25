# Flujos y aceptación de la migración

## Catálogo público
- Abrir la web: 74 audiolibros y 9 series en la revisión previa.
- Buscar por título; combinar tipo, serie, estado y valoración; limpiar filtros.
- Cambiar orden y alternar audiolibros/agrupación por series.
- Abrir ficha, comprobar portada, resumen, reseña y estrellas cuando existan.
- Entrar en Series, desplegar una serie y abrir una ficha.
- Abrir Administrar, comprobar formulario y cerrarlo sin iniciar sesión.
- Buscar un título inexistente y comprobar el estado vacío.
- Simular fallo de conexión y comprobar error y reintento.
- Comprobar escritorio, móvil de 375 px y consola.

## Administración y persistencia
- Probar en SQL roles anónimo, autenticado no administrador y administrador.
- Guardar mediante RPC en transacción con ROLLBACK: no dejar datos de prueba.
- Comprobar políticas Storage referenciando la función trasladada.
- No afirmar prueba de login real o subida desde la cuenta del propietario.

## Cambio solicitado
- Cinco tablas y cuatro funciones en el esquema exacto "Audiobiblioteca".
- Ninguna tabla audiolibroteca_ permanece en public.
- Mismos OID, filas, contenido, permisos, políticas, relaciones y triggers.
- Cliente: Accept-Profile y Content-Profile Audiobiblioteca, incluidas RPC
  y lectura de originales.
- Dieta permanece en public y sus objetos no se modifican.
- Verificar GitHub Pages publicado y vista previa en contexto nuevo.
- Las pestañas antiguas deben recargarse tras la migración; no hay alias en public.
