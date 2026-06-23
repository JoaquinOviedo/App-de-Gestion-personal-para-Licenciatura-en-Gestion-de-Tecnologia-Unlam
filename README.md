# Mi Carrera Tech 🎓
### Gestor Local — Licenciatura en Gestión de Tecnología

Aplicación web de uso local para gestionar el progreso académico de la carrera.
Funciona como software de escritorio: backend Node.js/Express + frontend React/Tailwind, todo corriendo en `localhost`.

---

## 🚀 Instalación y primer uso

### Paso 1: Compilar el frontend (solo la primera vez)
```
compilar_frontend.bat
```
Este script instala las dependencias de React/Tailwind y genera la carpeta `frontend/dist/`.

### Paso 2: Lanzar la aplicación
```
iniciar_app.bat
```
- Instala dependencias del backend (solo la primera vez).
- Inicia el servidor Express en `http://localhost:3000`.
- Abre el navegador automáticamente.

---

## 📁 Estructura del proyecto

```
mi-carrera-tech/
├── materias.json            ← Base de datos (se edita automáticamente)
├── iniciar_app.bat          ← 🟢 LANZADOR PRINCIPAL
├── compilar_frontend.bat    ← 🔧 Compilar el frontend (primera vez)
│
├── backend/
│   ├── server.js            ← Servidor Express (API + sirve frontend)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx          ← Componente principal (3 tabs)
    │   ├── main.jsx
    │   ├── index.css
    │   └── utils/
    │       └── academic.js  ← Motor de lógica académica
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🧠 Lógica de estados

| Estado | Condición |
|--------|-----------|
| 🔒 **Bloqueada** | Correlativa sin aprobar/regularizar |
| ⏳ **Pendiente** | Sin notas cargadas |
| 📖 **En Curso** | Solo P1 cargada |
| 🟡 **Regular** | Ambas notas ≥ 4 (no promociona) |
| 🟣 **Promocionada** | P1 ≥ 7 Y P2 ≥ 7 (sin ir a recup) |
| ✅ **Aprobada** | Promocionada o Final aprobado |
| ❌ **Libre** | Ambas < 4, o Recup < 4 |

---

## 💾 Datos

Los datos se guardan automáticamente en `materias.json` cada vez que se modifica un campo.
Usa la tab **Base de Datos** para hacer backups y restaurarlos.

---

## 🛠️ Modo desarrollo (opcional)

Si querés editar el frontend en tiempo real:

```bash
# Terminal 1: Backend
cd backend && npm install && node server.js

# Terminal 2: Frontend (hot-reload)
cd frontend && npm install && npm run dev
```
El frontend de desarrollo corre en `http://localhost:5173` y hace proxy al backend en `:3000`.
