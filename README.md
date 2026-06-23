# Mi Carrera Tech — Gestión de Tecnología (UNLaM)

**Mi Carrera Tech** es una aplicación web local de código abierto diseñada para ayudar a los estudiantes de la Licenciatura en Gestión de Tecnología (Universidad Nacional de La Matanza) a gestionar sus materias, fechas de exámenes, progreso y notas a lo largo de la carrera.

---

## 🚀 Características Principales

- **Dashboard de Progreso:** Visualizá rápidamente tu porcentaje de avance, cantidad de materias aprobadas y exámenes restantes (parciales, finales, y recuperatorios previstos).
- **Plan de Estudios Interactivo:** Consultá todas las materias año por año. Registrá tus notas, marcá materias "En Curso" de manera manual y controlá qué correlativas te faltan para destrabar una materia bloqueada.
- **Calendario Visual:** Una vista mensual que resalta los días donde tenés parciales, recuperatorios y finales. Además incluye una sección de los "Próximos exámenes".
- **Gestión Local Privada:** Tus datos son totalmente tuyos. Todo se guarda localmente en un archivo `materias.json` que no se sube a la nube ni se comparte. Podés hacer backups descargando el archivo y restaurarlo cuando quieras.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React + Tailwind CSS (empaquetado con Vite).
- **Backend:** Node.js + Express (una API ultra ligera encargada exclusivamente de leer y persistir los datos en el sistema de archivos).
- **Arquitectura:** Aplicación pensada para funcionar Offline y de uso netamente personal (Desktop-like).

---

## 📥 Instalación y Uso (Primeros Pasos)

1. **Clonar el repositorio:**
   Si tenés Git instalado, abrí tu terminal y ejecutá:
   ```bash
   git clone https://github.com/JoaquinOviedo/App-de-Gestion-personal-para-Licenciatura-en-Gestion-de-Tecnologia-Unlam.git
   ```

2. **Requisitos Previos:**
   Asegurate de tener [Node.js](https://nodejs.org/) instalado en tu computadora.

3. **Ejecutar la App:**
   Entrá a la carpeta del proyecto descargado y hacé **doble click en el archivo `iniciar_app.bat`**.
   
   > 💡 **Nota:** La primera vez que ejecutes este archivo, instalará todas las dependencias necesarias de manera automática. Luego de eso, levantará el servidor en `http://localhost:3000` y el frontend. 

### 🛡️ Base de Datos por Defecto y Actualizaciones Seguras

**Tu información está a salvo.**
- **Por defecto:** Al abrir la app por primera vez, el sistema detecta si no tenés el archivo `materias.json`. Si no lo tenés, te creará automáticamente la plantilla con todo el plan de estudios por defecto para que comiences a usarla al instante.
- **Actualizaciones (`git pull`):** Cada vez que abras `iniciar_app.bat`, el script buscará si hay actualizaciones nuevas en este repositorio y las descargará. **Tus datos nunca se perderán**, ya que el archivo `materias.json` está totalmente ignorado por Git (`.gitignore`) y el sistema nunca lo sobrescribe si ya existe. ¡Tus notas siempre estarán seguras!

---

## 🛠️ Contribuir (Modo Desarrollador)

Si querés hacer cambios al código (interfaz, colores, etc):
1. Modificá los archivos dentro de la carpeta `frontend/src`.
2. Hacé **doble click en `compilar_frontend.bat`**. Esto construirá la nueva versión de producción del sitio.
3. Finalmente abrí `iniciar_app.bat` para ver tus cambios reflejados.

---

> App creada como herramienta de productividad para facilitar la vida del estudiante. ¡Éxitos en la carrera! 🎓
