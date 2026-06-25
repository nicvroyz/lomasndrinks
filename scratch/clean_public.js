const axios = require('axios');

const PROJECT_ID = 'lomasdrinks-f6b29';
const COLLECTIONS = ['orders', 'launch_attempts', 'launch_coupons'];
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function fetchDocuments(collection) {
  try {
    const url = `${BASE_URL}/${collection}`;
    const response = await axios.get(url);
    if (response.data && response.data.documents) {
      return response.data.documents.map(doc => {
        // The name field has the full path: projects/PROJECT_ID/databases/(default)/documents/COLLECTION/DOC_ID
        const parts = doc.name.split('/');
        return parts[parts.length - 1];
      });
    }
    return [];
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Collection empty or not exists
      return [];
    }
    throw err;
  }
}

async function deleteDocument(collection, docId) {
  const url = `${BASE_URL}/${collection}/${docId}`;
  await axios.delete(url);
  console.log(`[REST] Deleted document ${docId} from collection '${collection}'`);
}

async function cleanAll() {
  console.log('⏳ Intentando vaciar colecciones de prueba vía REST...');
  
  for (const col of COLLECTIONS) {
    console.log(`\nColección: "${col}"...`);
    try {
      const docIds = await fetchDocuments(col);
      console.log(`Encontrados ${docIds.length} documentos.`);
      
      if (docIds.length === 0) {
        console.log('Nada que eliminar.');
        continue;
      }
      
      for (const id of docIds) {
        await deleteDocument(col, id);
      }
      console.log(`✨ Colección "${col}" limpia.`);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`⚠️ Permiso denegado (403) al limpiar "${col}". Tus reglas de seguridad ya están bloqueadas (¡Excelente!).`);
      } else {
        console.error(`❌ Error al procesar "${col}":`, err.message);
      }
    }
  }
  
  console.log('\n🎉 Proceso finalizado.');
}

cleanAll();
