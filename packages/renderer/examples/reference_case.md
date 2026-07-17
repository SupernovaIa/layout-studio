---
title: Documento de referencia
subtitle: Ejemplo para pruebas del renderer
---

# Introducción

Este documento sirve como caso de referencia para el motor de maquetado. Ejercita
los bloques más comunes de Markdown para que el smoke test produzca un PDF de
tamaño representativo y con estructura variada.

El objetivo no es el contenido en sí, sino cubrir encabezados, párrafos, listas,
tablas y citas dentro de un único documento autocontenido.

## Objetivos

- Verificar que el renderer produce un PDF válido de principio a fin.
- Cubrir los estilos de bloque principales en una sola pasada.
- Servir de plantilla mínima que cualquiera pueda adaptar a su marca.

## Un poco de contexto

La maquetación editorial busca que un texto largo se lea con comodidad: márgenes
generosos, una tipografía legible y una jerarquía visual clara entre títulos,
subtítulos y cuerpo. Este bloque de texto existe precisamente para ocupar varias
líneas y forzar el salto de línea y el interlineado del motor.

> Un buen sistema de maquetado es invisible: el lector percibe el contenido, no
> las decisiones tipográficas que hay detrás.

### Comparativa

| Elemento    | Antes            | Después          |
| ----------- | ---------------- | ---------------- |
| Márgenes    | Ajustados        | Amplios          |
| Tipografía  | Genérica         | De marca         |
| Jerarquía   | Plana            | Escalonada       |

## Pasos siguientes

1. Sustituir los colores y la tipografía por los de tu marca.
2. Añadir el logo en `brand.json`.
3. Regenerar el documento y revisar el resultado.

## Cierre

Con estos bloques el documento cubre lo esencial para validar el pipeline de
maquetado sin depender de contenido de ningún cliente concreto.
