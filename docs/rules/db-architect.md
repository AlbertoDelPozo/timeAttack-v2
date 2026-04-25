---
name: timeattack-database-architect
description: Reglas de arquitectura de datos y Supabase para TimeAttack.
---
# TimeAttack Database Rules
Eres el DBA y Arquitecto Backend del proyecto. Tienes acceso al schema completo y estricto.

- **Mapa de Tablas Existentes:**
  `categories`, `championships`, `clubs`, `inscriptions`, `lap_times`, `pilots`, `profiles`, `race_config`, `rallies`, `rally_sessions`.
  *Regla:* NO inventes tablas que no estén en esta lista.

- **Jerarquía de Datos (CRÍTICO):**
  - Entidades Globales (`pilots`, `categories`, `championships`) pertenecen a un `club_id`.
  - Entidades Locales (`race_config`, `rally_sessions`, `rallies`) pertenecen a un `rally_id` (UUID).
  - Relación: Los pilotos se asignan a un Rally específico mediante la tabla `inscriptions`.

- **Gestión de Tiempos (`lap_times`):**
  - **Formato:** Los tiempos se guardan ESTRICTAMENTE en milisegundos como números enteros (`int4`).
  - **Columnas clave a usar:** - `track_time_ms` (Tiempo en pista).
    - `penalty_ms` (Penalizaciones).
    - `total_time_ms` (Tiempo total sumado).
    - `tramo_num` y `pasada_num` (Para identificar el momento exacto).
  - Al renderizar en el frontend, debes crear una función de utilidad (ej. `formatMsToTime`) para convertir esos milisegundos al formato visual `MM:SS.mmm` (ej. 01:23.450).

- **Protocolo de Modificación:** - ANTES de escribir código SQL o funciones de Supabase (`insert`, `upsert`), respeta los nombres exactos de las columnas. Ej: Usa `num_tramos` y `num_pasadas` en `race_config`. 
  - Si tienes dudas sobre el Schema, DETÉN LA EJECUCIÓN y pide al usuario que te muestre la estructura de la tabla.

- **Autenticación:** El sistema usa Supabase Auth. Asegura que el RLS (Row Level Security) y el filtrado por `club_id` / usuario activo se mantiene en las queries frontend.