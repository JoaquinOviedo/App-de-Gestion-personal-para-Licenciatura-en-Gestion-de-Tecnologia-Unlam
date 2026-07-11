const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// Path al archivo de datos (relativo al backend, sube un nivel a la raíz)
const DATA_FILE = path.join(__dirname, '..', 'materias.json');

// Frontend build path
const FRONTEND_BUILD = path.join(__dirname, '..', 'frontend', 'dist');

// Semilla de datos por defecto
const SEED_DATA = [
  {"id": "01314", "name": "INGENIERIA DE SOFTWARE 1", "year": 1, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01315", "name": "GERENCIAMIENTO DE PROYECTOS 1", "year": 1, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01316", "name": "INVESTIGACION OPERATIVA 1", "year": 1, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01317", "name": "TOPICOS AVANZADOS DE REDES 1", "year": 1, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01318", "name": "INGLES I", "year": 1, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01319", "name": "ARQUITECTURA DE SOFTWARE 1", "year": 1, "correlatives": ["01314"], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01320", "name": "EXPLOTACION Y ADMINISTRACION DE BD", "year": 1, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01321", "name": "GESTION DEL CONOCIMIENTO", "year": 1, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01322", "name": "ELEMENTOS DE ECONOMIA", "year": 1, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01323", "name": "INGLES II", "year": 1, "correlatives": ["01318"], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01324", "name": "PROGRAMACION AVANZADA I", "year": 2, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01325", "name": "INTELIGENCIA DE NEGOCIOS", "year": 2, "correlatives": ["01320"], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01326", "name": "MODELOS DE CALIDAD", "year": 2, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01327", "name": "LEGISLACION APLICADA A LA TECNOLOGIA", "year": 2, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01331", "name": "TRABAJO FINAL", "year": 2, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01328", "name": "PROGRAMACION AVANZADA II", "year": 2, "correlatives": ["01324"], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01329", "name": "GESTION DE PROCESOS DE NEGOCIOS", "year": 2, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}},
  {"id": "01330", "name": "GESTION DE RR.HH.", "year": 2, "correlatives": [], "notaP1": null, "notaP2": null, "notaRecup": null, "recupTarget": null, "finalAprobado": false, "fechas": {"p1": "", "p2": "", "recup": "", "final": ""}}
];

// Middlewares
app.use(cors());
app.use(express.json());

// Servir frontend en producción (dist/)
app.use(express.static(FRONTEND_BUILD));

// =====================
// ENDPOINTS DE LA API
// =====================

// GET /api/materias - Lee el archivo JSON
app.get('/api/materias', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      console.log('[WARN] materias.json no encontrado. Recreando desde semilla...');
      fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_DATA, null, 2), 'utf8');
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    res.json(data);
  } catch (err) {
    console.error('[ERROR] No se pudo leer materias.json:', err.message);
    res.status(500).json({ error: 'No se pudo leer el archivo de datos.', detail: err.message });
  }
});

// POST /api/materias - Sobrescribe el archivo JSON
app.post('/api/materias', (req, res) => {
  try {
    const materias = req.body;
    if (!Array.isArray(materias)) {
      return res.status(400).json({ error: 'El cuerpo debe ser un array de materias.' });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(materias, null, 2), 'utf8');
    res.json({ ok: true, saved: materias.length });
  } catch (err) {
    console.error('[ERROR] No se pudo escribir materias.json:', err.message);
    res.status(500).json({ error: 'No se pudo guardar el archivo de datos.', detail: err.message });
  }
});

// GET /api/datapath - Devuelve la ruta absoluta del archivo de datos
app.get('/api/datapath', (req, res) => {
  res.json({ path: path.resolve(DATA_FILE) });
});

// POST /api/shutdown - El frontend avisa que la pestaña se cerró
app.post('/api/shutdown', (req, res) => {
  console.log('\n  [INFO] Pestaña del navegador cerrada. Apagando servidor...');
  res.json({ ok: true });
  setTimeout(() => process.exit(0), 300);
});

// GET /api/heartbeat - El frontend hace ping periódico
let lastHeartbeat = Date.now();
app.get('/api/heartbeat', (req, res) => {
  lastHeartbeat = Date.now();
  res.json({ ok: true });
});

// Fallback SPA - sirve index.html para cualquier ruta no-API
app.get('*', (req, res) => {
  const indexPath = path.join(FRONTEND_BUILD, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <html>
      <body style="background:#0a0a0a;color:#fff;font-family:monospace;padding:2rem;">
        <h2>⚠️ Frontend no compilado</h2>
        <p>Para usar la app, primero compila el frontend:</p>
        <pre>cd frontend && npm install && npm run build</pre>
        <p>Luego reinicia el servidor.</p>
      </body>
      </html>
    `);
  }
});

// =====================
// INICIAR SERVIDOR
// =====================
app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('');
  console.log('  ==========================================');
  console.log('   Mi Carrera Tech - Servidor OK');
  console.log('  ==========================================');
  console.log(`  Escuchando en: ${url}`);
  console.log(`  Datos en: ${path.resolve(DATA_FILE)}`);
  console.log('  Presiona Ctrl+C para detener.');
  console.log('');

  // Abrir navegador automáticamente
  setTimeout(() => {
    const platform = process.platform;
    let cmd;
    if (platform === 'win32') {
      cmd = `start ${url}`;
    } else if (platform === 'darwin') {
      cmd = `open ${url}`;
    } else {
      cmd = `xdg-open ${url}`;
    }
    exec(cmd, (err) => {
      if (err) console.log(`[INFO] Abre manualmente: ${url}`);
    });
  }, 500);

  // Si no recibe heartbeat del navegador en 15s, apagar servidor
  setTimeout(() => {
    setInterval(() => {
      if (Date.now() - lastHeartbeat > 15000) {
        console.log('\n  [INFO] Sin señal del navegador. Apagando servidor...');
        process.exit(0);
      }
    }, 5000);
  }, 10000); // Esperar 10s antes de empezar a chequear
});
