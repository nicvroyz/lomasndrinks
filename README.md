# Lomas & Drinks - Plataforma de E-commerce y Reservas

![Lomas & Drinks](assets/images/logo.png)

Una plataforma premium de comercio electrónico y gestión de reservas de coctelería a domicilio para **Lomas & Drinks**, diseñada con una experiencia visual inmersiva, pasarela de pagos integrada en producción real (Flow) y panel de control administrativo en tiempo real.

---

## 📋 Índice
1. [Contexto del Proyecto](#-contexto-del-proyecto)
2. [Características Principales](#-características-principales)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Variables de Entorno](#-variables-de-entorno)
6. [Instalación y Configuración](#-instalación-y-configuración)
7. [Despliegue en Producción](#-despliegue-en-producción)

---

## 🌟 Contexto del Proyecto
Lomas & Drinks es una marca exclusiva de coctelería y bebidas premium. Este desarrollo provee una solución integral que combina:
* Un frontend moderno enfocado en la experiencia de usuario (UX) con micro-animaciones, estética oscura con acentos vibrantes, y un minijuego interactivo ("Tragamonedas / Slot Machine") para conseguir cupones de descuento.
* Un backend robusto y seguro en Node.js que actúa como puente de pago cifrado y webhook de confirmación.
* Un panel de administración avanzado para monitoreo de pedidos, despachos, estadísticas clave y alertas sonoras de nuevas ventas en tiempo real.

---

## ✨ Características Principales

### 🛒 E-commerce & Checkout Seguro
* **Catálogo interactivo** con categorías de productos y carrito flotante interactivo.
* **Integración con Flow (Producción)**: Procesamiento seguro de pagos a través de Webpay, Servipag y Multicaja. La comunicación con Flow se firma criptográficamente (`HMAC-SHA256`) desde el backend para evitar alteraciones de precios en el cliente.
* **Pantalla de Carga Premium**: Animación fluida de redirección durante el checkout para generar confianza en el comprador.

### 📅 Reservas & Validación Dinámica
* Agenda interactiva con asignación de bloques horarios y validación en tiempo real.
* Evita el agendamiento duplicado e inconsistencias de fechas (optimizado con soporte multi-navegador e iOS/Safari).

### 🔒 Panel de Administración en Tiempo Real
* Conexión directa a **Firebase Firestore** para escuchar pedidos entrantes al instante.
* Notificaciones acústicas automáticas (utilizando Web Audio API) cada vez que se registra un nuevo pago.
* Gráficos dinámicos de ingresos y estadísticas clave en el panel de control.
* Herramientas administrativas para cambio de estado de entrega y limpieza segura de bases de datos.

### ⏳ Pantalla de Pre-Lanzamiento (Countdown)
* Bloqueo público mediante overlay temporizado configurado para la hora oficial de Chile continental.
* Bypass para desarrolladores y administradores mediante parámetro de URL seguro (`?preview=true`).

---

## 💻 Stack Tecnológico

### Frontend (Cliente)
* **HTML5 & Vanilla CSS3**: Diseño responsivo y moderno (glassmorphism, gradientes suaves y variables de CSS para fácil tematización).
* **JavaScript (ES6+)**: Interactividad del carro de compras, slot-machine, countdown y llamadas de API.
* **Firebase Client SDK**: Lectura/escritura a base de datos de órdenes y control de autenticación.

### Backend (Servidor)
* **Node.js & Express**: Servidor HTTP liviano para endpoints de API y procesamiento de webhooks.
* **Firebase Admin SDK**: Operaciones privilegiadas (actualización de estados de pago confirmados directamente en Firestore).
* **Axios & Crypto**: Consumo del API de Flow y cálculo de firmas SHA256.
* **Dotenv**: Gestión segura de secretos de servidor.

---

## 📁 Estructura del Proyecto

```bash
lomasdrinks/
├── assets/                  # Recursos estáticos
│   ├── audio/               # Efectos de sonido (notificación de ventas)
│   └── images/              # Logotipos, banners y fotos de productos
├── scripts/                 # Lógica de Javascript (Frontend)
│   ├── admin.js             # Controlador del Panel de Administración
│   ├── app.js               # Carrito, Flow Checkout y Calendario
│   ├── firebase-config.js   # Inicialización y reglas de Firebase
│   └── slot-machine.js      # Lógica de la ruleta de descuento
├── styles/                  # Hojas de estilo CSS
│   ├── admin.css            # Estilo del panel de control
│   └── main.css             # Estilo del e-commerce general
├── scratch/                 # Scripts auxiliares y de mantenimiento
│   ├── clean_public.js      # Script REST para limpieza de base de datos
│   └── delete_data.js       # Script Admin SDK para limpieza profunda
├── index.html               # Página de inicio del E-commerce
├── login.html               # Acceso de Administradores
├── admin.html               # Panel de Administración
├── server.js                # Servidor backend (Express)
├── package.json             # Dependencias de Node.js
├── .gitignore               # Exclusiones de Git
└── README.md                # Documentación del proyecto
```

---

## 🔑 Variables de Entorno

El backend requiere configurar un archivo `.env` en la raíz del proyecto para interactuar con las pasarelas de pago y la base de datos de forma segura.

> [!IMPORTANT]
> **Nunca** subas el archivo `.env` a repositorios públicos como GitHub. Ya se encuentra configurado en `.gitignore`.

Crea un archivo `.env` con la siguiente estructura:

```env
PORT=3000
BASE_URL=http://localhost:3000

# Credenciales de Flow (Producción)
FLOW_API_KEY=tu_api_key_de_flow
FLOW_SECRET_KEY=tu_secret_key_de_flow
FLOW_API_URL=https://www.flow.cl/api

# Credenciales Firebase Admin SDK (Para Confirmar Pedidos en la base de datos)
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=tu-email-de-servicio-firebase
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_clave_privada\n-----END PRIVATE KEY-----\n"
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos
* [Node.js](https://nodejs.org/) (Versión 16 o superior recomendada)
* Cuenta activa en [Flow](https://www.flow.cl/) (producción o sandbox)
* Proyecto configurado en [Firebase Console](https://console.firebase.google.com/) con Firestore habilitado.

### Configuración Paso a Paso

1. **Clonar el Repositorio**
   ```bash
   git clone https://github.com/nicvroyz/lomasndrinks.git
   cd lomasndrinks
   ```

2. **Instalar Dependencias**
   ```bash
   npm install
   ```

3. **Configurar Entorno**
   Crea y edita tu archivo `.env` siguiendo las indicaciones del apartado anterior.

4. **Ejecutar en Desarrollo**
   ```bash
   npm start
   ```
   El servidor se iniciará en `http://localhost:3000`.

---

## ☁️ Despliegue en Producción

Para desplegar en servicios en la nube (Render, Railway, VPS, etc.):

1. Configura el comando de arranque como `npm start`.
2. Define las variables de entorno detalladas en el apartado **Variables de Entorno** desde la consola de configuración del proveedor de hosting.
3. Asegúrate de modificar la variable `BASE_URL` en las variables de entorno de producción para que apunte a tu dominio real (ej. `https://lomasdrinks.cl`). Esto le indica a Flow a dónde retornar a los usuarios y dónde enviar las notificaciones asíncronas de pagos (webhook).
