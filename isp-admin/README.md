# ISP Admin — Panel de Administración Web

Panel React para gestionar órdenes de servicio, técnicos e instalaciones.

---

## 🚀 Instalación

```bash
cd isp-admin
npm install
npm run dev
# Abre http://localhost:5173
```

Asegúrate de que el **backend esté corriendo** en `http://localhost:3000` antes de iniciar.

El proxy de Vite redirige `/api/*` → `http://localhost:3000/api/*` automáticamente.

---

## 📱 Páginas incluidas

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión |
| `/` | Dashboard con estadísticas y órdenes recientes |
| `/ordenes` | Lista completa con filtros, subida de PDF y asignación |
| `/ordenes/:id` | Detalle: cliente, técnico, GPS, fotos, config ONU |
| `/tecnicos` | Tarjetas de técnicos con registro de nuevos |
| `/equipos` | Catálogo de modelos ONU |
| `/reportes` | Gráficas de estado, tipo y rendimiento por técnico |

---

## 🎨 Diseño

- **Tema:** Dark industrial con tipografía Syne + DM Sans
- **Colores:** Azul eléctrico como acento principal
- **Componentes:** Badge, Btn, Card, Modal, Table, Input, Avatar, Spinner, Empty

---

## 🏗️ Estructura

```
src/
├── main.jsx                  # Entry, router, QueryClient
├── index.css                 # Design tokens + reset
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Ordenes.jsx           # Lista + modal PDF + modal asignar
│   ├── OrdenDetalle.jsx      # Vista completa de una orden
│   ├── Tecnicos.jsx          # Grid de técnicos + crear
│   ├── Equipos.jsx           # Catálogo ONU
│   └── Reportes.jsx          # Estadísticas
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   └── Layout.jsx
│   └── ui/index.jsx          # Todos los componentes reutilizables
├── services/api.js           # Axios + todas las llamadas al backend
├── store/auth.store.js       # Zustand: login/logout/token
└── utils/helpers.js          # Fechas, labels, colores de estado
```

---

## 🔒 Credenciales de prueba

```
Email:    admin@isp.com
Password: Admin123!
```
(Creadas por el seed del backend)

---

## 📦 Build para producción

```bash
npm run build
# Los archivos quedan en /dist — sirve con nginx o cualquier CDN
```
tree src /F