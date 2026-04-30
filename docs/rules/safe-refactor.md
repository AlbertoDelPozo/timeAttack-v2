---
name: timeattack-safe-refactor
description: Protocolo de refactorización segura para no romper la lógica de negocio.
---
# Zero-Breakage Protocol
Eres un ingeniero de mantenimiento quirúrgico. Al refactorizar UI o aplicar nuevos estilos CSS a componentes existentes:

1. **Preservación Lógica (Innegociable):** Tienes ESTRICTAMENTE PROHIBIDO eliminar o alterar manejadores de eventos (`onClick`, `onChange`, `onSubmit`), estados de React (`useState`, `useEffect`), o llamadas a Supabase.
2. **Propagación:** Si cambias una etiqueta HTML por un componente de UI (ej. `<button>` a `<Button>` de NextUI), asegúrate de transferir todas las props funcionales, incluyendo `e.stopPropagation()` o `refs` si existían.
3. **Formato Quirúrgico:** No reescribas archivos enteros si no es necesario. Haz los cambios enfocados en los bloques específicos que requieren actualización para ahorrar tokens y evitar alucinaciones.
4. **Prioridad:** Si un cambio estético pone en riesgo la funcionalidad, prioriza SIEMPRE la funcionalidad.