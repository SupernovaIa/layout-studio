# 08 · Catálogo de problemas de maquetación y casos visuales

> 76 problemas reales de maquetación encontrados entre septiembre y octubre de 2026 en presentaciones, documentos y entregas de profesorado, con su causa, cómo se detecta, cómo se corrige y la norma que se deriva. Los casos no llevan nombre de profesor. Después, ejemplos visuales «antes → después» tomados de materiales reales.

## 8.0 Cómo leer el catálogo

- **ID**: `T` texto · `I` imágenes · `TB` tablas · `C` colores · `P` portadas · `E` estructura · `F` formato de entrega y exportación.
- **Detección**: la herramienta y el umbral que permiten comprobarlo automáticamente (útil para convertirlo en una validación).
- **Norma**: la regla que se aplica desde entonces.
- Siglas de herramientas internas: `RS` = `restyle_deck.py` (parche conservador) · `RD` = `rebuild_deck.py` (reconstrucción) · `P2P` = `pdf_to_pptx.py` · `FPW` = `fix_poppins_weights.py` · `NF` = `normalize_fonts.py` · `QA` = `qa_deck.py`.
- Frecuencia aproximada de los temas en 24 feedbacks revisados: portada ≈ 19 · letra y tamaño ≈ 18 · colores/paleta ≈ 16 · Poppins ≈ 14 · cierre «¿Preguntas?» ≈ 14 · viñetas escritas a mano ≈ 5 · campos sin rellenar ≈ 5 · solapes ≈ 3 · cursiva 2 · Thin 1.

### 8.1 TEXTO: tamaño, tipografía, estilo, ortografía

| ID | Síntoma | Causa | Detección | Corrección | Norma |
|---|---|---|---|---|---|
| T01 | Letra diminuta (5,6–10 pt) en tarjetas, tablas, pies, enlaces y código; mediana 7,9–10 pt; hasta 72 % del texto <8 pt | Originales con autofit/exceso de texto, diapositivas 960 pt, tarjetas con espacio de sobra | python-pptx: tamaño efectivo de cada run (×0,75 si 960 pt); PyMuPDF spans `size`; recuadros naranja si `size < 9,6` (script feedback c5) | Subir a rango; si no cabe, DIVIDIR en dos diapositivas (no encoger). Motor: `chunk()` prueba 14,5→11,5 pt y reparte por frases (`fine_blocks`, ≥12 pt al dividir); `ampliar.py` sube ≤11 pt a 12 pt solo si cabe en su tarjeta | Mínimos/máximos: títulos 24–25 · cuerpo y listas 12–14 · tarjetas/tablas/esquemas 11–12 · etiquetas y pies 10–10,5 · código ≥10 (ideal 11–13 Consolas/Courier) |
| T02 | Tarjetas enormes con 1–3 líneas de letra pequeña en la parte alta («tarjetas vacías») | Texto no escalado a la tarjeta | Visual + cociente texto/caja; RS `fit_text`: si `need < 0,5·h` | Subir la letra hasta ~16 pt (factor ≤1,6, solo si f>1,08 y máx. <15 pt actual) o repartir mejor el contenido | Aprovechar el espacio: letra grande antes que tarjeta vacía |
| T03 | Texto desbordado, cortado al borde o frases truncadas a mitad de palabra («de la s…») | Exportes de Canva/Google con cajas fijas; texto > caja | Render (soffice+pdftoppm -r 100) de CADA diapositiva; RS/NF estiman altura (`est_h`: ancho car. = 0,56·pt, interlínea 1,2) | Reducir hasta factor mín. 0,72 (suelo 8 pt) o crecer la caja si no tiene fondo; si el original está cortado NO se inventa: se completa solo por contexto y se confirma con el profesor (⚠) | Todo el texto dentro de su caja; nada pegado al borde; límite inferior de contenido 0,93·alto |
| T04 | Texto encima de texto (título de 2 líneas pisa subtítulo/eyebrow; etiquetas de esquema montadas) | Caja que no crece al partirse el título | Render por diapositiva; revisar en «vista de presentación» | Acortar título o dejar más alto; título 16–23 pt según longitud y caja más ancha (`title_size`: ≤40 car.→22, ≤56→18, ≤66→16, resto 14) | Una línea de título; etiquetas fuera de las imágenes (pie de figura) |
| T05 | Poppins Light sale **Thin** en el PDF (cuerpo gris casi ilegible), ~30 PDF | LibreOffice/macOS exporta «Poppins Light» como Poppins-Thin | PyMuPDF: spans con `"Thin" in font` y size ≥9; >45 % del texto en Thin = afectado | (a) Antes de exportar: typeface `Poppins Light/Thin` → `Poppins` en latin/ea/cs/sym/buFont; (b) a posteriori: `fix_poppins_weights.py` reescribe a nivel de carácter Thin→Light (`~/Library/Fonts/Poppins-Light.otf`) y verifica multiconjunto de caracteres por página (strict) | Nunca entregar un PDF con spans Thin; verificar texto idéntico antes/después |
| T06 | Tablas nuevas en Poppins Regular se ven más pesadas que el resto en Light | Mezcla de pesos para evitar Thin | Visual | Aceptado como decisión a revisar; preferible Light real + FPW | Un solo peso de cuerpo por deck (Light) |
| T07 | Fuente distinta de Poppins: Calibri, Arial, Times New Roman, Century Gothic/Avenir (78 % del texto), Aptos, Inter (20 % de un deck), Roboto/Raleway, Malgun Gothic, Abadi, Copperplate | Pptx de Office/Canva/Google o plantilla mal usada | python-pptx: `latin typeface` por run; % del texto por fuente | `normalize_fonts.py`: todo a Poppins Light, negrita→Poppins SemiBold, **×0,88** de tamaño (Poppins es más ancha) y reajuste de cajas; deja `Consolas/Courier/Cascadia/Menlo/Source Code` (código) | Poppins en títulos, cuerpo, tablas y cuadros; Light cuerpo / SemiBold negrita; código mono |
| T08 | Negrita que empieza/termina a mitad de palabra | Dos runs mal cortados al copiar/pegar en Google Slides | Regex sobre runs consecutivos (no basta mirar el render) | Reunir runs y re-aplicar negrita por palabra completa | Negrita solo en palabras completas |
| T09 | Viñetas escritas a mano («•», «●», «▪», «❑», «*») sin sangría; 83 de 133 listas | Texto pegado | Regex sobre inicio de párrafo (`BUL` en P2P) / revisión | Viñetas nativas del programa (`buChar`: • nivel 1, – nivel 2; marL 228600/457200, indent −228600; color de viñeta = color medio de marca) | Nunca escribir el símbolo a mano |
| T10 | Alineado con tabuladores/espacios que se descoloca | Maquetación manual | Revisión de párrafos con `\t` o espacios múltiples | Sangría del programa | Sangría nativa, no espacios |
| T11 | Texto justificado con huecos entre palabras | Justificado en cajas estrechas | Visual | Alineación a la izquierda | Cuerpo alineado a la izquierda |
| T12 | Cursiva en >50 % del texto (64 % en un caso) y gris claro cursiva ilegible (placeholder `8A9BA8`) | Estilo del original / texto de ejemplo de la plantilla tomado como estilo | python-pptx `i=1` por run; color `8A9BA8` | Quitar cursiva (`i=0` en `mk()`), color oscuro `2C4A63` | Cursiva solo para una palabra o cita; nunca gris claro en cuerpo |
| T13 | Resaltador «fosforito» (verde, amarillo, azul) para énfasis; marcas rosas sueltas | Hábito del autor | Revisión de `highlight`/fills de runs | Negrita para la idea clave | Sin resaltador; énfasis = negrita |
| T14 | Texto TODO EN MAYÚSCULAS, títulos casi invisibles | Tema de origen | Revisión | Pasar a mayúscula inicial normal; **el subject de portada NO va en mayúsculas** (se quitó `.upper()`); solo eyebrow/etiquetas en mayúsculas | Mayúsculas solo en eyebrow/etiqueta |
| T15 | Títulos interrogativos sin «¿…?» de apertura | Descuido | Revisión visual (README); RD: título que acaba en `?`, `…`, `...` se trata como frase/«quote» | Añadir «¿» sin cambiar el sentido | Signos de interrogación de apertura siempre |
| T16 | Erratas y palabras pegadas («Fundameto», «formamás», «corporativode», «antígenoanticuerpo», «Wharen», «resite», «de como») | Tipeo; guion perdido en título | `hunspell -d …/dict-es/es_ES -l` (QA lista desconocidas + palabras ≥4 letras del origen que faltan); confirmar CADA palabra en contexto | Corregir solo erratas evidentes y decirlo (p. ej. «cómo», «desecho», «kcal» en minúscula, subíndices O₂/CO₂/H₂O, «4 kcal/g», mayúscula tras punto) | Corregir erratas sin tocar contenido; informar al profesor |
| T17 | Errores internos de coherencia: fecha mal («jueves 25/09» siendo viernes), nombre del autor invertido en portada, etiqueta que no corresponde al contenido («Crear usuario» ante comandos de grupo), título de unidad distinto en mapa e índices | Descuido | Lectura contra el original; cálculo de calendario | Corregir lo seguro y anotar; preguntar si es duda de contenido | Un mismo título/número de unidad en toda la presentación |
| T18 | Puntos sueltos «.» como párrafo propio fuera de recuadro (19–20 por deck) | Residuo de conversión | lxml: párrafos cuyo texto de runs sea exactamente «.» | Eliminarlos | Sin párrafos vacíos/puntos sueltos |
| T19 | Notas internas o instrucciones a una IA visibles al alumnado («Clave pedagógica», prompts, «Busca el anexo…») | Notas dejadas en la diapositiva | Revisión; búsqueda de «nota», «prompt», «Sustituye» | Quitar de la diapositiva o pasar a notas del orador | Nada del profesor/IA a la vista del alumno |
| T20 | Texto «para el profesor» (columna «Justificación en el Material») y frases largas/técnicas | Redacción | Lectura | Hablar al alumnado: imperativo/2.ª persona, ≤20 palabras, una idea por viñeta | Escribir al alumnado, no sobre el material |
| T21 | Enlaces largos que ocupan media diapositiva | URL pegada | Revisión | Hipervínculo sobre una palabra («Ver vídeo»); si es un vídeo que en PDF sale como imagen fija, añadir enlace en texto | Enlace en una palabra + enlace visible para vídeos |
| T22 | Índices con foco: resto de secciones cubiertas al 92 % y casi ilegibles | Transparencia excesiva | Revisión | Opacidad del resto al 40 % | Lo no activo debe seguir leyéndose |
| T23 | Texto que no contrasta con el relleno (texto oscuro sobre caja oscura) y palabras largas partidas dentro de cajas de color | Colores heredados | RS pase final: luminancia `lum` (0,2126R+0,7152G+0,0722B) | Si fondo L<0,4 y texto L<0,55 → `FFFFFF`; si fondo L>0,75 y texto L>0,65 → `1F2A33`; palabra más larga ×(pt·0,62) > ancho caja → reducir (factor ≥0,5, suelo 8 pt) | Contraste automático texto/fondo |

### 8.2 IMÁGENES

| ID | Síntoma | Causa | Detección | Corrección | Norma |
|---|---|---|---|---|---|
| I01 | Imágenes descolocadas (solapan otro contenido, quedan solas en galería) y texto perdido al añadir recuadros | Editar plantilla con python-pptx sin control | Antes: baseline del texto de todos los shapes; después: diff. Calcular bbox (EMU) de la imagen y comprobar que no solapa; render tras cada edición | Si no hay hueco limpio, NO forzar: marcar para colocación manual | Colocar solo con bbox sin solape; diff de texto = 0 palabras perdidas |
| I02 | Imagen deformada (proporción distinta al original) — hasta 47 % en un banner; 15 de 59 decks auditados con deformadas/bajas | Caja con otra proporción | Proporción original vs. caja con PyMuPDF `get_image_info`; **deformada >6 %** | `put_img`: escala uniforme `min(mw/w,mh/h)` y centrada; cada imagen conserva su proporción | Jamás estirar: caja ≈ proporción de la imagen |
| I03 | Imagen de baja resolución | Original pobre | ppi efectivo = px / ancho en pulgadas; **baja <96 ppi** (casos 45–105 ppi) | Original del PDF si existe; si no, reescalado 4× Magnific `ultra-sublime` (~216 créditos/imagen, URL firmada, puede bloquear alguna); mantener tal cual si la profesora no reenvía | Imágenes ≥96 ppi efectivos; sugerencia a profesor: ≥1 000 px de ancho |
| I04 | Magnific altera el texto dentro de imágenes («Pericardio»→«Perkardio», etiquetas → pseudotexto) | IA generativa | Comparar original vs. reescalada | No usar en imágenes con rótulos: quitar etiquetas y reescribirlas con texto nativo (tapar y rotular) o recortar zona sin texto | Magnific solo en fotos/dibujos sin texto |
| I05 | Cuadrados negros donde había transparencia (13 decks) y páginas negras | `pdf_to_pptx` perdía la máscara alfa (smask) | Revisar render; imágenes mode RGBA; ahora P2P combina smask | Regenerar con motor corregido; `prep_img`: RGBA/LA/P → PNG, resto JPEG q86, máx. 1500 px | Sin cuadrados negros; solo páginas oscuras legítimas (radiografías/fotos) |
| I06 | Logos blancos de la plantilla estirados un 20 %; logo roto/invisible al clonar; logos de baja calidad; logo ausente en diapositivas de solo imagen | `r:embed` no viaja al copiar `<p:pic>`; plantilla con logo estirado | Visual; proporción w/h | Alto = ancho·h/w; extraer blob y `add_picture` (nunca copiar el XML `<p:pic>`); usar logos hi-res (`4_LOGOS_Y_PALETAS`) | Logo con su proporción y hi-res en todas las diapositivas |
| I07 | Fondo de diapositiva en blanco tras duplicar | `<p:bg>` vive en el XML de la diapositiva, no en el layout | Render | `duplicate_slide` copia `<p:bg>` a mano | Copiar fondo al clonar |
| I08 | Imágenes decorativas/repetidas (logo, banda) contadas como contenido; marcador «Imagen del material base · pág. N» | Cabeceras/pies del original | Mismo xref en ≥25 % de páginas (n≥8) en P2P; RD: hash repetido ≥max(6; 0,15·N) | Filtrar; descartar marcadores `PLACE` | Decoración fuera, contenido dentro |
| I09 | Imagen que no explica el tema, recortada/incompleta, sin fuente; captura de terminal ilegible ocupando media diapositiva | Selección descuidada | Lectura del contenido | Imagen completa, del tema y con fuente si no es propia; recortar y ampliar la parte útil; esquema propio con formas | Imagen: completa, pertinente y con fuente |
| I10 | Código o texto como **captura** (copiar iconos, etiquetas «PNG»), tablas como imagen (tipografía serif) | Pegado desde chat/web | Revisión | Transcribir a texto/bloque de código/tabla nativa y avisar de que se leyó de una imagen | Texto = texto, no imagen |
| I11 | Pptx pesado (19,6 MB; 16,9 MB; 24 MB) que Studio no acepta | Imágenes sin optimizar | Tamaño de archivo | Recomprimir: PNG >60 KB → JPG 84 %, máx. 1600 px (si falla, 1200); transparencias y animaciones intactas; 19,6→4,6 MB; 16,9→7,1 MB | Pptx liviano; optimizar imágenes |
| I12 | Fotos del original ausentes tras la reconstrucción | Filtros demasiado agresivos | `comprobar_fotos.py`: aHash 8×8 de imágenes ≥3 % de página; las del original sin pareja se revisan a ojo | Reponer | Contar y comparar imágenes de contenido (p. ej. 23/23) |
| I13 | Imagen de vector (WMF/EMF) que no abre | Formato | Excepción al abrir con PIL | Convertir con `soffice --convert-to png` | Convertir vectores antes de colocar |
| I14 | Imágenes de baja calidad conservadas por decisión | Profesor no va a reenviar | — | Mantener tal cual (confirmado) | Conservar, avisar |

### 8.3 TABLAS

| ID | Síntoma | Causa | Detección | Corrección | Norma |
|---|---|---|---|---|---|
| TB01 | Tablas con estilos por defecto de PowerPoint (lilas/azules), cuadros con borde azul, verdes/amarillos/azules fuera de marca | Estilo de tabla por defecto | python-pptx: colores de celdas/bordes | Sanipro: cabecera `245578` con texto blanco, filas alternas `F4FAFC`, línea `CFE7EF`. Prometeo: cabecera `152A1D`, 1.ª columna `2C4436`, filas `F7F3EE/FBF8F5`, bordes y fondos de portadilla de paleta (`recolor.py`) | Tablas con la paleta de la marca; cabecera oscura |
| TB02 | Tabla que se sale del recuadro o roza el borde; tablas pegadas como imagen (pierden nitidez y letra pequeña) | Imagen o tabla sin ajustar | Render; bbox | Tabla nativa dentro de la tarjeta (`add_table` en 502920 EMU, ancho 8 138 160); columnas proporcionales `len^0,7·1,6`; filas 300 000 EMU; celdas: margen izq/der 91 440, sup/inf 45 720 | Tablas nativas dentro de la tarjeta |
| TB03 | Tabla muy densa, texto pequeño al proyectar (9–10 pt) | Demasiado contenido | Tamaño medio en tabla <11 pt | Dividir en 2 diapositivas (`half=len(rows)//2+1`, cabecera repetida, 10,5 pt) o subir a 11–12 pt | Tablas ≥11 pt; dividir si no cabe |
| TB04 | Varias tablas por diapositiva: el motor solo conserva una | Limitación de `rebuild_deck` | Conteo de tablas del origen | Rehacer como documento (`plantilla_documento.py`/`find_tables`) o a mano | 1 tabla/diapositiva en el motor; si hay más, otra vía |
| TB05 | Tabla vacía en el PDF (formas blancas «tapaderas» con animación de salida que la ocultan hasta el clic) | PDF no ejecuta animaciones | Detectar formas con animación `exit` sobre tablas | Subir el pptx (Studio acepta pptx y animaciones; probado) o quitar las tapaderas; en PDF puede salir vacía | Si hay animaciones, entregar pptx; no exportar PDF ciego |
| TB06 | Títulos de tabla/rótulos añadidos por el maquetador | Decisión propia | — | Avisar como «decisión a revisar» | Todo lo añadido (etiquetas TABLA/ESQUEMA) se comunica |

### 8.4 COLORES FUERA DE PALETA

| ID | Síntoma | Causa | Detección | Corrección | Norma |
|---|---|---|---|---|---|
| C01 | Verdes/azules/lilas/amarillos/rojos ajenos a la marca en tarjetas, esquemas, portadillas, bordes (p. ej. ~85 diapositivas con lila en un deck) | Acentos del tema Google/Office (`accent1 4472C4/729FCF`, `accent6 70AD47`…) pintados por LibreOffice | python-pptx: extraer colores y compararlos con la paleta; **detector de píxeles verdes en el PDF** (a 30 dpi: `g>100 & g>r+25 & g>b+25`, aviso si media >0,002 de la página) | Normalizar por rol al tono oficial más cercano (no al primero parecido); `recolor.py` | Solo colores de la paleta de la marca; avisar en el feedback con foto ahora/así |
| C02 | Avisos en rojo; esquemas cada uno en un color distinto | Estilo propio | Revisión | Azul oscuro + negrita (Sanipro) / paleta verde-crema-naranja (Prometeo) | Un solo acento por rol |
| C03 | Mezcla de marcas (deck con logo Edentia que corresponde a Sanipro) | Entrega en marca equivocada | Logo/paleta | Cambiar a la marca de la asignatura (Farmacia = Sanipro; Higiene bucodental/Prótesis = Edentia; informática/marketing = Prometeo) | Marca según ciclo |
| C04 | Gráficos/figuras ya en colores propios (teal/morado/verde/naranja) | Figuras de terceros | — | Dejar «tal cual» y avisar | No recolorear figuras ajenas sin pedirlo |

### 8.5 PORTADAS

| ID | Síntoma | Causa | Detección | Corrección | Norma |
|---|---|---|---|---|---|
| P01 | Rótulo «PLANTILLA DE CLASE» / «GUÍA DE CLASE» sin sustituir; falta el ciclo | Plantilla sin personalizar | Texto de la diapositiva 1 | Línea superior = **ciclo** (12 pt) | Ciclo arriba, nunca «PLANTILLA DE CLASE» |
| P02 | Título pequeño; «UT1:» o sin número; término distinto del nombre del archivo | Portada de origen | Revisar portada y nombre | Título **38 pt** con «Unidad N:/Tema N:» en Light y el nombre en SemiBold; si es largo baja 34/30/28/26/24 (máx. 3 líneas) | «Unidad» siempre salvo que el profesor use «Tema»; mismo término en portada = archivo = listado |
| P03 | «Curso 2026/27», «2026 - 2027» o el correo del profesor en lugar de la fecha | Valor por defecto del motor (`year='2026/27'`) | Texto de portada | Fecha `dd / mm / aaaa` (fecha de entrada), sin correo; «1.º» en el curso | Fecha dd / mm / aaaa |
| P04 | Portada sin nombre del profesor, sin asignatura o con nombre invertido; diminutivo | Falta de datos | Lectura | Asignatura · curso/nivel · duración en minúsculas normales (NO mayúsculas), profesor con el nombre con el que firma | Nombre y asignatura visibles |
| P05 | Campos sin rellenar: «Duración estimada», «__ minutos», «Título del ejemplo…», «Sustituye por tu fotografía», «Pie de foto» | Plantilla a medias | Búsqueda de placeholders | Rellenar o eliminar la diapositiva/recuadro; quitar texto oculto | Cero texto de plantilla |
| P06 | Portada/cierre como imagen: no editable; portada ausente (empieza en calendario interno) | Parche rápido | — | Portada y cierre SIEMPRE EDITABLES (texto nativo); calendario interno con profesores fuera; abrir con portada | Portada/cierre editables |
| P07 | Cierre: «Gracias», «Cierre de la Unidad», diapositiva solo con logo, sin cierre, o número de página suelto («15») | Diseño propio | Última diapositiva | Terminar con «¿Preguntas?» de la plantilla, sin número suelto; RD descarta el cierre del origen y añade el de la plantilla | Cierre «¿Preguntas?» sin nº |
| P08 | Portadillas «Sección 1» repetido o numeración 01,02,01,01; «Tema 1:» en cada portadilla | Plantilla copiada | Lectura | Numerar 01,02,03…; «Sección N» | Numeración correlativa |
| P09 | Cabecera de las diapositivas dice «UNIT 1» en un deck «Unit 2» | Copia | Lectura | Cabeceras = unidad real («UNIDAD 1») | Cabecera = portada |

### 8.6 ESTRUCTURA

| ID | Síntoma | Causa | Detección | Corrección | Norma |
|---|---|---|---|---|---|
| E01 | Diapositivas casi vacías / texto de relleno «x» / «Espacio abierto para dudas» | Plantilla sin usar | RD: bloques `x+`; `nchar≤110` con título corto → sección/cita; páginas vacías o negras | Descartar vacías y avisar; portadilla corta sin título → sección oscura; frases cortas → diapositiva de cita (26/22/18/15 pt según 70/120/200 car.) | Nada de diapositivas vacías ni relleno |
| E02 | Dos ideas en una diapositiva → letra pequeña; páginas muy cargadas | Mucho contenido | nchar alto; T01 | Una idea por diapositiva: dividir (con título «(1/2)», «(2/2)» renumerado automáticamente) | Una idea por diapositiva |
| E03 | Títulos idénticos en diapositivas consecutivas | Copias | RD: `prev_title`/`base_of` | Añadir subtítulo diferenciador («Ejemplo», «Tabla comparativa») o (n/N) | Títulos únicos que digan en cuál estás |
| E04 | Diapositivas repetidas idénticas | Copia del autor | Comparar texto | NO se borra (fiel) salvo decisión: marcar ⚠ y preguntar | Avisar de repetidas |
| E05 | Estructura mezclada: versiones paralelas de la misma unidad; tres versiones | Entrega sin orden | Cruzar con índice del módulo | Preguntar si son partes o versiones | Una unidad = un archivo claro |
| E06 | Fuera de plantilla: fondo blanco con Arial, sin cabecera ni etiqueta; temas Office/turquesa/rosa; 4:3 | Autor no usa plantilla | Render + shapes «Google Shape;N» | Decidir: pptx ya en plantilla → solo QA/parche; sin plantilla → `restyle_deck` (1:1) o `rebuild_deck` desde PDF | Mirar la **página 1** antes de decidir; «Google Shape» NO implica plantilla |
| E07 | Reconstruir un pptx nativo pierde portadillas, fotos, tarjetas; reconstruir un PDF ya perfecto es downgrade | Elegir motor incorrecto | — | Pptx nativo → parche conservador (no `rebuild_deck`); `rebuild_deck` solo con fuente PDF | Fidelidad al layout del profesor; sin reinterpretar |
| E08 | Imágenes separadas de su texto en galería aparte | Reconstrucción creativa | — | 1:1 con la página; imagen junto a su texto | No inventar estructura |
| E09 | Uso de la plantilla oficial: cuadros sueltos, 0 placeholders, layouts genéricos → «jaleos de formato» | Plantilla sin máster | Inspección | Propuesta: plantilla con máster y layout «Concepto» (pendiente de OK) | (pendiente) |
| E10 | Índice de unidad inexistente / estructura poco constante | — | — | Estructura recomendada: portada · introducción y objetivos · contenido · ejemplo práctico · errores frecuentes · resumen · actividad/entregable · cierre y dudas | Mismo orden en todas las unidades |

### 8.7 FORMATO DE ENTREGA, NOMBRES, EXPORTACIÓN

| ID | Síntoma | Causa | Detección | Corrección | Norma |
|---|---|---|---|---|---|
| F01 | Vídeo incrustado aparece como imagen fija en PDF | PDF no reproduce | — | Enlace en texto debajo | Enlace visible |
| F02 | PDF exportado pierde animaciones | PDF estático | — | Si hay animaciones: pptx (probado 16-oct); PDF para lo estático | Studio acepta pptx con animaciones |
| F03 | Un PDF no abre en la plataforma con un nombre y sí con otro (mismo hash) | Nombre del archivo en la URL de CDN | Probar renombrar | Nombre corto, sin tildes, rayas ni comas: `<ASIG>_Presentacion_Unidad_<N>_<M>.pdf` | No tocar el contenido: renombrar |
| F04 | Nombre de píldora largo o con «— título»; nº de orden confundido con nº de unidad | Convención antigua | — | **«Presentación Tema/Unidad/Sesión N»** y nada más, en la carpeta «Recursos extras» | Nombre corto + Recursos extras |
| F05 | Se reconstruye todo y se reemplaza lo ya subido sin fallo | — | — | Lo subido sin fallo NO se rehace (solo "muy mal": Thin ilegible, texto cortado, fuera de plantilla) | Cambiar lo mínimo |
| F06 | Se pierde el original | — | — | Originales en `ORIGINAL - sin corregir/`; trabajo en copia con nombre distinto; versiones previas en backups | Nunca pisar el original |
| F07 | PDF también a maquetar (antes «PDF tal cual») | Decisión 6-oct | — | Extraer texto e imágenes del PDF página a página y reconstruir; sin inventar | PDF también en plantilla de marca |
| F08 | Dos tipos de plantilla: presentación ≠ documento | Confusión | — | Ante «usa la plantilla» confirmar cuál | Documento ≠ presentación; no llamar «Anexo» a una presentación |
| F09 | Tipografía de la memoria del alumno (Arial/Times) usada en plataforma | — | — | Plataforma = Poppins | Poppins en plataforma |
| F10 | Feedback sobre MIS versiones, no sobre el original; texto sobre texto en las capturas del feedback | — | — | Auditar el ORIGINAL; cada punto con foto ahora/así; contornos rojos sin texto encima | Feedback con originales y sin texto pisado |

## 8.8 Casos visuales (antes → después)

Cada caso muestra, con un **contorno rojo** sin texto encima, lo que falla en la diapositiva original y cómo queda cuando se aplica la norma, con los mismos textos.

### Caso A · Letra muy pequeña y tarjetas casi vacías (T01, T02)

![Antes: tarjetas con letra diminuta](img/casos/a_offline.jpg)

*Antes: tres tarjetas altísimas con tres líneas de texto de menos de 8 pt en la parte de arriba.*

![Después: letra legible](img/casos/b_offline.jpg)

*Después: las mismas tres tarjetas con el texto a tamaño legible (≥ 12 pt).*

![Antes: capas](img/casos/a_capas.jpg)

*Antes: tres capas con el texto en un rincón de tarjetas muy grandes.*

![Después: capas](img/casos/b_capas.jpg)

*Después: texto ocupando la tarjeta.*

![Antes: lista de comprobaciones](img/casos/a_check.jpg)

*Antes: diez comprobaciones con letra de unos 6 pt.*

![Después: lista de comprobaciones](img/casos/b_check.jpg)

*Después: dos columnas con los mismos textos a tamaño legible.*

### Caso B · Dos ideas en una diapositiva (E02)

![Antes: dos temas en una diapositiva](img/casos/a_hilos.jpg)

*Antes: almacenamiento local y modelo de hilos en la misma diapositiva.*

![Después: almacenamiento](img/casos/b_alm.jpg)

*Después (1/2): el almacenamiento, en una tabla.*

![Después: hilos](img/casos/b_hilo2.jpg)

*Después (2/2): la idea «Así no / Así sí» con la letra grande.*

### Caso C · Texto encima de texto (T04)

![Antes: esquema MVVM](img/casos/a_mvvm.jpg)

*Antes: el nombre de cada caja y su descripción están escritos uno sobre otro.*

![Después: esquema MVVM](img/casos/b_mvvm.jpg)

*Después: título y texto de cada caja separados.*

![Antes: tarjetas que se pisan](img/casos/a_tarj.jpg)

*Antes: los títulos «Recomposición automática» y «Doble canal de salida» se montan sobre el texto de debajo.*

![Después: código y tarjetas](img/casos/b_codigo.jpg)

*Después (1/2): el código, solo y con letra grande.*

![Después: tarjetas](img/casos/b_tarj.jpg)

*Después (2/2): lo que hace el código en tres tarjetas, sin solapes.*

### Caso D · Código incompleto (T19/I10)

![Antes: manifest sin etiquetas](img/casos/a_manifest.jpg)

*Antes: el fichero de configuración sin las etiquetas de apertura (`<manifest`, `<uses-permission`…), con la letra pequeña y mucho margen vacío.*

![Después: manifest completo](img/casos/b_manifest.jpg)

*Después: el mismo fragmento completo, con sangría y la letra a tamaño legible (propuesta con las líneas originales más las etiquetas que faltaban).*

### Caso E · Imagen que no es del tema (I09)

Véanse las figuras 4.2 y 4.3 en [04_imagenes](04_imagenes.md#46-casos-reales-imagen-que-no-explica-el-tema).

### Caso F · Notas internas y tablas (T20, TB01)

Véanse las figuras 5.1 a 5.4 en [05_tablas](05_tablas.md#54-errores-reales).

### Caso G · Buenos ejemplos que conviene repetir

![Flujo con colores y flechas](img/casos/g_callbacks.jpg)

*Un flujo de 7 pasos con orden visible (flechas), un color por fase y tarjetas con nombre y frase corta.*

![Así no / así sí](img/casos/g_hilos.jpg)

*Una regla convertida en dibujo: la barra roja (la app se congela) frente a la verde (sigue atendiendo al usuario).*

![Flujo de pantallas](img/casos/g_flujo.jpg)

*Dos modelos de interfaz explicados con un esquema de dos pantallas.*

![Código con su solución](img/casos/g_claseR.jpg)

*Ejemplo de acceso a un recurso con el error típico y su solución.*

## 8.9 Contradicciones y lagunas detectadas (decisiones pendientes)

Cosas que **no están resueltas** en las fuentes y que una herramienta o una norma deberá fijar:

1. **Portada en los motores de reconstrucción:** `rebuild_deck.py` y `restyle_deck.py` usan título de **30 pt** y `year='2026/27'` por defecto; la norma (13-oct) es **38 pt** y fecha `dd / mm / aaaa`. Hay que pasar los valores en la configuración.
2. **Título de contenido:** el motor baja a 22/18/16/14 pt; la norma de tamaños dice 24–25 pt (las reducciones se justifican por longitud y se comunican).
3. **Cuerpo mínimo:** el motor admite 11,5 pt (y 10,5 pt como último recurso); la norma dice **≥ 12 pt** (11–12 solo en tarjetas y tablas).
4. **Thin:** coexisten dos soluciones (cambiar a «Poppins» regular antes de exportar, o corregir en el PDF con `fix_poppins_weights.py`). Se prefiere Light real.
5. **«Nunca inventar»** frente a frases cortadas completadas por contexto: se hizo con aviso de confirmación.
6. **«Solo PDF» a la plataforma** frente al hallazgo del 16-oct de que la plataforma acepta pptx con animaciones.
7. **Cierre:** en Sanipro es la diapositiva 8 (de 9) y en Edentia/Prometeo la 7 (de 8).
8. **Tres hojas de estilo para Prometeo** (oro Letter/Arial 12; leyenda A4/Arial 11; PDF de unidad A4/Poppins): no consta decisión escrita sobre cuál rige cada salida.
9. **`###`/`####` en el corpus** pese a la norma de «dos niveles»; **`IMG` y `DIAG`** como tipo de imagen no están en la lista oficial (`ESQ, DIA, TAB, CAP, GRA, FOT`).
10. **Quiz en el `.md`:** tres formatos distintos (canónico, el de Gestión Administrativa y el que acepta Layout Studio).
11. **Tablas:** el `.docx` de unidad las convierte en marcador + prosa; el PDF y Layout Studio las pintan.
12. **Colores:** los motores no usan los mismos valores para la misma marca (véase [01](01_marcas_paletas_tipografias.md#discrepancias-entre-fuentes-decisión-pendiente)).
13. **Sanipro:** ningún `.md` de unidad en el corpus; solo identidad, plantillas y tests.
14. **Código:** el motor oficial de temario genera código **claro**; la decisión del 21-oct es **Ayu Mirage** en todos los formatos y botón de copiar en las salidas web.
15. **Marca de agua:** exigida en todo documento (PDF y Word); la tienen el documento de apoyo y el anexo, pero no el temario por unidad ni la hoja de ruta.
16. **Word:** ningún motor genera `.docx` por sí mismo; las plantillas del capítulo [11](11_documentos_word.md) son la primera versión.
