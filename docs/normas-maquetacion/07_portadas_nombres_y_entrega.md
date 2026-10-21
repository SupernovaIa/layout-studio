# 07 · Portadas, numeración, nombres de archivo y entrega

> Cómo se numera una unidad, cómo se titula cada pieza, cómo se llaman los archivos y las carpetas, qué formatos se entregan y qué ve la plataforma. Todo lo que sigue está ya fijado por decisiones reales.

## 7.1 «Unidad», «Tema» o «Sesión»

1. El material usa **«Unidad N»** siempre, **salvo que el profesor use «Tema»** (u otro término) en su propio material. Entonces se respeta «Tema» (o «Sesión»).
2. **El mismo término en tres sitios**: en la **portada**, en el **nombre del archivo** y en el **listado de subida** (nombre de la presentación). No se mezclan («decídete: o unidad o tema»).
3. **El número es el real de la unidad**, no un contador de orden. Si un archivo no trae número real, el nombre va sin número; no se inventan unidades.
4. En el material de datos (`UT`, `UD`, «Sesión») se normaliza al término decidido antes de publicar.
5. Las unidades de un módulo se numeran desde 1; el título del `.md` es completo: «Unidad 2: El argumentario de ventas y la red comercial».

## 7.2 Portada: una por formato

| Formato | Qué lleva la portada | Fuente de los datos |
|---|---|---|
| **Presentación** | Ciclo · «Unidad N: nombre» a 38 pt · asignatura · curso · duración · profesor/a · fecha `dd / mm / aaaa` | Véase [02](02_presentaciones.md#25-la-portada) |
| **Temario PDF por unidad** (Prometeo) | Marca «PROMETEO · by thePower» · kicker «ASIGNATURA · SIGLA DEL CICLO» · título de la unidad (30 px) | Primera línea `# Unidad N: …` del `.md` y los argumentos de la línea de comandos |
| **Documento de apoyo** | Píldora de tipo + título + subtítulo + metadatos «Profesor/a · Módulo · Curso» en la primera página | Argumentos de `render()` |
| **Anexo de profesor en Word** | Título (primer párrafo en negrita o `Heading` de menos de 160 caracteres), subtítulo y regla | El propio `.docx` |
| **Hoja de ruta** | Sin portada aparte: ciclo + logo + nombre de asignatura + «Conoce los objetivos de la asignatura» | Datos de la asignatura |
| **Estilo oro `.docx`** | Título 20 pt centrado + 2 subtítulos (módulo y ciclo) + cajas azules | `meta.json` aparte |

Reglas comunes:

1. **El nombre del profesor/a es el que firma** (con su diminutivo si firma así).
2. **La asignatura nunca va en mayúsculas** (sí el kicker o etiqueta).
3. **Sin correo electrónico** ni «Curso 2026/27» en lugar de la fecha.
4. **La portada es texto editable**, no una imagen.
5. **El cierre** en presentaciones es «¿Preguntas?» sin número suelto; en los PDF de unidad no hay cierre ni contraportada.

## 7.3 Nombres en la plataforma (Studio)

| Qué | Nombre | Dónde |
|---|---|---|
| Presentación | **«Presentación Unidad N»**, «Presentación Tema N» o «Presentación Sesión N» (y nada más) | Carpeta **«Recursos extras»** de la asignatura |
| Anexos y actividades | Se escriben igual de cortos: p. ej. «Apuntes Unidad 1» | «Recursos extras» |
| Ejercicios resueltos | «Presentación Sesión N — Actividades resueltas» (decisión previa; revisar si sigue vigente con la regla del nombre corto) | «Recursos extras» |

- **Nunca**: «— título del tema» detrás, número de orden de archivo, ni «Anexo» para una presentación.
- Si un profesor entrega varias presentaciones de la misma unidad, **no se duplica el mismo nombre**: se distinguen con una etiqueta corta entre paréntesis, por ejemplo «Presentación Unidad 1 (Ciclo de vida)», hasta que el profesor confirme si son partes o versiones.
- Los nombres de píldora van **sin** «— título» y sin tildes en el archivo (véase 7.4).

## 7.4 Nombres de archivo

| Tipo | Patrón | Notas |
|---|---|---|
| PDF de presentación | `<ASIGNATURA>_Presentacion_Unidad_<N>.pdf` | **Corto, sin tildes, rayas ni comas.** Un mismo contenido puede no abrir en la plataforma con un nombre largo o con símbolos (el nombre va en la URL del CDN): probar a renombrar, no a tocar el contenido |
| Presentaciones renombradas (solo algunos casos) | `Marca · Ciclo · Asignatura · NN — Título` | El `NN` es un contador de orden, **no** un número de unidad |
| Imágenes de unidad Prometeo | `<CÓDIGO>-U<NN>-<TIPO><nn>.<ext>` (TIPO: `ESQ`, `DIA`, `TAB`, `CAP`, `GRA`, `FOT`) | Ej.: `0369-U04-CAP01.png`; código de módulo: `1109`, `0373`, `1709`, `0623`, `MPOII-CMO312`… |
| Imágenes de unidad Edentia | `THB-L<n>-U<NN>-IMG<nn>.png` | Significado exacto de `THB` y `L<n>` sin documentar |
| Foto de portada de unidad | `<CÓDIGO>-U<NN>-portada.jpg` | 1 920 px de ancho, JPEG q ≈ 85–88; nunca > 20 MB |
| Documentos oro | `<código> - MARCO NORMATIVO - <asignatura>.docx` e igual para `ÍNDICE` | Carpeta `salida/` |
| SCORM | `<asignatura-slug>-unidad-N-scorm.zip` | Slug sin tildes ni «ñ»/«ó» (`gestio-n-administrativa-…`) |
| Tests | `<asignatura>.xlsx` (hoja `Test_FP`) y `_FUENTES/<asignatura> - fuentes.xlsx` | Véase [06](06_markdown_texto_codigo_y_oro.md#67-tests-xlsx-edentia-sanipro-mismo-modelo-que-prometeo) |
| Capturas | `CÓDIGO-Uxx-TIPOnn.png` | Véase [04](04_imagenes.md#47-capturas-y-esquemas-dibujados-skills-capturas-prometeo-y-capturas-sanipro) |

**Acentos y `ñ`:** en los nombres de carpetas (`Imágenes`, `Año`) se comparan con normalización Unicode NFC; cualquier herramienta debe tratar NFC y NFD como iguales (en el corpus actual no hay nombres NFD).

## 7.5 Carpetas

### Del material de unidad (Markdown)

```
<MARCA|SEDE>/Año <N>/<CICLO>/<Asignatura> - Unidad <K>/
    Unidad <K>: <Título>/<p>. Unidad <K>: <Título>/
        Unidad <K>: <Título>.md
        Imágenes/<CÓD>-U<KK>-<TIPO><nn>.png
```

- `<p>` es «1» en 1 070 de las 1 160 unidades de Prometeo y «K» en 90 (no consta la razón); en Edentia siempre «1.».
- Las asignaturas transversales compartidas llevan sufijo de ciclo: «… - CI - Unidad K», «… - MKT - Unidad K», «… - DAM - Unidad K», «… - ASIR - Unidad K».
- En Zaragoza: carpetas por ciclo + código de módulo (`DAM · IFC302`, `MKT · COM304`, `SMR · IFC201`).


### De la entrega por formato (Prometeo)

Dos entregas (Madrid y Zaragoza) × cuatro formatos, **una unidad = un fichero**: `1 · Markdown` · `2 · Markdown e imágenes` · `3 · PDF` · `4 · SCORM`. Recomendación: SCORM si la plataforma lo acepta; si no, PDF. El Markdown es «para editar, no para el alumno». En `5. SUBIR`: `00 - Unidad 0…zip`, `01 - Unidad 1.zip`, `02 - Unidad 1 - PDF.pdf`… (impar = SCORM, par = PDF).


## 7.6 Formato de entrega de presentaciones

1. **PDF para lo estático; `.pptx` si hay animaciones** que ocultan contenido (la plataforma acepta pptx con animaciones).
2. **Los PDF de los profesores también se maquetan** en la plantilla de marca. Los **documentos** se descargan en **PDF y Word (`.docx`)**; las presentaciones, en **PPTX y PDF**.
3. Lo ya subido sin fallo **no se rehace**; solo lo que está «muy mal».
4. El archivo es **liviano** (recomprimir imágenes si es necesario) y **editable** (portada y cierre en texto).
5. Se entrega junto con un **listado «para copiar y pegar»** por asignatura: «Carpeta: Recursos extras» · «Nombre de las Presentaciones: Presentación Unidad 2.2 / Tema 1 / Sesión 1…» · datos generales (correo, ciclo, asignatura, curso, año) y una línea por archivo.
