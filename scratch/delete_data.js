require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const admin = require('firebase-admin');

// Check if credentials exist
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ Error: Faltan variables de entorno de Firebase Admin en el archivo .env.');
  console.log('Por favor, define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en tu .env para poder ejecutar esta limpieza.');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
  console.log('✅ Firebase Admin SDK conectado con éxito.');
} catch (err) {
  console.error('❌ Error al inicializar Firebase Admin SDK:', err.message);
  process.exit(1);
}

const db = admin.firestore();

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject);
  });
}

async function deleteQueryBatch(db, query, resolve, reject) {
  try {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
      resolve(0);
      return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`[Limpieza] Eliminados ${batchSize} documentos de esta tanda...`);
    
    // Recurse on the next batch
    process.nextTick(() => {
      deleteQueryBatch(db, query, (count) => resolve(count + batchSize), reject);
    });
  } catch (err) {
    reject(err);
  }
}

async function main() {
  const collections = ['orders', 'launch_attempts', 'launch_coupons'];
  console.log('⏳ Iniciando limpieza de base de datos para producción...');
  
  for (const col of collections) {
    console.log(`\nLimpiando colección: "${col}"...`);
    try {
      const count = await deleteCollection(col);
      console.log(`✨ Colección "${col}" totalmente limpia. Se eliminaron ${count} documentos.`);
    } catch (err) {
      console.error(`❌ Error al limpiar colección "${col}":`, err.message);
    }
  }
  
  console.log('\n🎉 ¡Limpieza de base de datos de prueba finalizada!');
  process.exit(0);
}

main();
