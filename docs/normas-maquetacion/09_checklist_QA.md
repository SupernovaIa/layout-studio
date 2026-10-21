# 09 · Listas de comprobación y control de calidad

> Listas para comprobar un material antes de entregarlo o publicarlo, con los comandos y umbrales que ya usamos. Sirven tanto para una persona como para convertirlas en validaciones automáticas.

## 9.1 Principios

1. **Mirar, no suponer.** Renderizar y mirar cada página; nunca dar por bueno algo solo por la miniatura o por una muestra.
2. **Cambiar lo mínimo.** Lo que ya está bien y publicado no se rehace.
3. **Nunca inventar contenido.** Si algo está cortado o dudoso, se deja y se marca para preguntar.
4. **Todo lo que se añade se comunica** (etiquetas, títulos nuevos, texto transcrito de una imagen).
5. **Auditar siempre el original**, no la versión que uno mismo ha maquetado.

## 9.2 Presentación (`.pptx` o PDF de diapositivas)

**Antes de empezar**

- [ ] Renderizar la **página 1 y varias intermedias**: ¿ya viene en plantilla oficial? Si sí, solo QA.
- [ ] Marca correcta para la asignatura (Farmacia = Sanipro; Higiene bucodental y Prótesis = Edentia; informática y marketing = Prometeo).
- [ ] Original guardado en `ORIGINAL - sin corregir/`; trabajo en copia con otro nombre.

**Texto**

- [ ] Poppins en todo (Light cuerpo, SemiBold negrita y títulos); código en monoespaciada.
- [ ] Tamaños: títulos 24–25 · cuerpo 12–14 · tarjetas y tablas 11–12 · etiquetas y pies 10–10,5 · código ≥ 10 pt.
- [ ] Ninguna diapositiva con más del 25 % del texto por debajo de 9,5 pt.
- [ ] Una idea por diapositiva; títulos únicos; «(1/2)» y «(2/2)» si se parte.
- [ ] Sin texto encima de otro texto ni fuera de su caja; revisado en vista de presentación.
- [ ] Viñetas nativas, sin tabuladores ni espacios; sin cursiva dominante ni resaltador; énfasis en negrita en palabras completas.
- [ ] Títulos interrogativos con «¿…?».
- [ ] Sin párrafos vacíos, puntos sueltos ni diapositivas casi vacías.
- [ ] Sin notas internas, instrucciones a una IA ni «justificación para el profesor».
- [ ] Enlaces en una palabra; vídeos con enlace visible.
- [ ] Ortografía comprobada con hunspell y revisada en contexto.

**Portada y cierre**

- [ ] Ciclo arriba (nunca «PLANTILLA DE CLASE»); «Unidad N: nombre» a 38 pt (Light + SemiBold); asignatura en minúsculas; profesor (como firma); fecha `dd / mm / aaaa`; sin correo.
- [ ] «Unidad» o «Tema»: el mismo término en portada, nombre de archivo y listado.
- [ ] Cierre «¿Preguntas?» sin número suelto; portada y cierre como texto editable.
- [ ] Ningún campo de plantilla sin rellenar («__ minutos», «Sustituye por tu fotografía», «Pie de foto»).

**Imágenes y tablas**

- [ ] Imágenes completas, del tema y con fuente; proporción original (deformación ≤ 6 %); ≥ 96 ppi.
- [ ] Sin cuadrados negros; sin imágenes solapadas; contar y comparar con el original.
- [ ] Imágenes con rótulos: **no** reescaladas con IA.
- [ ] Tablas nativas con la paleta de la marca, dentro de su tarjeta, ≥ 11 pt; una por diapositiva.
- [ ] Logo con su proporción en todas las diapositivas.

**Colores y exportación**

- [ ] Solo colores de la paleta de la marca; detector de píxeles verdes en el PDF sin avisos.
- [ ] Sin texto «Thin» en el PDF.
- [ ] Si hay animaciones que ocultan contenido: entregar `.pptx`.
- [ ] Peso razonable (recomprimir imágenes si la plataforma no acepta el archivo).

**Entrega**

- [ ] Nombre en la plataforma: «Presentación Unidad/Tema/Sesión N», en «Recursos extras».
- [ ] Diff de texto origen/salida: **0 palabras perdidas**.
- [ ] Decisiones propias comunicadas al profesor.

### Comandos útiles

```bash
# Renderizar a PDF y a imágenes para mirar cada diapositiva
soffice --headless --convert-to pdf --outdir salida/ archivo.pptx
pdftoppm -jpeg -r 100 salida/archivo.pdf salida/p

# Ortografía (diccionario de LibreOffice)
hunspell -d /Applications/LibreOffice.app/Contents/Resources/extensions/dict-es/es_ES -l texto.txt

# Poppins Light -> Thin: corregir antes de exportar
python3 scripts/plantilla_oro/fix_poppins_weights.py entrada.pdf salida.pdf
```

Si LibreOffice no abre un `.pptx` generado por una herramienta externa (por ejemplo, metadatos de la librería de Python en lugar de PowerPoint o Google Slides y «0 diapositivas» declaradas), guardarlo de nuevo con la librería python-pptx suele repararlo para poder renderizarlo.

## 9.3 Documento PDF o Word (apoyo, anexo, hoja de ruta, temario)

- [ ] Marca correcta; página A4; márgenes del motor; pie «Página n de N» (documentos de apoyo y anexos).
- [ ] Título, subtítulo y metadatos; apartados numerados hasta dos niveles.
- [ ] Un cuadro destacado por idea que no deba pasarse por alto; etiqueta corta.
- [ ] Tablas: cabecera oscura con texto blanco, primera columna en negrita, cabecera repetida, ninguna fila partida, texto dentro de las celdas.
- [ ] Listas con viñeta de acento y números en círculo.
- [ ] Imágenes con ruta `Imágenes/…` (temario) y pie; ninguna con transparencia negra.
- [ ] Código completo, **estilo Ayu Mirage** (fondo `#1F2430`), monoespaciado, sin salirse del recuadro y como **texto seleccionable con espacios normales**.
- [ ] Botón «Copiar» en el código de las salidas **web** (no existe en PDF/Word).
- [ ] **Marca de agua** (logo tenue, centrado, detrás del texto) en todas las páginas.
- [ ] Disponible en **PDF y Word** (`.docx`) si es un documento.
- [ ] Sin títulos huérfanos al final de página (comprobar a mano: algunos motores no lo evitan).
- [ ] Logo y marca de agua visibles en todas las páginas (documentos de apoyo y anexos).
- [ ] Marcadores `[CAPTURA/ESQUEMA/DIAGRAMA/TABLA…]` sin resolver: ninguno (si queda, sale en rojo).
- [ ] Índice con números de página reales (temario) y coherente con los `#`/`##` del `.md`.
- [ ] Texto no cambiado respecto al origen (los motores no tocan el contenido).

Para un `.docx` hay una lista específica en [11 §11.10](11_documentos_word.md#1110-comprobación-antes-de-entregar-un-docx).

## 9.4 Markdown de origen

- [ ] Primera línea `# Unidad N: Título`.
- [ ] Orden: Objetivos → Introducción → secciones `# N.` con `## N.N.` → cierres.
- [ ] Objetivos: `**Al finalizar esta unidad, serás capaz de:**` + viñetas (no numeradas).
- [ ] Introducción: `**Preguntas para reflexionar:**` + viñetas.
- [ ] Vallas ` ``` ` con **lenguaje** y cerradas; `#` dentro de una valla es código, no un título.
- [ ] Tablas con fila separadora; **cabeceras sin negrita** (el motor ya las pone); sin celdas multilínea.
- [ ] Imágenes en línea propia: `![pie descriptivo](Imágenes/CÓD-UNN-TIPOnn.png)` y el archivo existe.
- [ ] Sin marcadores `[CAPTURA: …]` sin resolver.
- [ ] Listas: formato uniforme (todas pegadas o todas sueltas); máximo un nivel de anidado.
- [ ] Máximo una línea en blanco seguida.
- [ ] Sin RA (resultados de aprendizaje) en el material del alumno.
- [ ] Normativa y localidades de la sede correcta (Madrid).
- [ ] Nombre de carpeta y de archivo con la convención; `Imágenes` y `Año` con tilde normalizada (NFC).

## 9.5 Imágenes

- [ ] Original disponible (no captura).
- [ ] Proporción original; ≥ 96 ppi (ideal ≥ 150); JPEG q ≈ 86 / PNG con transparencia aplanada; máx. 1 500–1 920 px; < 20 MB.
- [ ] Con rótulos: sin pasar por reescalado de IA.
- [ ] Pie de figura descriptivo y fuente si no es propia.
- [ ] Capturas dibujadas: sin degradados, sombras, esquinas redondeadas ni emojis; texto dentro de su caja; nada inventado.

## 9.6 Tests `.xlsx`

- [ ] Hoja única `Test_FP`; columnas `Id · Question · Answer 1–4 · Correct Answer · Answer Explain · UD · @`.
- [ ] 90 preguntas; `Correct Answer` = texto idéntico de una respuesta.
- [ ] Respuesta correcta repartida pareja (22–23 por posición), sin rachas > 2, no siempre la más larga.
- [ ] `Answer Explain` de 480–655 caracteres, termina en `(UDn)`.
- [ ] Todo sale del libro; hoja de fuentes con cobertura ≥ 0,75 (o revisión manual).
- [ ] Sin formato de celda; archivo validado al guardarse.

## 9.7 Umbrales numéricos de referencia

| Qué | Umbral |
|---|---|
| Imagen deformada | > 6 % de diferencia de proporción |
| Imagen de baja resolución | < 96 ppi efectivos |
| Letra pequeña (aviso) | < 9,6 pt; alarma: > 25 % del texto por debajo de 9,5 pt; «7 de cada 10 caracteres < 8 pt» es grave |
| Texto «Thin» en PDF | spans con «Thin» ≥ 9 pt; afectado si > 45 % del texto |
| Verde fuera de marca | `g > 100`, `g > r + 25`, `g > b + 25` a 30 dpi; aviso si la media supera 0,002 de la página |
| Contraste de texto | < 4,5 (texto normal) o < 3 (texto grande) = fallo |
| Archivo pesado | > 15–20 MB: recomprimir (PNG > 60 KB → JPG 84 %, máx. 1 600 px) |
| Fotos que faltan | comparar con `comprobar_fotos.py` (hash 8 × 8 sobre imágenes ≥ 3 % de la página) |
| Cobertura de fuentes del test | ≥ 0,75 |
| Longitud de la explicación de un test | 480–655 caracteres |
| Longitud de título de diapositiva | ≤ 40 car. → 22 pt · ≤ 56 → 18 · ≤ 66 → 16 · más → 14 |
