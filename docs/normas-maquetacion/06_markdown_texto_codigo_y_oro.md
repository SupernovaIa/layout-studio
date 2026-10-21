# 06 · Markdown fuente, texto, listas, código, cuadros, test y estilo «oro»

> Cómo se escribe el material de origen (Markdown), cómo se maqueta el texto corrido, las listas, el código, los cuadros destacados, las fórmulas y los tests, y las normas del estilo «oro» de los `.docx` de Prometeo. Datos verificados contra el corpus real (1 160 unidades `.md` de Prometeo y 51 de Edentia, censo del 21-oct-2026).

## 6.1 Las dos familias de Markdown de unidad

| Familia | Dónde | Estructura |
|---|---|---|
| **Prometeo** (canónica) | Corpus de unidades de Prometeo (1 160 unidades) | `# Unidad N: …` + Objetivos + Introducción + secciones + cierre (Mini proyecto, Ejercicio, Resumen profesionalizante) |
| **Edentia** (Higiene bucodental) | Corpus de unidades de Edentia (51 unidades) | `# Unidad N: …` + párrafo de apertura + `# N. Sección` / `## N.N.` y un rótulo `####` sobre cada tabla. **Sin** Objetivos, Introducción, Mini proyecto, Ejercicio ni Resumen |
| **Sanipro** | — | **No consta** ningún `.md` de Sanipro en el corpus (solo paleta, plantillas y tests) |

### Estructura obligatoria del `.md` de una unidad (Prometeo)

```markdown
# Unidad N: Título
# Objetivos de la unidad
**Al finalizar esta unidad, serás capaz de:**
- (viñetas; nunca numeradas)
# Introducción
**Preguntas para reflexionar:**
- …
(párrafos)
# 1. Apartado
## 1.1. Subapartado
# Mini proyecto guiado
# Ejercicio
# Resumen profesionalizante
```

Frecuencia de los `#` en las 1 160 unidades: `# Unidad N:` 1 160 · `# Objetivos de la unidad` 1 160 · `# Introducción` 1 160 · `# Resumen profesionalizante` 1 160 · `# Ejercicio` 1 135 · `# Mini proyecto guiado` 1 071 · `# Ampliación y actualización` 381 · `# Tendencias y actualización` 53 · `# Ejercicios prácticos` 11 · `# Test de autoevaluación` 10 · `# Test` 1.

Reglas observadas:

1. **Secciones numeradas con H1** (`# 1. Título`) y **subsecciones con H2** (`## 1.1. Título`), con numeración manual y punto final.
2. Objetivos, Introducción y los cierres son H1 **sin número**.
3. La norma dice «máximo dos niveles, nunca `###`»; el corpus tiene `###`/`####` en 41 unidades de Prometeo y en 43 de las 51 de Edentia (como rótulo de tabla).
4. «Unidad» o «Tema»: **«Unidad»** salvo que el material original use «Tema» (véase [07](07_portadas_nombres_y_entrega.md)).
5. **No hay frontmatter** en ningún `.md` de unidad (0 de 1 160; 0 de 51). Los datos de módulo se leen de un `meta.json` aparte.

## 6.2 Texto corrido y listas

| Elemento | Convención | Notas |
|---|---|---|
| Énfasis | `**negrita**` para el término clave la **primera vez**; `*cursiva*` para extranjerismos y latinismos | Sin subrayado, sin color ni resaltador |
| Cabeceras fijas | `**Al finalizar esta unidad, serás capaz de:**` y `**Preguntas para reflexionar:**` | Líneas literales en negrita |
| Viñetas | `- texto`. En 313 unidades de Prometeo (y 49 de 51 de Edentia) van **separadas por una línea en blanco** (lista «suelta») | El maquetador debe tratar igual la lista pegada que la suelta |
| Numeradas | `1. texto`. **Cada lista reinicia en 1** | Regla explícita de la leyenda de formato y del motor oro |
| Mini proyecto | `- **Paso 1: Verbo…** texto` y una última línea `Entregable: …` | |
| Resumen | `Con este conocimiento, ahora estás preparado para:` + 8–10 viñetas en infinitivo | |
| Ejercicio | Enunciado + `Requisitos:` + 4–6 viñetas | |
| Enlaces | `[texto](url)`: solo 2 unidades de Prometeo | El renderizador de Layout Studio del repositorio público no los soportaba en origen; después se añadió soporte de hipervínculos |
| Fórmulas | **No se usan LaTeX** (0 en 1 160): van en prosa con `×`, `−`, `%` y negrita, o entre comillas invertidas | |
| Líneas en blanco | 536 unidades tienen 3 o más seguidas | Deben colapsarse a una |
| Regla horizontal | `---` solo como separador | En ningún caso como cabecera de metadatos |

Para el texto y las listas **de las diapositivas** véase [02](02_presentaciones.md#24-tamaños-de-letra): viñetas nativas, énfasis en negrita, frases ≤ 20 palabras, escribir al alumnado.

## 6.3 Bloques de código

### Norma de código (decidida el 21-oct-2026): estilo **Ayu Mirage** con botón de copiar en las salidas web

| Aspecto | Valor |
|---|---|
| **Estilo** | **Ayu Mirage** en **todos** los formatos: bloque de fondo oscuro `#1F2430`, esquinas suaves (radio 7 px) y sombra ligera |
| Texto base | `#CBCCC6` |
| Colores de sintaxis | Palabras clave `#FFA759` · tipos, funciones, atributos y etiquetas `#FFD580` · cadenas `#BAE67E` · escapes `#95E6CB` · números, constantes y operadores `#FFCC66` · comentarios `#5C6773` **en cursiva** · error `#FF3333` |
| Etiqueta del lenguaje | Arriba, en mayúsculas (`KOTLIN`, `XML`…): amarillo `#FFCC66`, Poppins 600, 10,5 px, `letter-spacing` 0,09 em (en diapositivas: `#5C6773`, 8 pt, a la derecha) |
| Tipografía | `JetBrains Mono` (web y PDF), `Consolas` o `Courier New` (Word y diapositivas); 8,4–13 pt según el formato |
| **Botón «Copiar»** | **Solo en las salidas web** (HTML de la plataforma y vista web de Layout Studio): arriba a la derecha del bloque, con icono de portapapeles y la etiqueta «Copiar»; al pulsar copia **todo el código** y pasa a «¡Copiado!» durante 1,6 s |
| **PDF, Word y diapositivas** | **No admiten un botón funcional de copiar** (los visores de PDF de los navegadores no ejecutan scripts y los programas de Office no tienen portapapeles programable). Se garantiza en cambio que el código es **texto real, seleccionable y con espacios normales** (nunca espacios duros ni imagen), de modo que al copiarlo y pegarlo en un editor **sigue siendo código válido** |
| Completo | Con sus etiquetas de apertura y cierre (XML/HTML), con sangría real y **sin captura de pantalla** |
| Sin lenguaje | Si se desconoce, la etiqueta pone «CÓDIGO» y el texto sale sin colores de sintaxis |

![Bloque de código Ayu Mirage con botón Copiar](img/componente_codigo_copiar.png)

*Figura 6.1. Componente web: etiqueta del lenguaje, botón «Copiar» y colores Ayu Mirage (Kotlin y XML).*

![Estado «¡Copiado!»](img/componente_codigo_copiado.png)

*Figura 6.2. Estado del botón después de pulsar.*

**Componente de referencia (HTML autocontenido, sin dependencias):** `layout_studio/componentes/bloque_codigo_ayu_mirage.html`. Se genera con `layout_studio/componentes/codigo_ayu.py` (`bloque_codigo(codigo, "kotlin")` devuelve el bloque; el botón usa `navigator.clipboard` y, si el navegador lo bloquea, un método alternativo con `execCommand('copy')`; es un `<button>` accesible con foco visible). Pensado para el editor HTML de la plataforma y para que Layout Studio lo incorpore a una salida web.

**Qué es posible en PDF y qué no.** Un botón verdaderamente funcional en un PDF solo existe en Adobe Acrobat/Reader (mediante un campo de formulario con JavaScript); **no funciona en Chrome, Edge, Safari ni en las vistas previas de la plataforma**. Por eso la norma no lo exige en PDF. Si hiciera falta en un material concreto, la alternativa es un **enlace junto al bloque** («Copiar el código») que abra la versión web del mismo bloque, donde sí está el botón.

### Resto de normas de código

| Aspecto | Valor |
|---|---|
| Sintaxis en el `.md` | Vallas ` ``` ` con el lenguaje (` ```bash `). En el corpus: `java` 657 · `bash` 273 · `js` 247 · `sql` 190 · `php` 179 · `html` 56 · `css` 42 · `xml` 35 · `powershell` 27 · `javascript` 26 · `yaml` 24. **Muchas vallas no llevan lenguaje**: la herramienta debe adivinarlo o pedirlo |
| Código en línea | Comillas invertidas simples; fondo `#F2F3F5` y texto `#1A1A1A` (o `#C7254E` en la leyenda de Prometeo) |
| **Trampa** | Dentro de una valla puede haber líneas que empiezan por `# ` (comentarios de Bash) o `$$` (SQL). **Un analizador que busque encabezados antes que vallas rompe la unidad**; hay que procesar las vallas primero |
| Diapositivas | Bloque monoespaciado **≥ 10 pt** (ideal 11–13), completo y con sangría (véase [02](02_presentaciones.md#28-código-y-esquemas)) |
| Word | Párrafos con estilo `Código` y sombreado `#1F2430` (véase [11](11_documentos_word.md#115-código-en-word)) |
| Código del estilo «oro» (`.docx` de temario) | Hoy: Consolas 10 pt, `#1A1A1A` sobre `#F2F3F5`, sin resaltado. **Debe pasar a Ayu Mirage** |

### Estado actual de los motores (qué cambia con la norma)

| Motor | Hoy | Con la norma Ayu Mirage |
|---|---|---|
| `renderizar_pdf_unidad.py` (temario Prometeo) | Fondo `#F5F5F5`, borde izquierdo `#888`, JetBrains Mono 9,5 px, sin resaltado | **Cambio pendiente** (el bloque `pre` y el resaltado con Pygments) |
| `plantilla_documento.py` (documento de apoyo) | Fondo `#F2F3F5`, borde izquierdo de acento, Menlo/Consolas 8,4 pt, sin resaltado | **Cambio pendiente**; ya admite el bloque `code` por API |
| `docx_marca.py` (Word) | **Ya en Ayu Mirage** | — |
| Diapositivas (constructor interno de diapositivas) | **Ya en Ayu Mirage** | — |
| Skill `maquetar-prometeo` (no oficial) | Ya en Ayu Mirage (Pygments) | Fuente del estilo |

## 6.4 Cuadros destacados (callouts)

La norma es **parca**: solo llevan caja **Objetivos** e **Introducción/Preguntas**. El resto son párrafos con una etiqueta inicial en negrita.

| Pieza | En el `.md` | Cómo se pinta |
|---|---|---|
| Objetivos | `# Objetivos de la unidad` + línea en negrita + viñetas | Caja crema `#FEFAF3`, borde izquierdo terracota 4 px, etiqueta «RESULTADOS DE APRENDIZAJE» |
| Introducción | `# Introducción` + `**Preguntas para reflexionar:**` | Misma caja, etiqueta «ACTIVACIÓN Y REFLEXIÓN»; la foto de portada va dentro, al final |
| Avisos, notas, «Importante» | Texto normal con etiqueta inicial en negrita: `**Importante.**` | Etiqueta de color, **sin caja** |
| Idea clave en documentos de apoyo | `> Idea clave: …` | Cuadro con barra lateral oscura (`plantilla_documento.py`) |
| «Copy to Claude» (Layout Studio) | `> **Etiqueta** ```` + valla | Caja etiquetada con el prompt literal |

Etiquetas de color en la skill `maquetar-prometeo`: `**Importante.**` en verde; `**Conclusión.**`, `**Nota.**` y `**Aviso.**` en terracota.

## 6.5 Test y soluciones

### Dentro del `.md` (antiguo; solo algunos módulos)

El test **ya no va en el `.md`** de la unidad: va aparte, en un `.xlsx` (6.7). Cuando aparece (10 unidades de Gestión Administrativa):

- Formato canónico (fijado el 16-ago): `**1. Enunciado completo en negrita**` seguido de las opciones **`a) …` `b) …` sin viñeta, cada una en un párrafo aparte**.
- Formatos antiguos que no valen: `**1.** enunciado` (solo el número en negrita) y `1. pregunta` con sublista `- A) …`.
- En el `.docx` oro: enunciado en negrita negra sin sangría; opciones `a) b) c) d)` normales, sin viñeta, sangría izquierda 0,63 cm.
- Solucionario: `# Soluciones — Unidad N: <título>` + `**1. Respuesta correcta: c) texto.**` + un párrafo de 50–90 palabras; en carpeta `Soluciones/` aparte.

### Quiz en Layout Studio

`**1.** ¿Pregunta?` seguido de una lista `- a) … - b) … - c) …` se colapsa en un bloque de quiz. **Desajuste con el corpus:** el corpus usa `**1. …**` + `a)` en párrafos, o `1. …` + `- A)`.

## 6.6 Marcadores de imagen y nombres de figura

Véase [04_imagenes](04_imagenes.md#42-colocación). Resumen: `![pie](Imágenes/CÓD-UNN-TIPOnn.png)` en línea propia; el texto alternativo es el pie. Nombres Prometeo `<CÓDIGO>-U<NN>-<TIPO><nn>.<ext>` con TIPO ∈ {ESQ, DIA, TAB, CAP, GRA, FOT}; Edentia `THB-L<n>-U<NN>-IMG<nn>.png`. Los marcadores `[CAPTURA/ESQUEMA/DIAGRAMA/TABLA…]` sin resolver se pintan en **rojo `#C00000`, negrita**; hoy no queda ninguno sin resolver en el corpus.

## 6.7 Tests `.xlsx` (Edentia, Sanipro; mismo modelo que Prometeo)

| Aspecto | Valor |
|---|---|
| Hoja | **Una sola**, llamada `Test_FP` (`A1:J91`) |
| Columnas (en este orden) | `Id` · `Question` · `Answer 1` · `Answer 2` · `Answer 3` · `Answer 4` · `Correct Answer` · `Answer Explain` · `UD` · `@` |
| Filas | 1 cabecera + **90 preguntas** (Id correlativo desde 1) |
| `Correct Answer` | El **texto idéntico** de una de las 4 respuestas (no la letra) |
| `UD` | Nº de unidad del libro de la que sale |
| `@` | Columna vacía (compatibilidad) |
| Formato de celda | **Ninguno**: sin negrita, relleno, anchos, ajuste de texto ni panel inmovilizado |
| Reparto | 4 unidades → 23·23·22·22 · 5 → 18 · 6 → 15 · 7 → 13×6 + 12 · 8 → 12·12·11×6 · 10 → 9 |
| Respuesta correcta | Repartida pareja entre las 4 posiciones (22–23 cada una), sin rachas de más de 2, y **no siempre la más larga** (objetivo ≤ 35 de 90) |
| `Answer Explain` | 480–655 caracteres; razona cada opción con «La primera/segunda/tercera/cuarta opción…» según la posición final y termina en `(UDn)`. Se **genera**, no se escribe a mano |
| Opciones | ±20 caracteres entre sí, 25–110 caracteres, paralelismo gramatical, sin «todas/ninguna de las anteriores» |
| Contenido | ≈ 50 % definiciones y ≈ 50 % casos prácticos; distractores = conceptos vecinos de la misma unidad |
| Fuente | **Todo sale del libro** de la asignatura. Hoja de fuentes aparte: carpeta `_FUENTES/<asignatura> - fuentes.xlsx` con hoja `Fuentes` (`Id · UD · Pregunta · Respuesta correcta · Páginas del libro · Cobertura de palabras · Revisar a mano`); cobertura < 0,75 → revisión manual |

## 6.8 Estilo «oro» de los `.docx` de Prometeo

Para temarios, MARCO NORMATIVO e ÍNDICE del profesor (motor `goldgen.py`, python-pptx/python-docx). **Es otro sistema distinto de los PDF Poppins**: no mezclar.

| Elemento | Valor |
|---|---|
| Página | **Carta/Letter 21,59 × 27,94 cm** (no A4); márgenes **2,54 cm** en los 4 lados |
| Cuerpo | Arial **12 pt**, negro `#000000`, justificado, interlineado sencillo, 0 pt antes / 6 pt después |
| Título | Arial 20 pt negrita, negro, centrado, 0/3 pt; formato directo (no estilo «Título») |
| Subtítulos | Arial 11 pt cursiva gris `#404040`, centrados (2 líneas: módulo y ciclo) |
| Caja azul (BOE, «→ Cubre:», «Fuente normativa:») | Párrafo con fondo `#EAF1FB`, texto `#2E75B6` cursiva 11 pt, sangría izquierda y derecha 6 pt, 8 pt antes y después |
| Nota editorial | «Nota editorial:» en negrita cursiva + texto en cursiva `#C0532A`, 12 pt, justificada, sin fondo; va **entre las dos cajas azules** |
| H1 | Arial 16 pt negrita (no cursiva), `#1F4E79`, 14 pt antes / 7 pt después |
| H2 | Arial 13 pt negrita, `#2E75B6`, 10 pt antes / 4,5 pt después |
| Marcadores de imagen | Arial 12 pt **negrita rojo `#C00000`** (no naranja); el naranja `#C0532A` es solo para la nota editorial |
| Código | Cada línea un párrafo; fondo `#F2F3F5`, Consolas 10 pt, `#1A1A1A`, sangría 6 pt, sin resaltado |
| Resumen | «Con este conocimiento…» en negrita 12 pt sobre banda `#EAF1FB`, sangría 6 pt, seguida de viñetas |
| Listas | Viñeta «•»: sangría 0,95 cm, francesa 0,53 cm, 3 pt después. Numeradas «1.» con la misma sangría; **cada lista nueva reinicia en 1** |
| Tablas (marco normativo e índice) | Borde `#CCCCCC` 0,5 pt; cabecera relleno `#D6E4F5` negrita 11 pt; fila TOTAL `#EAF1FB` negrita; celdas 11 pt; tabla centrada; enlaces `#1155CC` subrayado |
| Índice del profesor | `index_tema` negrita negra 12 pt (sangría 0,5 cm); `index_subtema` gris `#404040` 11,5 pt (sangría 1,3 cm) |

Paleta oro: cuerpo/título `#000000` · subtítulos `#404040` · H1 `#1F4E79` · H2 y texto de caja azul `#2E75B6` · fondo de caja y fila TOTAL `#EAF1FB` · cabecera de tabla `#D6E4F5` · nota editorial `#C0532A` · marcadores `#C00000` · código `#1A1A1A` sobre `#F2F3F5` · enlaces `#1155CC` · borde de tabla `#CCCCCC`.

Reglas de contenido del estilo oro: las cajas azules llevan «→ Cubre:» y «Fuente normativa:»; **«cubre» describe temas, nunca resultados de aprendizaje**; todo para la Comunidad de Madrid; el docx de unidad **convierte las tablas en marcador + prosa** (decisión del motor), solo las del marco normativo y el índice se pintan; salida a `./salida/` y validación con `validate.py` + render con `soffice` + `pdftoppm`.

### Tres hojas de estilo de Prometeo (no confundir)

| Documento | Página | Texto | Código |
|---|---|---|---|
| **Oro** (`goldgen.py`) | Letter, 2,54 cm | Arial 12; H1 16 `#1F4E79`; H2 13 `#2E75B6` | Consolas 10 |
| **Leyenda de formato** (mayo; destino Google Docs/InDesign) | A4, 1 pulgada | Arial 11; título 28; H1 18; H2 14 (todo negrita negro) | JetBrains Mono 10 sobre `#F5F5F5` con borde izquierdo `#888888` y colores IntelliJ Light |
| **PDF de unidad** (motor oficial) | A4; 2,2/3,1/2,2/2 cm | Poppins Light 11,5 px, justificado | JetBrains Mono 9,5 px, claro |

> **No consta** cuál de las tres prevalece para el caso «docx de temario». El estilo oro declara ser el canónico; el formato de test confirma que «manda `CLAUDE.md`» en tipografía.

## 6.9 Problemas típicos del Markdown de origen y su normalización

| Problema | Evidencia | Normalización conocida |
|---|---|---|
| El **formato nace en el `.docx`**, no en el `.md`; el volcado a texto plano pierde la negrita del enunciado del test | 810 documentos corregidos el 16-ago | Medir siempre en el `.docx`; reaplicar `**N. Enunciado**` tras regenerar |
| **Tablas perdidas** en el `.md` que existían en el `.docx` | script `repone_tablas.py` | Se reponen usando el docx como oráculo del orden; si el ancla no aparece, no se pone y se anota |
| **Vallas ``` perdidas** (órdenes de consola convertidas en prosa; 12 unidades) | `repone_vallas.py` | Toda línea en Consolas/JetBrains en el docx vuelve a un bloque de código, sin palabras nuevas |
| Word parte el texto en «runs»; un reemplazo ingenuo no encuentra nada | `arregla_docx_zar.py` | Buscar sobre el texto del párrafo y fusionar runs conservando el formato del primero |
| **Normativa o localidades de otra sede** (Madrid ↔ Aragón; códigos erróneos) | Instrucciones del proyecto | Corregir a Madrid: códigos 0623/0930/0931/1010; `BOE-A-2012-238` → `BOE-A-2011-19436`; 0929/150 h/Zaragoza → 0930/215 h/Madrid |
| Unidades con el «cuarteto» repetido por apartado (Caso de estudio · Herramientas y consejos · Mitos y realidades · Resumen final) | Normas de producción | Se elimina como sección; el contenido pasa a ejemplo/advertencia dentro del punto |
| **Resultados de aprendizaje (RA) en el material del alumno** | Normas de producción | Prohibido «RA1…»; el RA va solo en el índice del profesor |
| Marcadores `[CAPTURA/ESQUEMA/…]` sin imagen | Especificaciones | Rojo `#C00000`; sustituir por `![alt](Imágenes/…)` con la skill de capturas |
| Test sin clave o con clave desbalanceada | 892 preguntas sin clave en 22 módulos | Redistribuir y escribir el solucionario en la misma pasada |
| Formatos de test mezclados (691 / 64 / 55 variantes) | Referencia de formato canónico | Fijar `**N. Enunciado**` + `a)` en párrafos aparte |
| Cabecera de tabla en negrita redundante (758 unidades), listas sueltas (313), 3+ líneas en blanco (536), tabla sin rótulo en Prometeo y con `####` en Edentia | Censo del 21-oct | **No consta** normalización automática; el renderer de PDF no lo corrige |
| `#` dentro de vallas interpretados como encabezados | Ejemplo en una unidad de Programación (líneas 341–357) | Procesar las vallas antes que los encabezados |
| Marcador de conflicto de git (`>>>>>>>`) dentro de un `.md` | Una unidad de DAW | No verificado si es deliberado (ejemplo sobre control de versiones) |
| Figuras **verticales o estrechas** sin versión apaisada (78 en Higiene bucodental año 1) | Lista de pendientes | Se listan como pendientes; no se sustituyen si son ilustraciones del libro o fotos clínicas reales |
| Imágenes pesadas (> 20 MB) o con cuadrados negros | Normas | Redimensionar a 1 920 px, JPEG q ≈ 85–88; nunca subir > 20 MB |
| `Poppins Light` se exporta como Thin con LibreOffice | véase [01](01_marcas_paletas_tipografias.md#14-tipografía) | Cambiar a `Poppins` regular antes de exportar |
| Mezcla de «Unidad / Tema / Sesión / UT / UD» entre portada, archivo y listado | véase [07](07_portadas_nombres_y_entrega.md) | «Unidad» salvo que el original diga «Tema»; el mismo término en los tres sitios |
