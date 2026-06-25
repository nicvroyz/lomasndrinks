require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and parsers
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// Initialize Firebase Admin (optional, for Firestore automation)
let db = null;
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', err);
  }
} else {
  console.warn('⚠️ Firebase Admin env variables missing. Firestore orders will not be updated automatically.');
}

// Flow Credentials
const FLOW_API_KEY = process.env.FLOW_API_KEY;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY;
const FLOW_API_URL = process.env.FLOW_API_URL || 'https://www.flow.cl/api';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Helper: Generate Flow signature
function generateSignature(params, secretKey) {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map(key => key + params[key]).join('');
  return crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');
}

// Helper: Query payment status in Flow
async function getFlowPaymentStatus(token) {
  const params = {
    apiKey: FLOW_API_KEY,
    token: token
  };
  params.s = generateSignature(params, FLOW_SECRET_KEY);
  
  const searchParams = new URLSearchParams(params);
  const response = await axios.get(`${FLOW_API_URL}/payment/getStatus?${searchParams.toString()}`);
  return response.data;
}

// Helper: Update order status in Firestore
async function updateOrderStatus(orderNumber, isPaid) {
  if (!db) {
    console.warn(`[Firestore] Skipping DB update for order ${orderNumber}. Firebase Admin not configured.`);
    return false;
  }
  
  try {
    const ordersRef = db.collection('orders');
    const q = ordersRef.where('orderNumber', '==', orderNumber).limit(1);
    const snapshot = await q.get();
    
    if (snapshot.empty) {
      console.error(`[Firestore] Order ${orderNumber} not found in database.`);
      return false;
    }
    
    const docId = snapshot.docs[0].id;
    const orderDoc = ordersRef.doc(docId);
    
    if (isPaid) {
      await orderDoc.update({
        'payment.status': 'paid',
        'status': 'confirmed',
        'updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[Firestore] Order ${orderNumber} successfully updated to 'confirmed' / 'paid'.`);
    } else {
      await orderDoc.update({
        'payment.status': 'rejected',
        'status': 'cancelled',
        'updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[Firestore] Order ${orderNumber} updated to 'cancelled' / 'rejected'.`);
    }
    return true;
  } catch (err) {
    console.error(`[Firestore] Error updating order ${orderNumber}:`, err);
    return false;
  }
}

// ═══════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════

// 1. Create Payment Session in Flow
app.post('/api/create-payment', async (req, res) => {
  const { orderNumber, amount, email } = req.body;
  
  if (!orderNumber || !amount || !email) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios (orderNumber, amount, email)' });
  }
  
  console.log(`[Flow] Creating payment for Order ${orderNumber}, Amount: $${amount}, Email: ${email}`);
  
  try {
    const params = {
      apiKey: FLOW_API_KEY,
      commerceOrder: orderNumber,
      subject: `Pedido ${orderNumber} - Lomas & Drinks`,
      currency: 'CLP',
      amount: Math.round(parseFloat(amount)),
      email: email,
      urlConfirmation: `${BASE_URL}/api/payment-webhook`,
      urlReturn: `${BASE_URL}/api/payment-return`
    };
    
    // Sign parameters
    params.s = generateSignature(params, FLOW_SECRET_KEY);
    
    // Prepare body
    const body = new URLSearchParams(params);
    
    // Call Flow API
    const response = await axios.post(`${FLOW_API_URL}/payment/create`, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.data && response.data.url && response.data.token) {
      const redirectUrl = `${response.data.url}?token=${response.data.token}`;
      console.log(`[Flow] Payment session created successfully for order ${orderNumber}. Token: ${response.data.token}`);
      return res.json({ redirectUrl, token: response.data.token });
    } else {
      console.error('[Flow] Invalid response structure from Flow API:', response.data);
      return res.status(500).json({ error: 'Respuesta inválida de la pasarela de pagos.' });
    }
  } catch (err) {
    console.error('[Flow] Error creating Flow payment:', err.response ? err.response.data : err.message);
    const flowErrMsg = err.response && err.response.data && err.response.data.message 
      ? err.response.data.message 
      : err.message;
    return res.status(500).json({ error: flowErrMsg });
  }
});

// 2. Flow Webhook (Asynchronous Confirmation)
app.post('/api/payment-webhook', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    console.warn('[Webhook] Received webhook POST without token parameter.');
    return res.status(400).send('Missing token parameter');
  }
  
  console.log(`[Webhook] Received payment notification webhook. Token: ${token}`);
  
  try {
    const statusData = await getFlowPaymentStatus(token);
    const orderNumber = statusData.commerceOrder;
    const paymentStatus = parseInt(statusData.status); // 2 = Success, 3 = Rejected, 4 = Cancelled
    
    console.log(`[Webhook] Flow payment status for Order ${orderNumber} is: ${paymentStatus}`);
    
    if (paymentStatus === 2) {
      await updateOrderStatus(orderNumber, true);
    } else if (paymentStatus === 3 || paymentStatus === 4) {
      await updateOrderStatus(orderNumber, false);
    }
    
    // Flow requires an HTTP 200 response to confirm receipt
    return res.status(200).send('OK');
  } catch (err) {
    console.error('[Webhook] Error processing payment webhook:', err.message);
    // Respond 200 even on error so Flow doesn't retry infinitely if it's a configuration issue
    return res.status(200).send('Error but acknowledged');
  }
});

// 3. Flow Return Redirect (User Navigation Callback)
app.post('/api/payment-return', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    console.warn('[Return] Received payment return redirect without token body parameter.');
    return res.redirect('/?payment=failed');
  }
  
  console.log(`[Return] User returned from Flow checkout. Token: ${token}`);
  
  try {
    const statusData = await getFlowPaymentStatus(token);
    const orderNumber = statusData.commerceOrder;
    const paymentStatus = parseInt(statusData.status);
    
    if (paymentStatus === 2) {
      console.log(`[Return] Payment succeeded for order ${orderNumber}. Redirecting user to success page.`);
      // Update Firestore locally just in case webhook is delayed
      await updateOrderStatus(orderNumber, true);
      return res.redirect(`/?payment=success&orderNumber=${orderNumber}`);
    } else {
      console.log(`[Return] Payment failed/cancelled for order ${orderNumber}. Redirecting user to fail page.`);
      await updateOrderStatus(orderNumber, false);
      return res.redirect(`/?payment=failed&orderNumber=${orderNumber}`);
    }
  } catch (err) {
    console.error('[Return] Error verifying return details:', err.message);
    return res.redirect('/?payment=failed');
  }
});

// Catch-all route to serve e-commerce main page for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 e-Commerce Server running in production mode at: ${BASE_URL}`);
});
