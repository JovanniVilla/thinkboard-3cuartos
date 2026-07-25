<h1 align="center">🚀 MERN Thinkboard — Advanced Collaborative Kanban & Task Manager ✨</h1>

<p align="center">
  Una plataforma de gestión de proyectos y tareas moderna, colaborativa y visualmente impactante inspirada en la agilidad y ergonomía de herramientas como Trello y Linear.
</p>

![Demo App](/frontend/public/screenshot-for-readme.png)

---

## 🌟 Características y Funcionalidades Principales

- 🧱 **Stack MERN Moderno:** Construido desde cero con **MongoDB**, **Express**, **React 19 (Vite)** y **Node.js (ES Modules)**.
- 📋 **Vistas Flexibles (Kanban y Lista):** Organiza tus tarjetas en tableros Kanban interactivos o listas detalladas, con filtrado avanzado por estado, prioridad y usuarios asignados.
- 📝 **Gestión de Tareas Detallada (`NoteDetailPage`):**
  - **Prioridades y Estados Dinámicos:** Modifica el estado (*Pendiente*, *En Progreso*, *Terminado*, etc.) y el nivel de prioridad de cada tarjeta directamente en línea.
  - **Checklists Interactivas y Editables:** Crea listas de subtareas con barras de progreso en tiempo real. Edita el texto de los ítems directamente en línea y navega cómodamente por listas grandes gracias a un contenedor compacto con scroll automático y botón de expansión ("Ver todas / Contraer").
  - **Descripciones en Markdown:** Editor e intérprete Markdown enriquecido (`MarkdownEditor` / `MarkdownRenderer`) para notas técnicas, especificaciones y documentación de tareas.
  - **Etiquetado Compacto (Labels):** Gestión de etiquetas personalizadas de colores dispuestas en una elegante fila horizontal para maximizar el espacio visual.
  - **Asignación de Miembros:** Asocia colaboradores con iniciales y colores de identificador distintivos.
- 💬 **Comentarios e Hilos de Conversación:**
  - Sistema de debate en cada tarjeta con soporte para comentarios principales y respuestas en hilos (1 nivel de profundidad).
  - Visualización inteligente que muestra inicialmente los 3 comentarios más recientes con botón de expansión para mantener la interfaz limpia y rápida.
- ⚡ **Optimización y Seguridad con Redis:** Limitación de tasa (*Rate Limiting*) y caché manejados e implementados con **Upstash Redis** e **ioredis**.
- 🎨 **Diseño Estético y Responsivo:** Diseñado con **Tailwind CSS**, componentes de **daisyUI** e íconos de **Lucide React**, con soporte de modo oscuro e interfaz de alta densidad sin espacios desaprovechados.
- 🐳 **Despliegue y Contenedores:** Listo para ser paquetizado en Docker y fácilmente desplegable a través de paneles como **EasyPanel** o infraestructura en la nube.

---

## 🧪 Configuración de Variables de Entorno (`.env`)

Crea un archivo `.env` dentro del directorio `/backend`:

```ini
MONGO_URI=<tu_cadena_de_conexion_de_mongodb>

UPSTASH_REDIS_REST_URL=<tu_redis_rest_url>
UPSTASH_REDIS_REST_TOKEN=<tu_redis_rest_token>

NODE_ENV=development
PORT=5000
```

---

## 🔧 Ejecución Local en Desarrollo

### 1. Servidor Backend (`/backend`)
El servidor de backend expone la API REST en Express y conecta a la base de datos y la caché de Redis.

```bash
cd backend
npm install
npm run dev
```

### 2. Cliente Frontend (`/frontend`)
La aplicación en React 19 y Vite se compila de forma instantánea.

```bash
cd frontend
npm install
npm run dev
```

---

## 📐 Estética y Principios de Diseño
- **Ergonomía de Interfaz:** Optimización rigurosa del espacio (márgenes compactos, controles alineados horizontalmente, modales responsivos).
- **Tipografía y Claridad:** Uso de tipografía moderna sans-serif con pesos equilibrados para una lectura clara y rápida.
- **Experiencia de Usuario (UX):** Animaciones fluidas, retroalimentación instantánea ante cambios y manejo controlado del volumen de datos en listas y comentarios.
