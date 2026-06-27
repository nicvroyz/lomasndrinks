// ============================================
// LOMAS & DRINKS — Admin Panel Controller
// ============================================

(function () {
  'use strict';

  // ---- State ----
  const state = {
    orders: [],
    currentFilter: 'all',
    selectedOrderId: null,
    currentWaPhone: null,
    soundEnabled: false,
    audioCtx: null,
    isFirstSnapshot: true,
    unsubscribe: null,
    manualCart: {},
    firestoreModule: null,
  };

  const PRODUCTS = {
    'tropiconce': { id: 'tropiconce', name: 'Tropiconce', price: 10000, image: 'assets/images/tropiconce.png' },
    'pink-fantasy': { id: 'pink-fantasy', name: 'Pink Fantasy', price: 10000, image: 'assets/images/pink_fantasy.png' },
    'promo-piscola': { id: 'promo-piscola', name: 'Promo Piscola Normal', price: 20000, image: 'assets/images/piscola.png' },
    'promo-piscola-3l': { id: 'promo-piscola-3l', name: 'Promo Piscola Agrandada', price: 22000, image: 'assets/images/piscola.png' },
    'promo-manzana': { id: 'promo-manzana', name: 'Promo Pisco Manzana', price: 27000, image: 'assets/images/manzana.png' },
    'promo-manzana-3l': { id: 'promo-manzana-3l', name: 'Promo Manzana Agrandada', price: 29000, image: 'assets/images/manzana.png' },
    'pack-escudo-silver': { id: 'pack-escudo-silver', name: 'Six Pack Escudo Silver', price: 7000, image: 'assets/images/escudo_silver.png' },
    'pack-escudo': { id: 'pack-escudo', name: 'Six Pack Escudo', price: 9000, image: 'assets/images/escudo.png' },
    'pack-cristal': { id: 'pack-cristal', name: 'Six Pack Cristal', price: 9000, image: 'assets/images/cristal.png' },
    'pack-royal': { id: 'pack-royal', name: 'Six Pack Royal Guard', price: 10500, image: 'assets/images/royal.png' },
    'pack-heineken': { id: 'pack-heineken', name: 'Six Pack Heineken', price: 10500, image: 'assets/images/heineken.png' }
  };

  // ---- DOM Cache ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    connectionStatus: $('#connectionStatus'),
    statusDot: $('#connectionStatus .status-dot'),
    statusText: $('#connectionStatus .status-text'),
    btnSound: $('#btnSound'),
    soundLabel: $('#btnSound .sound-label'),
    setupBanner: $('#setupBanner'),
    setupDismiss: $('#setupDismiss'),
    statTotalOrders: $('#statTotalOrders'),
    statPendingOrders: $('#statPendingOrders'),
    statRevenue: $('#statRevenue'),
    statDelivered: $('#statDelivered'),
    countNew: $('#countNew'),
    filterTabs: $('#filterTabs'),
    ordersContainer: $('#ordersContainer'),
    emptyState: $('#emptyState'),
    // Modal
    orderModal: $('#orderModal'),
    modalClose: $('#modalClose'),
    modalOrderNumber: $('#modalOrderNumber'),
    modalStatus: $('#modalStatus'),
    modalCustomerName: $('#modalCustomerName'),
    modalCustomerPhone: $('#modalCustomerPhone'),
    modalCustomerAddress: $('#modalCustomerAddress'),
    modalCustomerReference: $('#modalCustomerReference'),
    modalCustomerComments: $('#modalCustomerComments'),
    modalItemsList: $('#modalItemsList'),
    modalPaymentMethod: $('#modalPaymentMethod'),
    modalPaymentStatus: $('#modalPaymentStatus'),
    modalTotal: $('#modalTotal'),
    modalCreatedAt: $('#modalCreatedAt'),
    modalUpdatedAt: $('#modalUpdatedAt'),
    modalActions: $('#modalActions'),
    waModal: $('#waModal'),
    waModalClose: $('#waModalClose'),
    waModalText: $('#waModalText'),
    waModalSend: $('#waModalSend'),
    btnNewOrder: $('#btnNewOrder'),
    manualModal: $('#manualModal'),
    manualModalClose: $('#manualModalClose'),
    manName: $('#manName'),
    manPhone: $('#manPhone'),
    manAddress: $('#manAddress'),
    manReference: $('#manReference'),
    manComments: $('#manComments'),
    manProductsList: $('#manProductsList'),
    manPayment: $('#manPayment'),
    manDelivery: $('#manDelivery'),
    manTotalLabel: $('#manTotalLabel'),
    manSubmit: $('#manSubmit'),
    btnLogout: $('#btnLogout'),
    btnClearTestData: $('#btnClearTestData'),
    
    // History & User Menu
    userMenu: $('#userMenu'),
    btnUserToggle: $('#btnUserToggle'),
    btnHistory: $('#btnHistory'),
    historyModal: $('#historyModal'),
    historyModalClose: $('#historyModalClose'),
    historyStart: $('#historyStart'),
    historyEnd: $('#historyEnd'),
    btnSearchHistory: $('#btnSearchHistory'),
    historyResults: $('#historyResults'),
    historyTotalRevenue: $('#historyTotalRevenue')
  };

  // ---- Status Labels ----
  const STATUS_LABELS = {
    new: 'Nuevo',
    confirmed: 'Confirmado',
    preparing: 'En Preparación',
    delivering: 'En Camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  const STATUS_FLOW = ['new', 'confirmed', 'preparing', 'delivering', 'delivered'];

  const PAYMENT_LABELS = {
    flow: 'Flow',
    transfer: 'Transferencia',
  };

  const PAYMENT_STATUS_LABELS = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
  };


  // ============================================
  // INITIALIZATION
  // ============================================
  async function init() {
    // ---- CACHE BUSTING INJECTION ----
    // Si el HTML está cacheado y no tiene el menú de usuario, lo inyectamos
    const headerRight = $('.header-right');
    if (headerRight && !$('#userMenu')) {
      // Remove old buttons if they exist directly in headerRight to avoid duplicates
      const oldBtnHistory = $('#btnHistory');
      if (oldBtnHistory && oldBtnHistory.parentNode === headerRight) oldBtnHistory.remove();
      const oldBtnLogout = $('#btnLogout');
      if (oldBtnLogout && oldBtnLogout.parentNode === headerRight) oldBtnLogout.remove();

      headerRight.insertAdjacentHTML('beforeend', `
        <div class="user-menu" id="userMenu">
          <button class="user-btn" id="btnUserToggle">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Administrador
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 0.2rem;"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="dropdown-content">
            <div class="dropdown-item" id="btnHistory">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Historial de Ventas
            </div>
            <div class="dropdown-item danger" id="btnLogout">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Cerrar Sesión
            </div>
          </div>
        </div>
      `);
      dom.userMenu = $('#userMenu');
      dom.btnUserToggle = $('#btnUserToggle');
      dom.btnHistory = $('#btnHistory');
      dom.btnLogout = $('#btnLogout');
      
      if (dom.btnHistory) dom.btnHistory.addEventListener('click', openHistoryModal);
      bindLogout();
    }

    if (!$('#btnNewOrder')) {
      if (headerRight) {
        headerRight.insertAdjacentHTML('beforeend', `
          <button class="btn btn-action" id="btnNewOrder" style="display: flex; align-items: center; gap: 0.5rem; background: var(--gold); color: var(--bg-primary); border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; z-index: 9999;">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nuevo Pedido
          </button>
        `);
        dom.btnNewOrder = $('#btnNewOrder');
      }

      if (!$('#historyModal')) {
        document.body.insertAdjacentHTML('beforeend', `
          <!-- HISTORY MODAL CACHE BUST INJECTION -->
          <div class="modal-overlay" id="historyModal" style="display: none; z-index: 9000;">
            <div class="modal-content" style="max-width: 800px; padding: 0; overflow: hidden; max-height: 90vh; display: flex; flex-direction: column;">
              <div class="modal-header" style="padding: 1.5rem; background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle);">
                <h2 class="modal-title" style="display: flex; align-items: center; gap: 0.5rem;">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Historial de Ventas
                </h2>
                <button class="modal-close" id="historyModalClose">&times;</button>
              </div>
              <div class="modal-body" style="padding: 1.5rem; overflow-y: auto;">
                <div style="display: flex; gap: 1rem; align-items: flex-end; margin-bottom: 2rem; background: var(--bg-primary); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-subtle);">
                  <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">Desde</label>
                    <input type="date" id="historyStart" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-subtle); background: var(--bg-card); color: var(--text-primary); outline: none;">
                  </div>
                  <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">Hasta</label>
                    <input type="date" id="historyEnd" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-subtle); background: var(--bg-card); color: var(--text-primary); outline: none;">
                  </div>
                  <button id="btnSearchHistory" class="btn btn-action primary" style="background: var(--gold); color: var(--bg-primary); border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: bold; cursor: pointer; height: 46px;">Buscar</button>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <h3 style="margin: 0;">Resultados</h3>
                  <div style="font-size: 1.2rem; font-weight: bold; color: var(--gold);" id="historyTotalRevenue">$0</div>
                </div>
                <div id="historyResults" style="display: flex; flex-direction: column; gap: 1rem;">
                  <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">Selecciona un rango de fechas.</div>
                </div>
              </div>
            </div>
          </div>
        `);
        dom.historyModal = $('#historyModal');
        dom.historyModalClose = $('#historyModalClose');
        dom.historyStart = $('#historyStart');
        dom.historyEnd = $('#historyEnd');
        dom.btnSearchHistory = $('#btnSearchHistory');
        dom.historyResults = $('#historyResults');
        dom.historyTotalRevenue = $('#historyTotalRevenue');

        if (dom.btnSearchHistory) dom.btnSearchHistory.addEventListener('click', fetchHistory);
        if (dom.historyModalClose) dom.historyModalClose.addEventListener('click', closeHistoryModal);
      }

      if (!$('#manualModal')) {
        document.body.insertAdjacentHTML('beforeend', `
          <div class="modal-overlay" id="manualModal" style="display: none; z-index: 9000;">
            <div class="modal-content" style="max-width: 600px; padding: 0; overflow: hidden; max-height: 90vh; display: flex; flex-direction: column;">
              <div class="modal-header" style="padding: 1.5rem; background: var(--bg-elevated); border-bottom: 1px solid var(--border);">
                <h2 class="modal-title" style="display: flex; align-items: center; gap: 0.5rem;">
                  Nuevo Pedido Manual
                </h2>
                <button class="modal-close" id="manualModalClose">&times;</button>
              </div>
              <div class="modal-body" style="padding: 1.5rem; overflow-y: auto;">
                <div class="form-group"><label>Nombre</label><input type="text" id="manName" style="width: 100%; padding: 0.5rem;" required></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="manPhone" style="width: 100%; padding: 0.5rem;" required></div>
                <div class="form-group"><label>Dirección</label><input type="text" id="manAddress" style="width: 100%; padding: 0.5rem;" required></div>
                <div class="form-group"><label>Referencia</label><input type="text" id="manReference" style="width: 100%; padding: 0.5rem;"></div>
                <div class="form-group"><label>Comentarios</label><textarea id="manComments" style="width: 100%; padding: 0.5rem;"></textarea></div>
                <div id="manProductsList" style="margin: 1rem 0;"></div>
                <div style="display:flex; gap:1rem;">
                  <div style="flex:1"><label>Pago</label><select id="manPayment" style="width: 100%; padding: 0.5rem;"><option value="transfer">Transferencia</option><option value="cash">Efectivo</option></select></div>
                  <div style="flex:1"><label>Envío</label><input type="number" id="manDelivery" value="0" style="width: 100%; padding: 0.5rem;"></div>
                </div>
                <div class="modal-total" style="font-size:1.2rem; margin-top:1rem; font-weight:bold;">Total: <span id="manTotalLabel">$0</span></div>
              </div>
              <div class="modal-actions" style="padding: 1.5rem;">
                <button class="btn btn-action primary" id="manSubmit" style="width: 100%; padding: 1rem; background: var(--gold); color: var(--bg-primary); border: none; font-weight: bold; border-radius: 8px;">Crear Pedido</button>
              </div>
            </div>
          </div>
        `);
        dom.manualModal = $('#manualModal');
        dom.manualModalClose = $('#manualModalClose');
        dom.manName = $('#manName');
        dom.manPhone = $('#manPhone');
        dom.manAddress = $('#manAddress');
        dom.manReference = $('#manReference');
        dom.manComments = $('#manComments');
        dom.manProductsList = $('#manProductsList');
        dom.manPayment = $('#manPayment');
        dom.manDelivery = $('#manDelivery');
        dom.manTotalLabel = $('#manTotalLabel');
        dom.manSubmit = $('#manSubmit');
        
        // Bind events since they were skipped
        dom.btnNewOrder.addEventListener('click', openManualModal);
        dom.manualModalClose.addEventListener('click', closeManualModal);
        dom.manDelivery.addEventListener('input', updateManualTotal);
        dom.manSubmit.addEventListener('click', submitManualOrder);
      }
    }

    bindEvents();
    await connectFirebase();
    
    // Ejecutar el guard de autenticación si existe y firebase cargó
    if (window.firebaseApp && window.checkAuthGuard) {
      window.checkAuthGuard(window.firebaseApp);
    } else {
      // Si falló Firebase o no hay guard, mostramos el body de todas formas para el modo demo
      document.body.style.display = 'block';
    }
  }

  async function connectFirebase() {
    // Check if firebase-config.js is loaded and has real config
    if (typeof firebaseConfig === 'undefined' || typeof initFirebase === 'undefined') {
      showFallbackMode();
      return;
    }

    const isPlaceholder = firebaseConfig.apiKey === 'TU_API_KEY_AQUI' ||
                          firebaseConfig.projectId === 'tu-proyecto';

    if (isPlaceholder) {
      showFallbackMode();
      return;
    }

    try {
      await initFirebase();

      if (!firebaseReady || !db) {
        showFallbackMode();
        return;
      }

      // Import Firestore functions for use throughout the app
      state.firestoreModule = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

      setConnectionStatus('online', 'Conectado');
      startRealtimeListener();
    } catch (err) {
      console.error('Error connecting to Firebase:', err);
      showFallbackMode();
    }
  }

  function showFallbackMode() {
    dom.setupBanner.style.display = 'block';
    setConnectionStatus('demo', 'Modo Demo');
    loadDemoOrders();
  }

  function setConnectionStatus(status, text) {
    dom.statusDot.className = 'status-dot ' + status;
    dom.statusText.textContent = text;
  }


  // ============================================
  // FIREBASE REAL-TIME LISTENER
  // ============================================
  function startRealtimeListener() {
    const { collection, onSnapshot, query, orderBy } = state.firestoreModule;

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    state.unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrderIds = [];

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !state.isFirstSnapshot) {
          newOrderIds.push(change.doc.id);
        }
      });

      // Build orders array
      state.orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      renderOrders(newOrderIds);
      updateStats();

      // Play sound for new orders (not on initial load)
      if (newOrderIds.length > 0 && !state.isFirstSnapshot) {
        playNotificationSound();
      }

      state.isFirstSnapshot = false;
    }, (error) => {
      console.error('Firestore listener error:', error);
      setConnectionStatus('offline', 'Error de conexión');
    });
  }


  // ============================================
  // DEMO / FALLBACK
  // ============================================
  function loadDemoOrders() {
    // Load from localStorage if any orders were saved from the main site
    const stored = localStorage.getItem('lomas_orders');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        state.orders = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        state.orders = [];
      }
    }

    if (state.orders.length === 0) {
      state.orders = generateDemoOrders();
    }

    // Sort by createdAt descending
    state.orders.sort((a, b) => {
      const ta = a.createdAt?.seconds || a.createdAt || 0;
      const tb = b.createdAt?.seconds || b.createdAt || 0;
      return tb - ta;
    });

    state.isFirstSnapshot = false;
    renderOrders([]);
    updateStats();
  }

  function generateDemoOrders() {
    const now = Date.now();
    return [
      {
        id: 'demo-1',
        orderNumber: 'LD-0001',
        items: [
          { id: 'tropiconce', name: 'Tropiconce', price: 5990, quantity: 2, image: 'assets/images/tropiconce.png' },
        ],
        customer: {
          name: 'María González',
          phone: '+56 9 1234 5678',
          address: 'Av. Los Carreras 1234, Concepción',
          reference: 'Casa azul con reja negra',
          comments: 'Sin hielo por favor',
        },
        payment: { method: 'flow', status: 'confirmed' },
        total: 11980,
        status: 'new',
        createdAt: { seconds: Math.floor(now / 1000) - 300 },
        updatedAt: { seconds: Math.floor(now / 1000) - 300 },
      },
      {
        id: 'demo-2',
        orderNumber: 'LD-0002',
        items: [
          { id: 'pink-fantasy', name: 'Pink Fantasy', price: 5990, quantity: 1, image: 'assets/images/pink-fantasy.png' },
          { id: 'tropiconce', name: 'Tropiconce', price: 5990, quantity: 1, image: 'assets/images/tropiconce.png' },
        ],
        customer: {
          name: 'Carlos Muñoz',
          phone: '+56 9 8765 4321',
          address: 'Calle Tucapel 567, Concepción',
          reference: 'Depto 302, edificio gris',
          comments: '',
        },
        payment: { method: 'transfer', status: 'pending' },
        total: 11980,
        status: 'confirmed',
        createdAt: { seconds: Math.floor(now / 1000) - 1800 },
        updatedAt: { seconds: Math.floor(now / 1000) - 900 },
      },
      {
        id: 'demo-3',
        orderNumber: 'LD-0003',
        items: [
          { id: 'tropiconce', name: 'Tropiconce', price: 5990, quantity: 3, image: 'assets/images/tropiconce.png' },
        ],
        customer: {
          name: 'Valentina Soto',
          phone: '+56 9 5555 1234',
          address: 'Barros Arana 890, Concepción',
          reference: 'Frente al mall',
          comments: 'Llamar al llegar',
        },
        payment: { method: 'flow', status: 'confirmed' },
        total: 17970,
        status: 'preparing',
        createdAt: { seconds: Math.floor(now / 1000) - 3600 },
        updatedAt: { seconds: Math.floor(now / 1000) - 1200 },
      },
      {
        id: 'demo-4',
        orderNumber: 'LD-0004',
        items: [
          { id: 'pink-fantasy', name: 'Pink Fantasy', price: 5990, quantity: 2, image: 'assets/images/pink-fantasy.png' },
        ],
        customer: {
          name: 'Andrés Pérez',
          phone: '+56 9 3333 7777',
          address: 'San Martín 456, Concepción',
          reference: '',
          comments: '',
        },
        payment: { method: 'transfer', status: 'confirmed' },
        total: 11980,
        status: 'delivered',
        createdAt: { seconds: Math.floor(now / 1000) - 7200 },
        updatedAt: { seconds: Math.floor(now / 1000) - 3600 },
      },
    ];
  }


  // ============================================
  // RENDERING
  // ============================================
  function renderOrders(newOrderIds = []) {
    const filtered = getFilteredOrders();

    if (filtered.length === 0) {
      dom.ordersContainer.innerHTML = '';
      dom.ordersContainer.appendChild(createEmptyState());
      return;
    }

    dom.ordersContainer.innerHTML = '';

    filtered.forEach((order) => {
      const card = createOrderCard(order, newOrderIds.includes(order.id));
      dom.ordersContainer.appendChild(card);
    });
  }

  function getFilteredOrders() {
    if (state.currentFilter === 'all') return state.orders;
    return state.orders.filter((o) => o.status === state.currentFilter);
  }

  function createEmptyState() {
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.innerHTML = `
      <div class="empty-icon">🍹</div>
      <h3>No hay pedidos</h3>
      <p>${state.currentFilter === 'all'
        ? 'Los nuevos pedidos aparecerán aquí en tiempo real.'
        : 'No hay pedidos con el estado seleccionado.'}</p>
    `;
    return div;
  }

  function createOrderCard(order, isNew) {
    const card = document.createElement('div');
    card.className = 'order-card' + (isNew ? ' new-arrival' : '');
    card.dataset.status = order.status || 'new';
    card.dataset.orderId = order.id;

    const itemsSummary = (order.items || [])
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(', ');

    const time = formatTime(order.createdAt);
    const paymentLabel = PAYMENT_LABELS[order.payment?.method] || order.payment?.method || '—';

    card.innerHTML = `
      <span class="order-number">${escapeHtml(order.orderNumber || '—')}</span>
      <div class="order-info">
        <span class="order-customer">${escapeHtml(order.customer?.name || 'Sin nombre')}</span>
        <span class="order-items-summary">${escapeHtml(itemsSummary || 'Sin productos')}</span>
      </div>
      <span class="order-total">${formatCurrency(order.total)}</span>
      <span class="status-badge ${order.status || 'new'}">${STATUS_LABELS[order.status] || order.status}</span>
      <div class="order-time">
        ${time}
        <div class="order-payment-badge">${escapeHtml(paymentLabel)}</div>
      </div>
    `;

    card.addEventListener('click', () => openOrderModal(order.id));
    return card;
  }


  // ============================================
  // STATS
  // ============================================
  function updateStats() {
    const today = getTodayStart();

    const todayOrders = state.orders.filter((o) => {
      const ts = getTimestamp(o.createdAt);
      return ts >= today;
    });

    const pending = state.orders.filter((o) =>
      o.status === 'new' || o.status === 'confirmed'
    );

    const delivered = todayOrders.filter((o) => o.status === 'delivered');

    const revenue = todayOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const newCount = state.orders.filter((o) => o.status === 'new').length;

    dom.statTotalOrders.textContent = todayOrders.length;
    dom.statPendingOrders.textContent = pending.length;
    dom.statRevenue.textContent = formatCurrency(revenue);
    dom.statDelivered.textContent = delivered.length;
    dom.countNew.textContent = newCount;
  }


  // ============================================
  // MODAL
  // ============================================
  function openOrderModal(orderId) {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    state.selectedOrderId = orderId;

    dom.modalOrderNumber.textContent = `Pedido ${order.orderNumber || '#' + orderId}`;
    dom.modalStatus.className = 'status-badge ' + (order.status || 'new');
    dom.modalStatus.textContent = STATUS_LABELS[order.status] || order.status;

    // Customer
    const c = order.customer || {};
    dom.modalCustomerName.textContent = c.name || '—';
    dom.modalCustomerPhone.textContent = c.phone || '—';
    dom.modalCustomerAddress.textContent = c.address || '—';
    dom.modalCustomerReference.textContent = c.reference || '—';
    dom.modalCustomerComments.textContent = c.comments || '—';

    // Items
    dom.modalItemsList.innerHTML = '';
    (order.items || []).forEach((item) => {
      const div = document.createElement('div');
      div.className = 'modal-item';
      div.innerHTML = `
        <img class="modal-item-image" src="${escapeHtml(item.image || '')}" alt="${escapeHtml(item.name)}"
             onerror="this.style.display='none'">
        <div class="modal-item-info">
          <div class="modal-item-name">${escapeHtml(item.name)}</div>
          <div class="modal-item-qty">Cantidad: ${item.quantity || 1}</div>
        </div>
        <div class="modal-item-price">${formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
      `;
      dom.modalItemsList.appendChild(div);
    });

    // Payment
    dom.modalPaymentMethod.textContent =
      PAYMENT_LABELS[order.payment?.method] || order.payment?.method || '—';
    dom.modalPaymentStatus.textContent =
      PAYMENT_STATUS_LABELS[order.payment?.status] || order.payment?.status || '—';

    // Total
    dom.modalTotal.textContent = formatCurrency(order.total);

    // Timestamps
    dom.modalCreatedAt.textContent = 'Creado: ' + formatDateTime(order.createdAt);
    dom.modalUpdatedAt.textContent = 'Actualizado: ' + formatDateTime(order.updatedAt);

    // Actions
    renderModalActions(order);

    // Show modal
    dom.orderModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeOrderModal() {
    dom.orderModal.classList.remove('active');
    document.body.style.overflow = '';
    state.selectedOrderId = null;
  }

  function closeWaModal() {
    dom.waModal.classList.remove('active');
    setTimeout(() => {
      dom.waModal.style.display = 'none';
      state.currentWaPhone = null;
    }, 300);
  }

  function renderModalActions(order) {
    dom.modalActions.innerHTML = '';

    const status = order.status || 'new';
    const idx = STATUS_FLOW.indexOf(status);

    // Next status button
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      const nextStatus = STATUS_FLOW[idx + 1];
      const btn = document.createElement('button');
      btn.className = 'btn-action primary';
      btn.textContent = getActionLabel(nextStatus);
      btn.addEventListener('click', () => updateOrderStatus(order.id, nextStatus));
      dom.modalActions.appendChild(btn);
    }

    // Cancel button (only if not delivered or cancelled)
    if (status !== 'delivered' && status !== 'cancelled') {
      const btnCancel = document.createElement('button');
      btnCancel.className = 'btn-action danger';
      btnCancel.textContent = 'Cancelar Pedido';
      btnCancel.addEventListener('click', () => {
        if (confirm('¿Estás seguro de cancelar este pedido?')) {
          updateOrderStatus(order.id, 'cancelled');
        }
      });
      dom.modalActions.appendChild(btnCancel);
    }

    // Close button
    const btnClose = document.createElement('button');
    btnClose.className = 'btn-action secondary';
    btnClose.textContent = 'Cerrar';
    btnClose.addEventListener('click', closeOrderModal);
    dom.modalActions.appendChild(btnClose);

    // Manual Override / Edit Status
    const editContainer = document.createElement('div');
    editContainer.style.display = 'flex';
    editContainer.style.alignItems = 'center';
    editContainer.style.gap = '0.5rem';
    editContainer.style.marginTop = '0.5rem';
    editContainer.style.width = '100%';
    editContainer.style.paddingTop = '1rem';
    editContainer.style.borderTop = '1px solid var(--border)';

    const selectStatus = document.createElement('select');
    selectStatus.style.flex = '1';
    selectStatus.style.padding = '0.75rem 1rem';
    selectStatus.style.borderRadius = '8px';
    selectStatus.style.border = '1px solid var(--border-subtle)';
    selectStatus.style.background = 'rgba(255, 255, 255, 0.05)';
    selectStatus.style.color = 'var(--text)';
    selectStatus.style.fontSize = '0.95rem';
    selectStatus.style.outline = 'none';
    selectStatus.style.cursor = 'pointer';
    selectStatus.style.appearance = 'none';
    selectStatus.style.backgroundImage = 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")';
    selectStatus.style.backgroundRepeat = 'no-repeat';
    selectStatus.style.backgroundPosition = 'right 1rem top 50%';
    selectStatus.style.backgroundSize = '0.65rem auto';
    selectStatus.style.transition = 'border-color 0.3s ease';
    
    selectStatus.addEventListener('focus', () => selectStatus.style.borderColor = 'var(--accent)');
    selectStatus.addEventListener('blur', () => selectStatus.style.borderColor = 'var(--border-subtle)');

    const allStatuses = ['new', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'];
    allStatuses.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = STATUS_LABELS[st] || st;
      opt.style.background = '#1a1a1a'; // dark background for options dropdown
      if (st === status) opt.selected = true;
      selectStatus.appendChild(opt);
    });

    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-action';
    btnEdit.textContent = 'Forzar Estado';
    btnEdit.style.background = 'transparent';
    btnEdit.style.border = '1px solid var(--gold)';
    btnEdit.style.color = 'var(--gold)';
    btnEdit.style.padding = '0.75rem 1rem';
    btnEdit.style.borderRadius = '8px';
    btnEdit.style.fontWeight = '600';
    btnEdit.addEventListener('mouseover', () => {
      btnEdit.style.background = 'var(--gold)';
      btnEdit.style.color = 'var(--bg-card)';
    });
    btnEdit.addEventListener('mouseout', () => {
      btnEdit.style.background = 'transparent';
      btnEdit.style.color = 'var(--gold)';
    });
    btnEdit.addEventListener('click', () => {
      const selected = selectStatus.value;
      if (selected !== status) {
        if (confirm(`¿Forzar el estado del pedido a "${STATUS_LABELS[selected]}"?`)) {
          updateOrderStatus(order.id, selected);
        }
      }
    });

    editContainer.appendChild(selectStatus);
    editContainer.appendChild(btnEdit);
    dom.modalActions.appendChild(editContainer);
  }

  function getActionLabel(status) {
    switch (status) {
      case 'confirmed': return '✓ Confirmar Pedido';
      case 'preparing': return '🍸 Marcar en Preparación';
      case 'delivering': return '🛵 Marcar En Camino';
      case 'delivered': return '📦 Marcar como Entregado';
      default: return 'Avanzar Estado';
    }
  }


  // ============================================
  // ORDER STATUS UPDATE
  // ============================================
  async function updateOrderStatus(orderId, newStatus) {
    if (firebaseReady && db && state.firestoreModule) {
      try {
        const { doc, updateDoc, Timestamp } = state.firestoreModule;
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          status: newStatus,
          updatedAt: Timestamp.now(),
        });
        openWhatsAppNotification(orderId, newStatus);
      } catch (err) {
        console.error('Error updating order:', err);
        alert('Error al actualizar el pedido. Intenta de nuevo.');
      }
    } else {
      // Demo mode: update locally
      const order = state.orders.find((o) => o.id === orderId);
      if (order) {
        order.status = newStatus;
        order.updatedAt = { seconds: Math.floor(Date.now() / 1000) };
        renderOrders([]);
        updateStats();
        openWhatsAppNotification(orderId, newStatus);
      }
    }

    // Refresh modal if still open
    if (state.selectedOrderId === orderId) {
      setTimeout(() => {
        const updated = state.orders.find((o) => o.id === orderId);
        if (updated) openOrderModal(orderId);
        else closeOrderModal();
      }, 100);
    }
  }

  function guessGender(firstName) {
    if (!firstName) return 'o';
    const name = firstName.toLowerCase().trim();
    if (['luca', 'borja', 'bautista'].includes(name)) return 'o';
    const femaleExceptions = ['carmen', 'belen', 'ayelen', 'millaray', 'lourdes', 'marisol', 'rut', 'ruth', 'abigail', 'isabel', 'betty', 'liz', 'miel', 'noemi', 'rosario', 'consuelo', 'amparo', 'pilar', 'paz', 'luz'];
    if (femaleExceptions.includes(name)) return 'a';
    return name.slice(-1) === 'a' ? 'a' : 'o';
  }

  function openWhatsAppNotification(orderId, newStatus) {
    try {
      // Solo notificar en estos estados
      if (newStatus === 'new' || newStatus === 'cancelled') return;

      const order = state.orders.find((o) => o.id === orderId);
      if (!order || !order.customer || !order.customer.phone) return;

      let phone = order.customer.phone.replace(/\D/g, '');

      const name = order.customer.name ? order.customer.name.split(' ')[0] : 'Cliente';
      const orderNum = order.orderNumber || '#' + orderId.substring(0,6);
      const suffix = guessGender(name);

      const isPisco = order.items && order.items.some(i => i.id && i.id.startsWith('promo-'));
      const isBeer = order.items && order.items.some(i => i.id && i.id.startsWith('pack-'));

      let msgConfirmed = `¡Hola ${name}! 🥂 Recibimos tu pedido ${orderNum} en Lomas & Drinks. Ya está confirmado y pronto empezaremos a prepararlo. ¡Quédate atent${suffix} a las actualizaciones! ✨`;
      let msgPreparing = `¡Hola ${name}! 🧊 Tus cocktails del pedido ${orderNum} ya están en preparación. Los estamos mezclando con mucha dedicación para que quedes encantad${suffix}. ¡Pronto irán en camino! 🍸✨`;
      let msgDelivering = `¡Ya vamos en camino con tus drinks! 🚀🛵 Llevamos tu pedido ${orderNum} directamente a tu puerta. ¿Estás list${suffix} para disfrutar? 🎉`;
      let msgDelivered = `¡Tu pedido ${orderNum} ha sido entregado! 🎉 Esperamos que disfrutes mucho tus cocktails de Lomas & Drinks y quedes invitadísim${suffix} para la próxima. ¡Salud! 🥂✨\n\n(Si subes una foto a historias no olvides etiquetarnos en @lomasndrinks 👀)`;

      if (isPisco) {
        msgConfirmed = `¡Recibimos tu llamado de emergencia, ${name}! 🚨🚑 El equipo de Lomas & Drinks ya confirmó tu Promo Piscola. Aguanta, que ya empezamos a armarla. 🧊🏃‍♂️💨`;
        msgPreparing = `¡Estamos armando tu promo de rescate, ${name}! 🧊🔋 Metiendo el hielo, el pisco y todo lo necesario para salvar la noche. ¡Pronto salimos para allá! 🚀`;
        msgDelivering = `¡Vamos al rescate! 🚨🚁 Ya vamos en camino a toda velocidad con tus provisiones. ¿Estás list${suffix} para continuar el after? 🎉🔥`;
        msgDelivered = `¡Misión cumplida, ${name}! 🫡 El rescate ha sido entregado exitosamente. Sigan disfrutando la noche con responsabilidad. ¡Salud! 🍻✨`;
      } else if (isBeer) {
        msgConfirmed = `¡Recibimos tu llamado de emergencia, ${name}! 🚨🚑 Tus cervezas ya están confirmadas. Aguanta un poco más, el rescate se acerca. 🧊🏃‍♂️💨`;
        msgPreparing = `¡Preparando las chelas, ${name}! 🍻🔋 Asegurándonos de que vayan bien frías para salvar la noche. ¡Pronto salimos para allá! 🚀`;
        msgDelivering = `¡Vamos al rescate! 🚨🚁 Ya vamos en camino a toda velocidad con tus cervezas. ¿Estás list${suffix} para continuar el after? 🎉🔥`;
        msgDelivered = `¡Misión cumplida, ${name}! 🫡 Las cervezas llegaron a destino. Sigan disfrutando la noche con responsabilidad. ¡Salud! 🍻✨`;
      }

      let message = '';
      switch (newStatus) {
        case 'confirmed': message = msgConfirmed; break;
        case 'preparing': message = msgPreparing; break;
        case 'delivering': message = msgDelivering; break;
        case 'delivered': message = msgDelivered; break;
        default:
          message = `¡Hola ${name}! Tu pedido ${orderNum} acaba de cambiar a estado: *${STATUS_LABELS[newStatus]}*.`;
      }
      
      state.currentWaPhone = phone;
      if (!dom.waModal || !dom.waModalText) {
        alert("ERROR: No se encontró el modal en la pantalla. Esto pasa si el navegador no ha actualizado el HTML. Presiona Ctrl + F5 o vacía la caché.");
        return;
      }
      
      dom.waModalText.value = message;
      dom.waModal.style.display = 'flex';
      // Force reflow before adding class for transition
      void dom.waModal.offsetWidth;
      dom.waModal.classList.add('active');
      
    } catch(err) {
      alert("Error en WhatsApp: " + err.message);
    }
  }


  // ============================================
  // SOUND NOTIFICATIONS (Web Audio API)
  // ============================================
  function initAudioContext() {
    if (state.audioCtx) return;
    try {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  function toggleSound() {
    if (!state.soundEnabled) {
      // Enable
      initAudioContext();
      if (state.audioCtx) {
        // Resume context (required after user gesture)
        state.audioCtx.resume().then(() => {
          state.soundEnabled = true;
          updateSoundUI();
          // Play a test chime
          playNotificationSound();
        });
      }
    } else {
      // Disable
      state.soundEnabled = false;
      updateSoundUI();
    }
  }

  function updateSoundUI() {
    const btn = dom.btnSound;
    const offLines = btn.querySelectorAll('.sound-off-line');
    const wave1 = btn.querySelector('.sound-on-wave1');
    const wave2 = btn.querySelector('.sound-on-wave2');

    if (state.soundEnabled) {
      btn.classList.add('enabled');
      dom.soundLabel.textContent = 'Sonido Activo';
      offLines.forEach((l) => (l.style.display = 'none'));
      if (wave1) wave1.style.display = '';
      if (wave2) wave2.style.display = '';
    } else {
      btn.classList.remove('enabled');
      dom.soundLabel.textContent = 'Activar Sonido';
      offLines.forEach((l) => (l.style.display = ''));
      if (wave1) wave1.style.display = 'none';
      if (wave2) wave2.style.display = 'none';
    }
  }

  function playNotificationSound() {
    if (!state.soundEnabled) return;
    const audio = new Audio('assets/audio/kaching.mp3');
    audio.play().catch(e => console.error('Audio play blocked:', e));
  }


  // ============================================
  // EVENT BINDINGS
  // ============================================
  function bindEvents() {
    // Sound toggle
    dom.btnSound.addEventListener('click', toggleSound);

    // Setup banner dismiss
    dom.setupDismiss.addEventListener('click', () => {
      dom.setupBanner.style.display = 'none';
    });

    // Filter tabs
    dom.filterTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;

      $$('.filter-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      state.currentFilter = tab.dataset.filter;
      renderOrders([]);
    });

    // Modal close
    dom.modalClose.addEventListener('click', closeOrderModal);
    dom.orderModal.addEventListener('click', (e) => {
      if (e.target === dom.orderModal) closeOrderModal();
    });

    // WA Modal
    dom.waModalClose.addEventListener('click', closeWaModal);
    dom.waModal.addEventListener('click', (e) => {
      if (e.target === dom.waModal) closeWaModal();
    });
    dom.waModalSend.addEventListener('click', () => {
      if (state.currentWaPhone && dom.waModalText.value) {
        let phone = state.currentWaPhone;
        if (phone && phone.length === 9 && phone.startsWith('9')) {
          phone = '56' + phone;
        }
        window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(dom.waModalText.value)}`, '_blank');
        closeWaModal();
      }
    });

    if (dom.btnNewOrder) {
      dom.btnNewOrder.addEventListener('click', openManualModal);
      dom.manualModalClose.addEventListener('click', closeManualModal);
      dom.manDelivery.addEventListener('input', updateManualTotal);
      dom.manSubmit.addEventListener('click', submitManualOrder);
    }

    bindLogout();

    if (dom.btnClearTestData) {
      dom.btnClearTestData.addEventListener('click', clearTestData);
    }

    if (dom.btnHistory && dom.historyModalClose && dom.btnSearchHistory) {
      dom.btnHistory.addEventListener('click', openHistoryModal);
      dom.historyModalClose.addEventListener('click', closeHistoryModal);
      dom.btnSearchHistory.addEventListener('click', fetchHistory);
    }

    // Toggle user dropdown
    if (dom.btnUserToggle && dom.userMenu) {
      dom.btnUserToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que se cierre instantáneamente por el window click
        dom.userMenu.classList.toggle('active');
      });
      // Close dropdown when clicking outside
      window.addEventListener('click', (e) => {
        if (!dom.userMenu.contains(e.target)) {
          dom.userMenu.classList.remove('active');
        }
      });
    }

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeOrderModal();
    });
  }

  // ==========================================
  // MANUAL ORDER LOGIC
  // ==========================================
  function openManualModal() {
    state.manualCart = {};
    Object.keys(PRODUCTS).forEach(id => {
      state.manualCart[id] = 0;
    });
    
    dom.manName.value = '';
    dom.manPhone.value = '';
    dom.manAddress.value = '';
    dom.manReference.value = '';
    dom.manComments.value = '';
    dom.manPayment.value = 'transfer';
    dom.manDelivery.value = 0;

    renderManualProducts();
    updateManualTotal();

    dom.manualModal.style.display = 'flex';
    void dom.manualModal.offsetWidth;
    dom.manualModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeManualModal() {
    dom.manualModal.classList.remove('active');
    setTimeout(() => {
      dom.manualModal.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);
  }

  function renderManualProducts() {
    dom.manProductsList.innerHTML = '';
    Object.keys(PRODUCTS).forEach(id => {
      const prod = PRODUCTS[id];
      const qty = state.manualCart[id];
      
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.padding = '0.5rem 0';
      row.style.borderBottom = '1px solid var(--border-subtle)';

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.8rem;">
          <img src="${prod.image}" alt="${prod.name}" style="width: 40px; height: 40px; object-fit: contain; background: rgba(255,255,255,0.05); border-radius: 6px;">
          <div>
            <div style="font-weight: 600; font-size: 0.95rem;">${prod.name}</div>
            <div style="font-size: 0.85rem; color: var(--gold);">${formatCurrency(prod.price)}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--bg-primary); padding: 0.2rem; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <button type="button" class="btn-qty minus" data-id="${id}" style="width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; color: var(--text-primary); cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;">-</button>
          <span style="min-width: 20px; text-align: center; font-weight: bold;">${qty}</span>
          <button type="button" class="btn-qty plus" data-id="${id}" style="width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; color: var(--text-primary); cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;">+</button>
        </div>
      `;
      
      row.querySelector('.minus').addEventListener('click', () => {
        if (state.manualCart[id] > 0) {
          state.manualCart[id]--;
          renderManualProducts();
          updateManualTotal();
        }
      });

      row.querySelector('.plus').addEventListener('click', () => {
        state.manualCart[id]++;
        renderManualProducts();
        updateManualTotal();
      });

      dom.manProductsList.appendChild(row);
    });
  }

  function updateManualTotal() {
    let subtotal = 0;
    Object.keys(PRODUCTS).forEach(id => {
      subtotal += PRODUCTS[id].price * state.manualCart[id];
    });
    const delivery = parseInt(dom.manDelivery.value) || 0;
    const total = subtotal + delivery;
    dom.manTotalLabel.textContent = formatCurrency(total);
  }

  async function submitManualOrder() {
    const name = dom.manName.value.trim();
    const phone = dom.manPhone.value.trim();
    const address = dom.manAddress.value.trim();
    
    if (!name || !phone || !address) {
      alert("Por favor completa Nombre, Teléfono y Dirección.");
      return;
    }

    const items = [];
    let subtotal = 0;
    Object.keys(state.manualCart).forEach(id => {
      const qty = state.manualCart[id];
      if (qty > 0) {
        items.push({
          id: PRODUCTS[id].id,
          name: PRODUCTS[id].name,
          price: PRODUCTS[id].price,
          quantity: qty,
          image: PRODUCTS[id].image
        });
        subtotal += PRODUCTS[id].price * qty;
      }
    });

    if (items.length === 0) {
      alert("Debes agregar al menos un producto al pedido.");
      return;
    }

    const deliveryFee = parseInt(dom.manDelivery.value) || 0;
    const total = subtotal + deliveryFee;
    const orderNumber = 'MAN-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const orderData = {
      orderNumber,
      customer: {
        name,
        phone,
        address,
        reference: dom.manReference.value.trim(),
        comments: dom.manComments.value.trim()
      },
      items,
      subtotal,
      deliveryFee,
      total,
      payment: { method: dom.manPayment.value, status: 'confirmed' },
      status: 'new',
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      updatedAt: { seconds: Math.floor(Date.now() / 1000) },
      source: 'manual'
    };

    try {
      dom.manSubmit.disabled = true;
      dom.manSubmit.textContent = 'Guardando...';

      if (firebaseReady && db && state.firestoreModule) {
        const { collection, addDoc } = state.firestoreModule;
        await addDoc(collection(db, 'orders'), orderData);
      } else {
        // DEMO MODE fallback
        const demoId = 'demo-man-' + Date.now();
        state.orders.unshift({ id: demoId, ...orderData });
        renderOrders([]);
        updateStats();
      }

      closeManualModal();
      alert(`¡Pedido ${orderNumber} creado exitosamente!`);
    } catch (err) {
      console.error(err);
      alert('Error al crear pedido manual: ' + err.message);
    } finally {
      dom.manSubmit.disabled = false;
      dom.manSubmit.textContent = 'Crear Pedido Manual';
    }
  }


  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0';
    return '$' + amount.toLocaleString('es-CL');
  }

  function getTimestamp(ts) {
    if (!ts) return 0;
    if (ts.seconds) return ts.seconds * 1000;
    if (ts.toMillis) return ts.toMillis();
    if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000;
    return new Date(ts).getTime() || 0;
  }

  function formatTime(ts) {
    const ms = getTimestamp(ts);
    if (!ms) return '—';
    const date = new Date(ms);
    const now = new Date();

    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    }

    // Otherwise show date and time
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
    }) + ' ' + date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDateTime(ts) {
    const ms = getTimestamp(ts);
    if (!ms) return '—';
    return new Date(ms).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function getTodayStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }


  // ============================================
  // BOOT
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function bindLogout() {
    if (dom.btnLogout && !dom.btnLogout.dataset.bound) {
      dom.btnLogout.dataset.bound = true;
      dom.btnLogout.addEventListener('click', async () => {
        if (window.firebaseApp) {
          try {
            const { getAuth, signOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            const auth = getAuth(window.firebaseApp);
            await signOut(auth);
          } catch(err) {
            console.error('Logout error:', err);
          }
        }
      });
    }
  }

  // ============================================
  // HISTORY LOGIC
  // ============================================
  function openHistoryModal() {
    dom.historyModal.style.display = 'flex';
    const today = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14);
    
    dom.historyStart.value = twoWeeksAgo.toISOString().split('T')[0];
    dom.historyEnd.value = today.toISOString().split('T')[0];
    dom.historyResults.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">Selecciona un rango de fechas para buscar.</div>';
    dom.historyTotalRevenue.innerText = '$0';
  }

  function closeHistoryModal() {
    dom.historyModal.style.display = 'none';
  }

  async function fetchHistory() {
    if (!firebaseReady || !db || !state.firestoreModule) {
      dom.historyResults.innerHTML = '<div style="color:red; text-align:center;">Firebase no está conectado</div>';
      return;
    }
    
    const startStr = dom.historyStart.value;
    const endStr = dom.historyEnd.value;
    if (!startStr || !endStr) return;
    
    dom.btnSearchHistory.innerText = "Buscando...";
    dom.btnSearchHistory.disabled = true;
    
    try {
      // Import missing required functions specifically for this one-off fetch
      const { getDocs, where } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const { collection, query, orderBy } = state.firestoreModule;

      const startDate = new Date(startStr);
      startDate.setHours(0,0,0,0);
      
      const endDate = new Date(endStr);
      endDate.setHours(23,59,59,999);
      
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('createdAt', '>=', startDate), 
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      let totalRev = 0;
      let html = '';
      
      if (snapshot.empty) {
        html = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">No hay ventas en estas fechas.</div>';
      } else {
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.status === 'entregado' || data.status === 'delivered') {
            totalRev += (data.total || data.totals?.finalTotal || 0);
          }
          
          const dateStr = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString('es-CL') : 'Fecha desconocida';
          const productsStr = (data.cart || []).map(p => `${p.quantity}x ${p.name}`).join(', ');
          const cust = data.customer || {};
          
          // Mapeo simple de colores para el badge
          const statusColors = {
            'pending': 'var(--warning)',
            'preparing': 'var(--accent)',
            'on_the_way': '#3b82f6',
            'delivered': 'var(--success)',
            'entregado': 'var(--success)',
            'canceled': 'var(--error)'
          };
          const statusColor = statusColors[data.status] || 'var(--text-secondary)';

          html += `
          <div style="background: var(--bg-elevated); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-subtle); font-size: 0.95rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <strong>Pedido #${data.orderNumber}</strong>
              <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase; font-size: 0.8rem;">${data.status}</span>
            </div>
            <div style="margin-bottom: 0.5rem; color: var(--text-secondary);">📅 ${dateStr}</div>
            <div style="margin-bottom: 0.5rem;"><strong>Cliente:</strong> ${cust.name || 'Sin nombre'} | 📞 ${cust.phone || 'Sin tel'}</div>
            <div style="margin-bottom: 0.5rem;"><strong>Dir:</strong> ${cust.address || 'Retiro en local'} ${cust.reference ? `(${cust.reference})` : ''}</div>
            <div style="margin-bottom: 0.5rem; color: var(--gold);">🛒 ${productsStr}</div>
            <div style="text-align: right; font-weight: bold; font-size: 1.1rem;">Total: $${(data.total || data.totals?.finalTotal || 0).toLocaleString('es-CL')}</div>
          </div>`;
        });
      }
      
      dom.historyResults.innerHTML = html;
      dom.historyTotalRevenue.innerText = `$${totalRev.toLocaleString('es-CL')}`;
      
    } catch (error) {
      console.error("Error fetching history:", error);
      dom.historyResults.innerHTML = '<div style="color:red; text-align:center;">Error al buscar: ' + error.message + '</div>';
    }
    
    dom.btnSearchHistory.innerText = "Buscar";
    dom.btnSearchHistory.disabled = false;
  }

  async function clearTestData() {
    if (!window.confirm('🚨 ¿Estás seguro de que deseas eliminar TODOS los datos de prueba?\n\nSe borrarán de forma permanente todos los pedidos, intentos de ruleta y cupones generados para comenzar desde cero en producción.\n\nEsta acción NO se puede deshacer.')) {
      return;
    }
    
    const btn = document.getElementById('btnClearTestData');
    const originalHTML = btn.innerHTML;
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.5';
    btn.innerHTML = '⚡ Limpiando...';
    
    try {
      const { collection, getDocs, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      
      const collectionsToClear = ['orders', 'launch_attempts', 'launch_coupons'];
      let totalDeleted = 0;
      
      for (const colName of collectionsToClear) {
        const colRef = collection(window.db, colName);
        const snapshot = await getDocs(colRef);
        console.log(`[Cleanup] Found ${snapshot.size} documents in collection '${colName}'`);
        
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        totalDeleted += snapshot.size;
      }
      
      alert(`✅ Base de datos limpia.\n\nSe han eliminado exitosamente ${totalDeleted} documentos de prueba de las colecciones.`);
      window.location.reload();
    } catch (err) {
      console.error('Error clearing test data:', err);
      alert('❌ Error al limpiar datos: ' + err.message);
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1';
      btn.innerHTML = originalHTML;
    }
  }

})();
