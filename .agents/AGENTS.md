# AGENTS.md — Contexto de Proyecto para IA

> **Uso**: Leé este archivo COMPLETO antes de hacer cualquier cambio al proyecto.
> Está diseñado para que una IA entienda la arquitectura en < 2 minutos y no pierda tokens explorando.

---

## 1. Resumen del Proyecto

**Mi Carrera Tech** es un gestor local de materias universitarias. El usuario registra notas, ausentes y fechas de exámenes. La app calcula automáticamente el estado de cada materia según reglas académicas específicas.

- **Stack**: React 18 + TypeScript + Vite + Tailwind CSS (dark mode).
- **Backend**: Node.js (Express) en `backend/`. Guarda datos en `materias.json` en la raíz.
- **Frontend**: `frontend/` — toda la lógica vive acá.

---

## 2. Estructura de Archivos

```
frontend/src/
├── types/
│   └── index.ts          ← TODAS las interfaces y tipos (Materia, StatusKey, Estadisticas, etc.)
├── utils/
│   └── academic.ts       ← Motor de lógica pura (calcularEstado, STATUS, STATUS_CONFIG, etc.)
├── hooks/
│   └── useMaterias.ts    ← Fetch al backend + debounce de guardado + updateMateria/resetMaterias
├── components/
│   ├── ui/
│   │   ├── NoteInput.tsx     ← Input de nota (blur-only commit) + checkbox "Ausente"
│   │   ├── DateInput.tsx     ← Input de fecha (tema oscuro)
│   │   ├── Badge.tsx         ← Etiqueta de estado visual
│   │   └── SaveIndicator.tsx ← Indicador "Guardando..." / "✓ Guardado"
│   └── MateriaCard.tsx   ← Tarjeta acordeón de materia (notas P1/P2/Recup/F1/F2/F3 + fechas)
├── views/
│   ├── Dashboard.tsx     ← Estadísticas + anillo de progreso + próximos exámenes
│   ├── PlanEstudios.tsx  ← Lista de materias por año (YearSection + MateriaCard)
│   ├── Calendario.tsx    ← Grilla mensual interactiva + panel lateral de eventos
│   └── BaseDatos.tsx     ← Backup/Restore JSON + vista previa
├── App.tsx               ← SOLO router/layout: header + tabs + delega a vistas
├── main.tsx              ← Punto de entrada React
└── index.css             ← Estilos globales base
```

---

## 3. Reglas de Negocio Académicas (MUY IMPORTANTE)

Toda la lógica vive en **`utils/academic.ts`** → función `calcularEstado()`.

### Estados posibles (en orden de precedencia):

| Estado | Condición |
|--------|-----------|
| `APROBADA` | Al menos un final ≥ 4 |
| `LIBRE` (por finales) | Los 3 llamados a final consumidos y todos < 4 |
| `BLOQUEADA` | Correlativas sin regularizar |
| `EN_CURSO` | Solo P1 cargada, o sin notas pero `enCursoManual = true` |
| `PENDIENTE` | Sin notas y sin marcar como en curso |
| `LIBRE` (por parciales) | P1 < 4 Y P2 < 4 (o ausente ambos) |
| `LIBRE` (por recup) | Fue a recuperatorio y sacó < 4 |
| `PENDIENTE_RECUP` | Tiene derecho a recuperar (ver abajo) |
| `PENDIENTE_FINAL` | Regularizó (ambas ≥ 4 con/sin recup) pero no promocionó |
| `PROMOCIONADA` | P1 ≥ 7 Y P2 ≥ 7 (o recup ≥ 7 reemplazando la nota baja) |

### Cuándo hay derecho a recuperatorio (`puedeCargarRecup`):

- Ambos parciales cargados.
- NO si ambos < 4 (libre directo).
- NO si ambos ≥ 7 (ya promocionada).
- NO si ambas notas están entre 4-6 (va a final directo, no beneficia recuperar).
- SÍ si una es ≥ 7 y la otra < 7.
- SÍ si una es < 4 y la otra ≥ 4 (para poder regularizar).

### Cuál parcial va al recuperatorio (`detectarRecupTarget`):

1. Si P1 < 4 y P2 ≥ 4 → recupera **P1**.
2. Si P2 < 4 y P1 ≥ 4 → recupera **P2**.
3. Si P1 < 7 y P2 ≥ 7 → recupera **P1**.
4. Si P2 < 7 y P1 ≥ 7 → recupera **P2**.

### Resultado del recuperatorio:

- Recup ≥ 7 → **PROMOCIONADA**.
- Recup 4-6 → **PENDIENTE_FINAL** (regularizó, va a final).
- Recup < 4 → **LIBRE**.

### Finales (3 llamados):

- Se habilita #2 solo si #1 tiene nota o ausente marcado.
- Se habilita #3 solo si #2 tiene nota o ausente marcado.
- Aprobar con cualquier nota ≥ 4.
- Si consume los 3 y todos < 4 → **LIBRE**.

### Ausente:

- Marcar ausente equivale a sacar 0 (< 4) en esa instancia.
- Bloquea el input de nota para esa instancia.

---

## 4. Flujo de Datos

```
materias.json (raíz)
    ↓ GET /api/materias
useMaterias.ts (hook)
    ↓ materias[]
App.tsx (distribuye a vistas)
    ├── Dashboard.tsx      → calcularEstadisticas()
    ├── PlanEstudios.tsx   → MateriaCard → calcularEstado()
    ├── Calendario.tsx     → obtenerEventosPorFecha()
    └── BaseDatos.tsx      → JSON backup/restore

Actualización: onUpdate(id, cambios) → useMaterias → POST /api/materias (debounce 300ms)
```

---

## 5. Cómo Agregar Cosas Nuevas

### Nuevo estado académico:
1. Agregar la key en `StatusKey` (`types/index.ts`).
2. Agregar la constante en `STATUS` (`utils/academic.ts`).
3. Agregar la lógica en `calcularEstado()`.
4. Agregar la config visual en `STATUS_CONFIG`.

### Nuevo campo en Materia:
1. Agregar el campo en la interfaz `Materia` (`types/index.ts`).
2. Actualizar el seed de datos en `backend/server.js` si aplica.

### Nueva pestaña:
1. Crear la vista en `views/NombreVista.tsx`.
2. Agregar entrada en el array `TABS` de `App.tsx`.
3. Agregar la condición de render en `<main>` de `App.tsx`.

---

## 6. Comandos Útiles

```bash
# Desde frontend/
npm run dev       # Servidor de desarrollo (Vite, puerto 5173)
npm run build     # Compilar TypeScript + bundle de producción

# Desde backend/
node server.js    # Servidor Node.js (puerto 3001)

# Desde raíz (Windows)
./iniciar_app.bat         # Inicia backend + abre frontend compilado
./compilar_frontend.bat   # Solo recompila el frontend
```

---

## 7. Advertencias Críticas

> **⚠️ YearSection en PlanEstudios.tsx**: Esta función DEBE estar definida FUERA del componente `PlanEstudios`. Si estuviera adentro, React la recrearía como nuevo tipo en cada render, desmontando todos los `MateriaCard` y perdiendo el estado `expanded` del acordeón.

> **⚠️ NoteInput usa estado local**: El valor del input no se propaga al padre en cada tecla, solo en `onBlur`. Esto es intencional para evitar re-renders que cerrarían el acordeón de `MateriaCard`.

> **⚠️ calcularEstado es pura**: No tiene efectos secundarios ni estado. Siempre devuelve el estado correcto dado `materia` y `todasLasMaterias`. Usala libremente.
