# Memoria de normas de maquetación · Prometeo, Edentia y Sanipro

**Versión:** 21 de octubre de 2026 · **Elaborada por:** Haridian Santana · **Para:** Layout Studio y para quien maquete material de profesorado.

Esta memoria reúne **todas las normas de maquetación** que hemos fijado y descubierto al maquetar presentaciones y documentos de las tres marcas: qué medidas tiene cada pieza, qué errores reales encontramos (76 catalogados), cómo se detectan y cómo se corrigen. Cada capítulo lleva **ejemplos visuales**: diagramas de anatomía con las medidas exactas de las plantillas oficiales, casos «antes → después» y paletas.

> **Regla de lectura:** lo que aparece aquí está leído de los archivos oficiales (plantillas `.pptx`, motores de maquetación, `paletas.json`) o de incidencias reales. Lo que no consta en ninguna fuente se dice «no consta»; nada se ha inventado. Las propuestas (por ejemplo, los `brand.json` para Layout Studio) están marcadas como propuesta.

## Mapa de la memoria

| Capítulo | Contenido | Ejemplos visuales |
|---|---|---|
| [01 · Marcas, paletas, tipografías y logos](01_marcas_paletas_tipografias.md) | Qué marca usar, colores oficiales y de las plantillas, contraste WCAG, Poppins Light → Thin, logos y su colocación, colores fuera de marca | Paletas de las 3 marcas |
| [02 · Presentaciones](02_presentaciones.md) | Lienzo 720 × 405 pt, los 8 tipos de diapositiva con **todas las medidas**, tamaños de letra, portada, imágenes, tablas, código, cierre, motor a usar y control de calidad | **8 diagramas de anatomía** de diapositivas |
| [03 · Documentos](03_documentos.md) | Documento de apoyo A4, anexos Word → PDF, **temario Prometeo por unidad**, hojas de ruta y componentes del Proyecto Intermodular | Anatomía de documento, portada, índice y cuerpo del temario; las 3 marcas |
| [04 · Imágenes](04_imagenes.md) | Proporción, resolución, transparencias, reescalado, colocación, capturas y esquemas dibujados | Mal frente a bien; casos reales |
| [05 · Tablas](05_tablas.md) | Colores por marca, cabecera, primera columna, partición, medidas | Tabla antes/después |
| [06 · Markdown, texto, código, cuadros, test y estilo «oro»](06_markdown_texto_codigo_y_oro.md) | Convención del `.md` de unidad (1 160 + 51 unidades), listas, código, callouts, tests `.xlsx`, estilo oro `.docx`, problemas del origen | — |
| [07 · Portadas, numeración, nombres y entrega](07_portadas_nombres_y_entrega.md) | Unidad/Tema/Sesión, nombres de archivo y de píldora, carpetas, formatos de entrega | — |
| [08 · Catálogo de problemas y casos visuales](08_catalogo_de_problemas.md) | **76 problemas** con síntoma, causa, detección, corrección y norma; decisiones pendientes | Casos A–G antes/después |
| [09 · Listas de comprobación](09_checklist_QA.md) | Listas por tipo de material, comandos y umbrales numéricos | — |
| [10 · Layout Studio para Javier](10_layout_studio_para_Javier.md) | Qué hace hoy la herramienta, diferencias con nuestras normas, `brand.json` propuestos, validaciones posibles | — |
| [11 · Documentos en Word y Google Docs](11_documentos_word.md) | **Marca de agua**, plantillas `.docx` por marca, estilos, código Ayu Mirage, tablas, descarga en PDF o Word | Word en las 3 marcas, anatomía |

## Ficheros de apoyo

| Ruta | Para qué |
|---|---|
| `reglas_maquetacion.json` | Reglas y medidas en formato máquina (paletas, geometría de la plantilla Prometeo, tamaños, umbrales, nombres, formato del test) |
| `plantillas_word/` | **Plantillas Word** (`plantilla_*.docx` vacías y `ejemplo_*.docx`) de las tres marcas, con marca de agua, cabecera, pie y estilos |
| `layout_studio/componentes/bloque_codigo_ayu_mirage.html` | Bloque de código Ayu Mirage con **botón «Copiar»** (HTML autocontenido) |
| `layout_studio/brands/{prometeo,edentia,sanipro}/brand.json` | **Propuesta** de marcas oficiales en el formato de Layout Studio (colores mapeados desde `paletas.json`) |
| `layout_studio/ejemplo/unidad_ejemplo_completo.md` (+ `Imágenes/`) | `.md` de prueba con todos los elementos del corpus real |
| `img/` | Imágenes de la memoria: `plantillas/` (render de las 25 diapositivas oficiales), `anatomia/` (con medidas), `documentos/`, `casos/` y las figuras sueltas |

## Las once normas que más errores evitan

1. **Marca según la asignatura** (Farmacia = Sanipro; Higiene bucodental y Prótesis = Edentia; informática y marketing = Prometeo) y **solo colores de la paleta**.
2. **Poppins en todo** en la plataforma (Light cuerpo, SemiBold negrita y títulos); nunca Calibri, Arial, Times ni Inter. Cuidado con «Poppins Light» → «Thin» en los PDF.
3. **Tamaños** en diapositivas: títulos 24–25 pt · cuerpo 12–14 · tarjetas y tablas 11–12 · etiquetas 10–10,5. Si no cabe, **dividir en dos diapositivas, nunca encoger**.
4. **Una idea por diapositiva**, con título único; ningún texto encima de otro texto ni fuera de su caja.
5. **Portada:** ciclo arriba · «Unidad N:» (Light) + nombre (SemiBold) a **38 pt** · asignatura en minúsculas · profesor · fecha `dd / mm / aaaa`; el mismo término («Unidad» salvo que el profesor use «Tema») en portada, archivo y listado.
6. **Imágenes:** proporción original (> 6 % de deformación es un error), ≥ 96 ppi, completas, del tema y con fuente; sin cuadrados negros; sin reescalado con IA si llevan rótulos.
7. **Tablas** nativas, con cabecera oscura, primera columna en negrita y los colores de la marca; ≥ 11 pt en diapositivas.
8. **El código es texto** en estilo **Ayu Mirage**: completo, monoespaciado, ≥ 10 pt, seleccionable y con **botón de copiar en las salidas web**; nunca captura.
9. **El acento (naranja, verde menta, azul claro) nunca es color de texto sobre blanco** (contraste 1,5–2,4); solo relleno o texto sobre fondo oscuro.
10. **Todo documento lleva marca de agua** y se descarga en **PDF y Word** (las presentaciones, en PPTX y PDF).
11. **Nunca inventar contenido**, **mirar cada página** renderizada y **comunicar todo lo que se añade**.

## Glosario

| Término | Significado |
|---|---|
| Kicker / eyebrow | Línea pequeña en mayúsculas encima de un título («TEMA 1 · EXPLICACIÓN») |
| Píldora | Etiqueta redondeada del tipo de diapositiva («CONCEPTO») |
| Cornisa | Texto vertical en el margen lateral del temario («UT 2 · 0489») |
| Callout | Cuadro destacado con etiqueta |
| `dark` / `mid` / `body` / `card` / `line` / `accent` / `zebra` | Los siete colores de cada marca en `paletas.json` |
| ppi | Píxeles por pulgada efectivos de una imagen colocada |
| WCAG | Estándar de accesibilidad; el contraste mínimo recomendado es 4,5 |
| Thin | Peso «fino» de Poppins que sustituye por error a «Light» al exportar con LibreOffice |
| Motor | Script que genera el material (`rebuild_deck.py`, `renderizar_pdf_unidad.py`, `plantilla_documento.py`…) |
| UT / UD | Unidad de trabajo / unidad didáctica: se normaliza a «Unidad» |

## Cómo se ha elaborado y qué falta

- **Fuentes leídas:** plantillas `.pptx` oficiales (medidas por forma, 25 diapositivas), 7 motores y skills de maquetación (código y CSS literal), documentos de feedback a profesorado, la memoria de errores y decisiones del equipo, 1 160 + 51 `.md` de unidad (censo), y el código y la documentación de este repositorio y de la herramienta desplegada.
- **Todos los casos sin nombres de profesores:** se numeran como «caso».
- **Decisiones pendientes** (resumidas en [08 §8.9](08_catalogo_de_problemas.md#89-contradicciones-y-lagunas-detectadas-decisiones-pendientes)): qué hoja de estilo rige cada salida de Prometeo, paletas distintas en motores y herramienta, tamaño de portada y cuerpo mínimo en los motores de reconstrucción, formato de quiz, cierre por plantilla.
- **No constan:** `.md` de Sanipro en el corpus, motor de documentos para thePower/BePharma/Tecnio, y la especificación de las hojas de ruta de Sanipro y Edentia más allá del código.
- **No verificado por mí:** el resultado visual de Layout Studio al descargar (solo se comprobó que genera el PDF y cómo construye el índice); el comportamiento del pie de imagen y de las tablas en esa herramienta.
