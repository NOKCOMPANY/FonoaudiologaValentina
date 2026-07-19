# Fonoaudióloga Valentina Pau Roca — Sitio Web + Panel Admin

Sitio web y sistema de gestión de sesiones para Valentina Pau Roca, fonoaudióloga especializada en niños, con enfoque en estimulación temprana y desarrollo del lenguaje.

**Stack:** React 18 · Vite · Firebase (Firestore + Hosting) · Google Calendar API · Tailwind CSS

---

## Funcionalidades

### Sitio público
- Landing page con presentación, servicios y formulario de contacto
- Disponibilidad pública vía Google Calendar FreeBusy API (sin datos privados)

### Panel admin (`/admin`)
- Autenticación Google OAuth con token de acceso al calendario
- **Mantenedor de tipos de servicio** — CRUD de reglas de clasificación:
  - Nombre canónico (`displayName`), aliases del calendario, color del badge
  - **Precio por hora en CLP (monto bruto)** — opcional, para cálculo automático en reportes
  - Los tipos se guardan en Firestore y se aplican en tiempo real a toda la app
- **Mantenedor de pacientes** — sincronización automática desde Google Calendar:
  - Detecta pacientes y tipos desde eventos (ventana 90 días)
  - Persiste `detectedTypes` en Firestore para que los tipos estén disponibles sin resincronizar
  - Fusión de duplicados, edición de nombre completo y diagnóstico
  - Detecta y advierte tipos sin regla definida
- **Sesiones del día** — registro de asistencia por evento del calendario con colores dinámicos
- **Reclasificación de tipo** por sesión individual

### Reportes (`/admin/reportes`)
- Generador de reporte mensual con Google Calendar como fuente de verdad
- Tabla con totales por paciente: sesiones, asistencia, % y **monto bruto CLP**
- Barra de progreso por tipo con monto acumulado
- **PDF individual por paciente** (membrete profesional + detalle por día + glosa SII):
  - Membrete: Valentina Pau Roca, Fonoaudióloga, Universidad de Chile, email y WhatsApp
  - Tabla resumen por tipo: Servicio · Precio/hr · Horas · Sesiones · Monto Bruto
  - Detalle agrupado por día con subtotal diario
  - Glosa informativa SII con monto bruto total
- **PDF general** del período con todos los pacientes y totales
- **CSV individual y CSV general** con todos los campos incluido precio por sesión

### Regla de precios

Cada tipo de servicio puede configurarse en uno de dos modos desde el mantenedor:

| Modo | Campo | Cálculo |
|---|---|---|
| **Por hora** (default) | `precioHora` (CLP/hr) | `precio = durHours × precioHora` |
| **Precio fijo** | `precioFijo` (CLP) + `horasRef` (ref.) | `precio = precioFijo` siempre |

**Modo por hora** — proporcional a la duración real del evento:
- Sesión de 1:00 h → precio completo
- Sesión de 0:30 h → precio ÷ 2
- Sesión de 1:30 h → precio × 1,5
- Eventos de día completo (sin hora) → sin cálculo

**Modo precio fijo** — monto constante por sesión independiente de la duración:
- Ej: Taller = $30.000 siempre, ya dure 2 h o 3 h
- `horasRef` es opcional e informativo (aparece en el PDF como referencia)

> Todos los montos son **brutos** (antes de retención). El campo `tipoPrecio` en Firestore determina el modo; si no existe (registros legacy) se asume `'hora'`.

---

## Formato de eventos en Google Calendar

```
Tipo Nombre del paciente
```
Ejemplos: `BS Martina` · `Terapia Juan` · `Fono Camila`

La primera palabra es el tipo de servicio — se mapea a un `displayName` canónico según los aliases configurados en el mantenedor de tipos. El guión es opcional (`BS - Martina` también funciona).

---

## Estructura del proyecto

```
src/
  components/
    admin/
      PatientManager.jsx     — Mantenedor de pacientes + sync calendario
      ServiceTypeManager.jsx — Mantenedor de tipos de servicio + precios
    calendar/
      PrivateCalendar.jsx    — Sesiones del día + registro de asistencia
      PublicAvailability.jsx — Disponibilidad pública (FreeBusy)
    reports/
      MonthlyReport.jsx      — Reportes mensuales + exportación PDF/CSV
    landing/                 — Hero, Services, Contact (sitio público)
    ui/                      — Navbar, TokenRefreshBanner, LoadingSpinner
  context/
    AuthContext.jsx           — Autenticación Google OAuth
  hooks/
    useFirestore.js           — CRUD Firestore (patients, sessions, serviceTypes)
    useCalendar.js            — Hooks para eventos del calendario
  lib/
    firebase.js               — Inicialización Firebase (base de datos: 'vale')
    googleCalendar.js         — API de Google Calendar
    parseEvent.js             — Parser de títulos de eventos con TYPE_MAP dinámico
    withTimeout.js            — Wrapper de promesas con timeout
    constants.js              — Constantes globales
  pages/
    Admin.jsx, Reports.jsx, Home.jsx, Login.jsx, Availability.jsx
```

---

## Deploy

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build + deploy a Firebase Hosting
npm run build
firebase deploy --only hosting

# Deploy incluyendo reglas de Firestore
firebase deploy --only hosting,firestore:rules
```

---

## Variables de entorno

Crear `.env` con las variables de Firebase y Google OAuth (ver `.env.example` si existe).

---

## Colecciones Firestore

| Colección | Descripción |
|---|---|
| `patients` | Pacientes detectados desde el calendario |
| `sessions` | Asistencias marcadas por evento |
| `serviceTypes` | Reglas de tipo de servicio (aliases, color, precioHora) |
| `reports` | (Reservado para reportes guardados) |
