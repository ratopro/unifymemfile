# unifymemfile

Servidor MCP + CLI para persistir y compartir el contexto del proyecto entre IDEs y agentes.

[**English**](README.md)

Cuando trabajas en un proyecto desde múltiples IDEs (VS Code, Cursor, Gemini CLI, etc.), el contexto de cada sesión se guarda automáticamente. Cuando otro IDE o agente abre el proyecto, puede leerlo y saber todo lo que se ha hecho.

Los datos de sesión se almacenan en `.unifymemfile/context.md` (más reciente primero), evitando la pérdida de contexto entre sesiones y cambios de IDE.

## Instalación Rápida (Un Comando)

```bash
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash
```

Esto instala MCP server y skill de Antigravity por defecto.

### Opciones de Instalación

| Opción | Descripción |
|--------|-------------|
| `--mcp` | Instalar solo servidor MCP |
| `--skill` | Instalar solo skill de Antigravity |
| `--both` | Instalar ambos MCP y skill (por defecto) |
| `--uninstall` | Desinstalar |

Ejemplos:
```bash
# Solo MCP
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash -s -- --mcp

# Solo Skill
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash -s -- --skill

# Desinstalar
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash -s -- --uninstall
```

---

## Auto Actualización

En la primera llamada a `save_context`, unifymemfile comprueba automáticamente si hay actualizaciones en GitHub. Si la instalación local está limpia (sin cambios sin comitear), ejecuta:
`git fetch` → `git pull --ff-only` → `npm install` (si cambiaron deps) → `npm run build`.

- Se ejecuta **una vez por vida del proceso MCP**
- No bloquea el guardado si falla
- Configurable en `.unifymemfile/config.json` (`autoUpdate: true/false`)
- Si el repositorio tiene cambios locales, se salta la actualización

---

## Almacenamiento

Los archivos se guardan en `.unifymemfile/` en la raíz del proyecto:

| Archivo | Descripción |
|---------|-------------|
| `context.md` | Histórico completo de sesiones |
| `reminders.md` | Lista de recordatorios |
| `memory.md` | Memoria persistente sintetizada |
| `archive.md` | Sesiones antiguas archivadas |
| `config.json` | Preferencias (`autoUpdate`, `defaultMode`, etc.) |

Los archivos legacy `.context.md` y `.reminders.md` se migran automáticamente a `.unifymemfile/` en el primer guardado.

---

## Comandos CLI

```bash
unifymemfile read                   # modo compacto (por defecto, ~35 líneas)
unifymemfile read --mode full       # historial completo
unifymemfile read --mode recent -n 3 # últimas 3 sesiones
unifymemfile compact                # atajo para modo compacto
unifymemfile save --summary "..." --current-state "..."
unifymemfile note "Nota del usuario"
unifymemfile status
unifymemfile migrate                # migrar archivos legacy a .unifymemfile/
unifymemfile init                   # crear .unifymemfile/context.md nuevo
```

---

## Herramientas MCP

| Herramienta | Descripción |
|-------------|-------------|
| `save_context` | Guardar/actualizar contexto (comprueba actualizaciones) |
| `read_context` | Leer contexto (modo `compact`, `full`, o `recent`) |
| `get_context_status` | Verificar estado, tamaño, sesiones |
| `append_context_note` | Añadir nota a la sesión actual |
| `add_reminder` | Añadir recordatorio en `.unifymemfile/reminders.md` |
| `toggle_reminder` | Marcar/desmarcar recordatorio |
| `remove_reminder` | Eliminar recordatorio |
| `read_reminders` | Leer todos los recordatorios |
| `migrate` | Migrar archivos legacy a `.unifymemfile/` |

### Recursos MCP

| Recurso | Descripción |
|---------|-------------|
| `context://current` | Archivo `.unifymemfile/context.md` completo |
| `context://compact` | Contexto compacto (mínimos tokens) |
| `reminders://current` | Archivo `.unifymemfile/reminders.md` completo |

Accede con: `@unifymemfile:context://compact`

### Modos de Lectura

| Modo | Descripción |
|------|-------------|
| `compact` (por defecto) | Estado actual + decisiones + tareas + sesiones recientes + notas (~35 lines, ~70% menos tokens) |
| `full` | Historial completo con resumen y tareas pendientes |
| `recent` | Últimas N sesiones completas (usa `sessions`, por defecto 5) |

Ejemplo:
```json
Herramienta: read_context
{
  "mode": "compact"
}
```

### Ejemplo de Salida Compacta

```
# Project Context

## Current State
Construyendo módulo de autenticación

## Key Decisions
Usar JWT con rotación de refresh

## Open Tasks
- [2026-05-23] Completar flujo OAuth
- [2026-05-22] Escribir tests para middleware auth

## Recent Sessions
1. [2026-05-23] Implementación de auth
2. [2026-05-22] Configuración de esquema BD

## Notes
- [10:30] Comencé implementación JWT
```

---

## Uso de MCP

### Gemini CLI

```bash
# Verificar estado MCP
/mcp

# Guardar contexto
> Guardar el contexto actual: trabajando en la característica X

# Leer contexto (compacto, por defecto)
> Dame contexto del proyecto

# Leer contexto completo
> Muéstrame todo el historial
```

### Claude Desktop

```
Herramienta: save_context
{
  "summary": "Trabajando en autenticación",
  "currentState": "Implementando flujo OAuth",
  "openTasks": "Completar OAuth, escribir tests"
}

Herramienta: read_context
{
  "mode": "compact"
}
```

---

## Frases Coloquiales

| Acción | Frases populares |
|--------|------------------|
| **Guardar contexto** | "guarda lo que hemos hecho", "anota el progreso", "salva el contexto" |
| **Leer contexto** | "qué hemos hecho?", "dame el resumen", "cómo vamos?", "actualízame" |
| **Leer compacto** | "dame contexto", "qué hay?", "cómo va el tema?" |
| **Leer completo** | "muéstrame todo", "historial completo", "todo el historial" |
| **Añadir nota** | "apunta esto", "no se me olvide", "recuerda que", "tomar nota" |
| **Añadir recordatorio** | "añádelo a mi lista", "recuérdame hacer", "ponlo en pendientes" |
| **Ver recordatorios** | "qué hay en mi lista?", "qué tengo que hacer?", "qué queda pendiente?" |
| **Actualizar / migrar** | "actualiza unifymemfile", "update unifymemfile", "actualízame" |

---

## Config

`.unifymemfile/config.json` se crea automáticamente en el primer uso:

```json
{
  "autoUpdate": true,
  "autoUpdateBranch": "main",
  "defaultMode": "compact",
  "recentSessionCount": 5
}
```

| Configuración | Default | Descripción |
|---------------|---------|-------------|
| `autoUpdate` | `true` | Comprobar GitHub por actualizaciones en el primer save |
| `autoUpdateBranch` | `main` | Rama a seguir para actualizaciones |
| `defaultMode` | `compact` | Modo de lectura por defecto |
| `recentSessionCount` | `5` | Sesiones a mostrar en modo `recent` |

---

## Detección de Raíz del Proyecto

Detectada automáticamente subiendo por el árbol de directorios buscando: `.git`, `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `composer.json`, `pom.xml`, `build.gradle`, `CMakeLists.txt`

Sobrescribir con `--project-root` / parámetro `projectRoot`, o `--allow-empty-root` para omitir la verificación.

## Licencia

MIT

---

Si te gusta lo que hago, ¡considera apoyarme en Ko-fi! ¡Cada granito de arena cuenta! https://ko-fi.com/ratopro
