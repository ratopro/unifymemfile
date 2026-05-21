# unifymemfile

Servidor MCP + CLI para persistir y compartir el contexto del proyecto entre IDEs y agentes mediante `.context.md`.

[**English**](README.md)

Cuando trabajas en un proyecto desde múltiples IDEs (VS Code, Cursor, Gemini CLI, etc.), el contexto de cada sesión se guarda en un archivo `.context.md`. Cuando otro IDE o agente abre el proyecto, puede leer este archivo y saber todo lo que se ha hecho.

Las sesiones se almacenan en orden cronológico inverso (la más reciente primero), evitando la pérdida de contexto entre sesiones y cambios de IDE.

## Instalación Rápida (Un Comando)

```bash
curl -fsSL https://raw.githubusercontent.com/ratopro/unifymemfile/main/install.sh | bash
```

Esto:
1. Descargará el repositorio
2. Instalará las dependencias
3. Compilará el proyecto
4. Ejecutará el instalador interactivo

---

## Instalación Manual

### Desde código fuente

```bash
cd /ruta/a/unifymemfile
npm install
npm run build
npm link  # hace que `unifymemfile` esté disponible globalmente
```

## Comandos CLI

```bash
unifymemfile save --summary "..." --open-tasks "..." --recent-changes "..."
unifymemfile read
unifymemfile status
unifymemfile note "Nota del usuario aquí"
unifymemfile init
```

## Herramientas MCP

| Herramienta | Descripción |
|-------------|-------------|
| `save_context` | Guardar/actualizar campos del contexto en `.context.md` |
| `read_context` | Leer todos los datos del contexto |
| `get_context_status` | Verificar si `.context.md` existe, tamaño, número de sesiones |
| `append_context_note` | Añadir una nota a la sesión actual |

### Recurso MCP

| Recurso | Descripción |
|---------|-------------|
| `context://current` | El archivo `.context.md` completo del proyecto actual |

Accede con: `@unifymemfile:context://current`

---

## Uso de MCP

### Gemini CLI

#### Verificar Estado MCP

```bash
/mcp
```

Esto muestra todos los servidores MCP conectados y sus herramientas.

#### Usar Herramientas MCP

En Gemini CLI, simplemente describe lo que quieres:

```bash
# Guardar contexto
> Guardar el contexto actual: trabajando en la característica X, necesito arreglar el bug en auth

# Leer contexto
> Leer el contexto del proyecto

# Verificar estado
> ¿Cuál es el estado del contexto?

# Añadir una nota
> Añadir una nota: Recordar probar el flujo de login
```

#### Usar Recursos MCP

```bash
# Acceder al archivo de contexto directamente
> @unifymemfile:context://current
```

### Claude Desktop

En Claude Desktop, usa las herramientas en la conversación:

```
# Guardar contexto
Herramienta: save_context
{
  "summary": "Trabajando en la característica de autenticación",
  "currentState": "Implementando flujo OAuth",
  "recentChanges": "Añadido modelo de usuario y migración",
  "openTasks": "Completar OAuth, escribir pruebas"
}

# Leer contexto
Herramienta: read_context
{}

# Verificar estado
Herramienta: get_context_status
{}

# Añadir nota
Herramienta: append_context_note
{
  "note": "La renovación de token OAuth necesita pruebas"
}
```

### VS Code / Cursor (con MCP habilitado)

Igual que Gemini CLI - usa lenguaje natural:

```
# Guardar contexto
"Guardar contexto: trabajando en integración de API, encontré problemas en el endpoint"

# Leer contexto
"Leer el contexto del proyecto para entender el estado actual"
```

---

## Formato `.context.md`

```md
# Contexto del Proyecto

## Sesión 2026-05-21-13:07

### Resumen

Trabajando en la integración del servidor MCP

### Estado Actual

Construyendo la capa de persistencia del contexto

### Cambios Recientes

Añadido almacenamiento basado en sesiones

### Decisiones

Usando TypeScript para seguridad de tipos

### Tareas Pendientes

Escribir pruebas para el CLI

### Problemas Conocidos

Ninguno

### Notas

- [2026-05-21-13:07] Nota del usuario aquí

---

## Sesión 2026-05-20-10:30

### Resumen

Configuración inicial del proyecto
...
```

**Formato de clave de sesión:** `YYYY-MM-DD-HH:MM` — los duplicados dentro de la misma hora se fusionan en una sola sesión.

## Instalación

### Desde código fuente

```bash
cd /ruta/a/unifymemfile
npm install
npm run build
npm link  # hace que `unifymemfile` esté disponible globalmente
```

### VS Code / Cursor / Windsurf

**Opción A — Tasks + Atajo de Teclado (sin instalación de extensión):**

Copia `.vscode/tasks.json` y `.vscode/keybindings.json` en la carpeta `.vscode/` de tu proyecto. Presiona `Ctrl+Alt+S` para guardar el contexto.

**Opción B — Extensión de VS Code:**

```bash
cd vscode-extension
npm install
# Compilar .vsix e instalar manualmente
```

### Gemini CLI

```bash
gemini mcp add unifymemfile node /ruta/a/unifymemfile/dist/index.js
gemini mcp list  # Verificar que muestre como Connected
```

Reinicia Gemini CLI. Las herramientas `save_context`, `read_context`, `get_context_status` y `append_context_note` estarán disponibles.

### Claude Desktop

Añadir a `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "unifymemfile": {
      "command": "node",
      "args": ["/ruta/a/unifymemfile/dist/index.js"]
    }
  }
}
```

### JetBrains IDEs

Añadir una Herramienta Externa:

- Programa: `unifymemfile`
- Argumentos: `save --summary "$Prompt$"`
- Atajo de teclado: Asignar `Ctrl+Alt+S`

### Neovim

```vim
nnoremap <C-A-s> :!unifymemfile save --summary "$(input('Resumen: '))"<CR>
```

## Detección de Raíz del Proyecto

Detectada automáticamente subiendo por el árbol de directorios buscando:
`.git`, `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `composer.json`, `pom.xml`, `build.gradle`, `CMakeLists.txt`

Sobrescribir con `--project-root` / parámetro `projectRoot`, o `--allow-empty-root` para omitir la verificación.

## Licencia

MIT