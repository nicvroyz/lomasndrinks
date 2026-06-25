// ============================================
// LOMAS & DRINKS — Firebase Configuration
// ============================================
// INSTRUCCIONES DE CONFIGURACIÓN:
// 1. Ve a https://console.firebase.google.com
// 2. Crea un nuevo proyecto (o usa uno existente)
// 3. Ve a Configuración del proyecto > General
// 4. En "Tus apps", haz clic en el ícono web (</>)
// 5. Registra la app y copia la configuración
// 6. Reemplaza los valores de abajo con tus credenciales
// 7. En Firestore Database, crea la base de datos en modo test
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyAiVzXDXaErPhNOWWwPnqqZ_SK-Ic2CSik",
  authDomain: "lomasdrinks-f6b29.firebaseapp.com",
  projectId: "lomasdrinks-f6b29",
  storageBucket: "lomasdrinks-f6b29.firebasestorage.app",
  messagingSenderId: "549347257193",
  appId: "1:549347257193:web:2aa79585003bb6b5f0abf8",
  measurementId: "G-W9W56CSH7P"
};

// Initialize Firebase
let db = null;
let firebaseReady = false;

async function initFirebase() {
  try {
    // Check if using dummy config
    if (firebaseConfig.apiKey === "TU_API_KEY_AQUI") {
      console.warn('⚠️ Firebase no configurado (usando credenciales por defecto). Los pedidos se guardarán localmente.');
      firebaseReady = false;
      return null;
    }

    // Dynamic import of Firebase modules from CDN
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    window.firebaseApp = app; // Expose globally for Auth
    window.db = db;
    firebaseReady = true;
    console.log('✅ Firebase conectado exitosamente');
    return db;
  } catch (error) {
    console.warn('⚠️ Firebase no configurado. Los pedidos se guardarán localmente.', error);
    firebaseReady = false;
    return null;
  }
}
