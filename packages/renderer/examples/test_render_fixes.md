---
titulo: Pruebas de regresión del renderer
eyebrow: layout-studio · QA
---

# Pruebas de regresión del renderer

Este documento reúne, en un solo sitio, los casos que han dado problemas en el
renderer para poder verificarlos de un vistazo antes de hacer push. Cada sección
describe qué debería verse si el arreglo sigue funcionando.

## 1. Bloque de código vacío

Justo debajo de este párrafo hay un bloque de código vacío en el Markdown de
origen. **No debe aparecer ninguna caja**: si ves un recuadro vacío, el arreglo
de "omitir bloques de código vacíos" se ha roto.

```
```

Y este otro bloque solo contiene líneas en blanco; **tampoco debe renderizarse**.

```

  
```

Después del hueco anterior, el texto continúa con normalidad. Un bloque de
código con contenido real, en cambio, sí debe dibujarse:

```python
def saludar(nombre: str) -> str:
    return f"Hola, {nombre}"
```

## 2. Checklist de aciertos y errores

Las siguientes líneas usan el patrón `❌`/`✅`. Deben renderizarse como una lista
con marcadores de color (✗ rojo para el error, ✓ verde de marca para el acierto),
cada item en su propia línea con sangría francesa y **sin texto corrido ni huecos**.

❌ Cargar todo `src/` al iniciar la sesión "por si el agente lo necesita". Inunda el contexto con ruido y dispara el coste por turno.
✅ Cargar el archivo de proyecto, el spec del módulo en curso y dos o tres archivos que sabes que el agente va a tocar. Dejar el resto a retrieval.

❌ Mantener activas todas las integraciones externas del CLI por si acaso.
✅ Activar las tres o cuatro que la sesión necesita. Las demás se activan cuando aparezca una necesidad real.

❌ Confiar en que la ventana de 1M tokens absorbe cualquier descuido en la selección del contexto.
✅ Tratar la ventana grande como margen para sesiones largas, no como excusa para llenarla desde el principio.

## 3. Tabla con tokens largos sin espacios

Las dos últimas columnas contienen identificadores largos sin espacios
(snake_case, rutas, asignaciones). Deben **partirse en delimitadores** dentro de
su columna y **no solaparse** con la columna vecina.

| Cliente | Archivo de proyecto | Archivo global | Comando interactivo |
|---|---|---|---|
| Claude Code | `.mcp.json` en la raíz del repo | `~/.claude/settings.json` (key `mcpServers`) | `claude mcp add` |
| Codex CLI | bloque `[mcp_servers]` en `.codex/config.toml` del proyecto | `~/.codex/config.toml` | `codex mcp add` |
| OpenCode | `mcp` block en `opencode.json` del proyecto | `~/.config/opencode/config.json` | edición directa del JSON |

Y otra tabla con valores de configuración largos por celda:

| Nivel | Codex | OpenCode |
|---|---|---|
| Preguntar siempre | `sandbox_mode=read-only`, `approval_policy=untrusted` | `read=allow`, resto en `ask` |
| Mixto operativo | `sandbox_mode=workspace-write`, `approval_policy=on-request`, `network_access=false` | `read=allow`, `write=allow-workspace`, `bash=ask`, `network=deny` |
| Sandbox abierto | `sandbox_mode=workspace-write`, `approval_policy=never`, `network_access=false` | `read/write/bash=allow`, `network=deny` |

## 4. Relleno para empujar contenido entre páginas

El texto de esta sección no prueba nada por sí mismo: solo sirve para empujar los
títulos y bloques de código de las secciones siguientes hacia el final de una
página, de modo que se disparen los controles de "título huérfano" y de "viuda en
bloque de código". Conviene tener varios párrafos densos.

El contexto efectivo de un agente es el mínimo conjunto de tokens de alta señal
que maximiza la probabilidad de éxito de la tarea. Todo lo demás es ruido que
diluye la atención del modelo y encarece cada turno sin aportar información útil.

Preload y retrieval son las dos palancas principales. El preload entra al
arrancar la sesión y debe limitarse a lo estable y transversal; el retrieval trae
bajo demanda lo que la tarea concreta necesita en cada momento, sin contaminar el
arranque con material que la mayoría de sesiones no van a tocar.

La selección del contexto es una decisión de ingeniería, no un detalle accesorio.
Elegir qué archivos preceden a una tarea, qué herramientas se exponen y qué
queda fuera determina tanto el coste como la calidad de la respuesta del agente.

Una ventana de contexto grande es margen para sesiones largas, no una excusa para
llenarla desde el principio. Cuando se trata como margen, el agente mantiene foco;
cuando se trata como cajón de sastre, la señal se pierde entre el ruido acumulado.

Conviene revisar periódicamente qué hay en preload y mover a retrieval todo lo que
solo aplica a una minoría de sesiones. El spec de un módulo concreto, por ejemplo,
rara vez necesita estar presente en todas las sesiones del proyecto.

## 5. Título de sección que no debe quedar huérfano

Esta sección debería empezar con su contenido inmediatamente debajo del título.
Si el título cae al final de una página y la tabla siguiente salta a la página
posterior dejando el título solo, el control de "keep-with-next" se ha roto.

| Concepto | Idea clave |
|---|---|
| Andamiaje | `anthropics/skill-creator` genera la estructura mínima (`SKILL.md`, `scripts/`, `references/`) y un borrador del frontmatter. |
| Frontmatter | `name` identifica; `description` decide invocación. La segunda frase de la descripción contiene los disparadores que el modelo matchea. |
| Cuerpo | Instrucciones imperativas, cortas, directas. Verbos en imperativo. Sin conversación. El cuerpo se lee solo cuando la Skill ya está activa. |
| Versionado | Project-level en `.claude/skills/`, revisado en PR como código. User-level solo para preferencias personales. |

## 6. Bloque de código que no debe partirse dejando una viuda

El siguiente bloque de configuración debe renderizarse **completo en una sola
página**. Si las llaves de cierre saltan solas a la página siguiente en una caja
diminuta, el control de "keep-together / viudas" se ha roto.

```json
{
  "mcp": {
    "inventory": {
      "type": "local",
      "command": ["uv", "run", "mcp", "run", "server.py"],
      "cwd": "/Users/tu-usuario/projects/inventory-mcp"
    }
  }
}
```

Después del bloque, una frase de cierre para confirmar que el flujo continúa con
normalidad y que la maquetación recupera el ritmo habitual del cuerpo de texto.

## 7. Bloque de código muy largo (split legítimo con cola ≥ 2 líneas)

Este bloque es deliberadamente largo para forzar un salto de página legítimo. Lo
que debe comprobarse es que, si se parte, **el último trozo conserva al menos dos
líneas** y nunca queda una sola línea huérfana.

```python
def construir_contexto(proyecto, modulo, archivos_objetivo):
    contexto = []
    contexto.append(cargar_archivo_proyecto(proyecto))
    contexto.append(cargar_spec_modulo(modulo))
    for ruta in archivos_objetivo:
        contexto.append(leer_archivo(ruta))
    # Las integraciones se activan solo si la sesión las necesita.
    integraciones = seleccionar_integraciones(proyecto, max_activas=4)
    for integracion in integraciones:
        contexto.append(describir_integracion(integracion))
    # El resto del repositorio queda disponible vía retrieval bajo demanda.
    indice = construir_indice_retrieval(proyecto, excluir=archivos_objetivo)
    contexto.append(indice)
    # Validación final: el contexto no debe superar el presupuesto de tokens.
    presupuesto = calcular_presupuesto(modulo)
    contexto = recortar_a_presupuesto(contexto, presupuesto)
    assert contar_tokens(contexto) <= presupuesto, "Contexto sobre presupuesto"
    return ensamblar(contexto)
```

Fin del documento de pruebas.
