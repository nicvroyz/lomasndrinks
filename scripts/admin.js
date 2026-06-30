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
    productCosts: {},
    expenses: [],
    inventory: [],
    recipes: [],
    selectedRecipeProductId: null,
    currentReceiptFile: null,
    currentReceiptBase64: null,
    historyPicker: null,
    initialInvestment: 65000,
    charts: {},
  };

  const PRODUCTS = {
    'tropiconce': { id: 'tropiconce', name: 'Tropiconce', price: 9990, image: 'assets/images/tropiconce.png', active: true },
    'pink-fantasy': { id: 'pink-fantasy', name: 'Pink Fantasy', price: 9990, image: 'assets/images/pink_fantasy.png', active: true },
    'promo-piscola': { id: 'promo-piscola', name: 'Promo Piscola Normal', price: 20000, image: 'assets/images/piscola.png', active: false },
    'promo-piscola-3l': { id: 'promo-piscola-3l', name: 'Promo Piscola Agrandada', price: 22000, image: 'assets/images/piscola.png', active: false },
    'promo-manzana': { id: 'promo-manzana', name: 'Promo Pisco Manzana', price: 27000, image: 'assets/images/manzana.png', active: false },
    'promo-manzana-3l': { id: 'promo-manzana-3l', name: 'Promo Manzana Agrandada', price: 29000, image: 'assets/images/manzana.png', active: false },
    'pack-escudo-silver': { id: 'pack-escudo-silver', name: 'Six Pack Escudo Silver', price: 7000, image: 'assets/images/escudo_silver.png', active: false },
    'pack-escudo': { id: 'pack-escudo', name: 'Six Pack Escudo', price: 9000, image: 'assets/images/escudo.png', active: false },
    'pack-cristal': { id: 'pack-cristal', name: 'Six Pack Cristal', price: 9000, image: 'assets/images/cristal.png', active: false },
    'pack-royal': { id: 'pack-royal', name: 'Six Pack Royal Guard', price: 10500, image: 'assets/images/royal.png', active: false },
    'pack-heineken': { id: 'pack-heineken', name: 'Six Pack Heineken', price: 10500, image: 'assets/images/heineken.png', active: false }
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
    historyRangePicker: $('#historyRangePicker'),
    btnSearchHistory: $('#btnSearchHistory'),
    historyResultsTableBody: $('#historyResultsTableBody'),
    historyTotalRevenue: $('#historyTotalRevenue'),
    historyOrdersCount: $('#historyOrdersCount'),
    
    // Section Views
    ordersSection: $('#ordersSection'),
    accountingSection: $('#accountingSection'),
    inventorySection: $('#inventorySection'),
    recipesSection: $('#recipesSection'),
    historySection: $('#historySection'),
    
    // Accounting KPIs
    finGrossRevenue: $('#finGrossRevenue'),
    finCOGS: $('#finCOGS'),
    finGrossMargin: $('#finGrossMargin'),
    finGrossMarginPct: $('#finGrossMarginPct'),
    finGrossMarginCard: $('#finGrossMarginCard'),
    finOpEx: $('#finOpEx'),
    finNetProfit: $('#finNetProfit'),
    finNetProfitPct: $('#finNetProfitPct'),
    finNetProfitCard: $('#finNetProfitCard'),
    finInitialInvestment: $('#finInitialInvestment'),
    finROI: $('#finROI'),
    finInventoryValue: $('#finInventoryValue'),
    
    // AI Accountant
    aiAlertsList: $('#aiAlertsList'),
    aiChatMessages: $('#aiChatMessages'),
    aiChatInput: $('#aiChatInput'),
    btnAiChatSend: $('#btnAiChatSend'),
    
    // Product Costs
    productCostsTableBody: $('#productCostsTableBody'),
    btnSaveProductCosts: $('#btnSaveProductCosts'),
    
    // Expense Upload & Form
    receiptUploadZone: $('#receiptUploadZone'),
    receiptFileInput: $('#receiptFileInput'),
    ocrProgressContainer: $('#ocrProgressContainer'),
    ocrStatusTitle: $('#ocrStatusTitle'),
    ocrProgressBarFill: $('#ocrProgressBarFill'),
    ocrStatusPct: $('#ocrStatusPct'),
    expenseForm: $('#expenseForm'),
    ocrPreviewImage: $('#ocrPreviewImage'),
    expDate: $('#expDate'),
    expProvider: $('#expProvider'),
    expDetail: $('#expDetail'),
    expAmount: $('#expAmount'),
    expAffectsInventory: $('#expAffectsInventory'),
    btnCancelExpense: $('#btnCancelExpense'),
    btnSaveExpense: $('#btnSaveExpense'),
    expensesTableBody: $('#expensesTableBody'),

    // Detailed Expense Items & Supplies Inventory
    btnAddExpenseItem: $('#btnAddExpenseItem'),
    expenseItemsTableBody: $('#expenseItemsTableBody'),
    inventoryTableBody: $('#inventoryTableBody'),
    btnOpenAdjustInventory: $('#btnOpenAdjustInventory'),
    inventoryModal: $('#inventoryModal'),
    inventoryModalClose: $('#inventoryModalClose'),
    invAdjustSelect: $('#invAdjustSelect'),
    invAdjustType: $('#invAdjustType'),
    invAdjustQty: $('#invAdjustQty'),
    invAdjustCost: $('#invAdjustCost'),
    invAdjustUnit: $('#invAdjustUnit'),
    invAdjustCapacity: $('#invAdjustCapacity'),
    invAdjustCapacityGroup: $('#invAdjustCapacityGroup'),
    newSupplyName: $('#newSupplyName'),
    newSupplyNameGroup: $('#newSupplyNameGroup'),
    invCostGroup: $('#invCostGroup'),
    invAdjustComment: $('#invAdjustComment'),
    btnCancelInventory: $('#btnCancelInventory'),
    btnSaveInventoryAdjustment: $('#btnSaveInventoryAdjustment'),
    receiptPhotoModal: $('#receiptPhotoModal'),
    receiptPhotoModalClose: $('#receiptPhotoModalClose'),
    receiptPhotoImg: $('#receiptPhotoImg'),
    
    // Recipes Tab & Modal
    recipesGridList: $('#recipesGridList'),
    recipeModal: $('#recipeModal'),
    recipeModalClose: $('#recipeModalClose'),
    recipeModalTitle: $('#recipeModalTitle'),
    recipeIngredientsTableBody: $('#recipeIngredientsTableBody'),
    btnRecipeAddIngredient: $('#btnRecipeAddIngredient'),
    btnRecipeCancel: $('#btnRecipeCancel'),
    btnRecipeSave: $('#btnRecipeSave')
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
      
      if (dom.btnHistory) dom.btnHistory.addEventListener('click', openHistoryTab);
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

    if (dom.historyRangePicker && typeof flatpickr !== 'undefined') {
      const today = new Date();
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(today.getDate() - 14);
      
      state.historyPicker = flatpickr(dom.historyRangePicker, {
        mode: 'range',
        dateFormat: 'Y-m-d',
        defaultDate: [twoWeeksAgo, today],
        locale: {
          firstDayOfWeek: 1,
          weekdays: {
            shorthand: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
            longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
          },
          months: {
            shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
          },
          rangeSeparator: ' a '
        }
      });
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
      await loadAccountingData();
    } catch (err) {
      console.error('Error connecting to Firebase:', err);
      showFallbackMode();
    }
  }

  function showFallbackMode() {
    dom.setupBanner.style.display = 'block';
    setConnectionStatus('demo', 'Modo Demo');
    loadDemoOrders();
    loadDemoAccountingData();
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
      updateFinanceMetrics();
      runAiAccountantAudit();

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
        
        const existingOrder = state.orders.find(o => o.id === orderId);
        const shouldDeduct = (newStatus === 'confirmed' || newStatus === 'delivered') && existingOrder && !existingOrder.ingredientsDeducted;
        
        const updatePayload = {
          status: newStatus,
          updatedAt: Timestamp.now()
        };
        
        if (shouldDeduct) {
          updatePayload.ingredientsDeducted = true;
          existingOrder.ingredientsDeducted = true;
          await deductIngredientsForOrder(existingOrder);
        }
        
        await updateDoc(orderRef, updatePayload);
        openWhatsAppNotification(orderId, newStatus);
      } catch (err) {
        console.error('Error updating order:', err);
        alert('Error al actualizar el pedido. Intenta de nuevo.');
      }
    } else {
      // Demo mode: update locally
      const order = state.orders.find((o) => o.id === orderId);
      if (order) {
        const shouldDeduct = (newStatus === 'confirmed' || newStatus === 'delivered') && !order.ingredientsDeducted;
        order.status = newStatus;
        order.updatedAt = { seconds: Math.floor(Date.now() / 1000) };
        if (shouldDeduct) {
          order.ingredientsDeducted = true;
          deductDemoIngredientsForOrder(order);
        }
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

    if (dom.btnHistory) {
      dom.btnHistory.addEventListener('click', openHistoryTab);
    }
    if (dom.btnSearchHistory) {
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

    // ──────────────────────────────────────────
    // TABS & ACCOUNTING DYNAMIC BINDINGS
    // ──────────────────────────────────────────
    initTabsNav();

    if (dom.finInitialInvestment) {
      dom.finInitialInvestment.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 0;
        state.initialInvestment = val;
        localStorage.setItem('lomas_initial_investment', val);
        updateFinanceMetrics();
      });
    }

    if (dom.btnSaveProductCosts) {
      dom.btnSaveProductCosts.addEventListener('click', saveProductCosts);
    }

    if (dom.btnCancelExpense) {
      dom.btnCancelExpense.addEventListener('click', resetExpenseForm);
    }

    if (dom.btnSaveExpense) {
      dom.btnSaveExpense.addEventListener('click', () => {
        const date = dom.expDate.value;
        const provider = dom.expProvider.value.trim();
        const detail = dom.expDetail.value.trim();
        const amount = parseInt(dom.expAmount.value) || 0;
        
        if (!date || !provider || !detail || !amount) {
          alert('Por favor complete todos los campos obligatorios del egreso.');
          return;
        }
        
        const items = getExpenseItemsList();
        const affectsInventory = dom.expAffectsInventory ? dom.expAffectsInventory.checked : true;
        saveExpense(date, provider, detail, amount, items, affectsInventory);
      });
    }

    if (dom.btnAddExpenseItem) {
      dom.btnAddExpenseItem.addEventListener('click', () => {
        addExpenseItemRow();
      });
    }

    if (dom.btnOpenAdjustInventory) {
      dom.btnOpenAdjustInventory.addEventListener('click', openInventoryModal);
    }

    if (dom.inventoryModalClose) {
      dom.inventoryModalClose.addEventListener('click', closeInventoryModal);
    }

    if (dom.btnCancelInventory) {
      dom.btnCancelInventory.addEventListener('click', closeInventoryModal);
    }

    if (dom.btnSaveInventoryAdjustment) {
      dom.btnSaveInventoryAdjustment.addEventListener('click', saveInventoryAdjustment);
    }

    if (dom.invAdjustSelect) {
      dom.invAdjustSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === '__new__') {
          if (dom.newSupplyNameGroup) dom.newSupplyNameGroup.style.display = 'block';
          if (dom.invCostGroup) dom.invCostGroup.style.display = 'block';
          if (dom.invAdjustUnit) dom.invAdjustUnit.value = 'unidades';
          if (dom.invAdjustCapacity) dom.invAdjustCapacity.value = '1';
          if (dom.invAdjustCapacityGroup) dom.invAdjustCapacityGroup.style.display = 'none';
        } else {
          if (dom.newSupplyNameGroup) dom.newSupplyNameGroup.style.display = 'none';
          const existing = state.inventory.find(i => i.id === val);
          if (existing) {
            if (dom.invAdjustUnit) dom.invAdjustUnit.value = existing.unit || 'unidades';
            if (dom.invAdjustCapacity) dom.invAdjustCapacity.value = existing.capacity || '1';
            if (dom.invAdjustCapacityGroup) {
              dom.invAdjustCapacityGroup.style.display = (existing.unit === 'unidades') ? 'none' : 'block';
            }
          }
        }
      });
    }

    if (dom.invAdjustUnit) {
      dom.invAdjustUnit.addEventListener('change', (e) => {
        if (e.target.value === 'unidades') {
          if (dom.invAdjustCapacityGroup) dom.invAdjustCapacityGroup.style.display = 'none';
          if (dom.invAdjustCapacity) dom.invAdjustCapacity.value = '1';
        } else {
          if (dom.invAdjustCapacityGroup) dom.invAdjustCapacityGroup.style.display = 'block';
        }
      });
    }

    if (dom.invAdjustType) {
      dom.invAdjustType.addEventListener('change', (e) => {
        if (e.target.value === 'consume') {
          if (dom.invCostGroup) dom.invCostGroup.style.display = 'none';
        } else {
          if (dom.invCostGroup) dom.invCostGroup.style.display = 'block';
        }
      });
    }

    if (dom.receiptPhotoModalClose) {
      dom.receiptPhotoModalClose.addEventListener('click', closeReceiptPhotoModal);
    }

    if (dom.receiptPhotoModal) {
      dom.receiptPhotoModal.addEventListener('click', (e) => {
        if (e.target === dom.receiptPhotoModal) closeReceiptPhotoModal();
      });
    }

    if (dom.receiptUploadZone && dom.receiptFileInput) {
      dom.receiptUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.receiptUploadZone.style.borderColor = 'var(--gold)';
        dom.receiptUploadZone.style.background = 'rgba(220, 163, 17, 0.05)';
      });
      dom.receiptUploadZone.addEventListener('dragleave', () => {
        dom.receiptUploadZone.style.borderColor = 'rgba(220, 163, 17, 0.3)';
        dom.receiptUploadZone.style.background = 'rgba(255, 255, 255, 0.01)';
      });
      dom.receiptUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.receiptUploadZone.style.borderColor = 'rgba(220, 163, 17, 0.3)';
        dom.receiptUploadZone.style.background = 'rgba(255, 255, 255, 0.01)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          dom.receiptFileInput.files = files;
          handleReceiptUpload({ target: { files: files } });
        }
      });

      dom.receiptFileInput.addEventListener('change', handleReceiptUpload);
    }

    if (dom.btnAiChatSend && dom.aiChatInput) {
      dom.btnAiChatSend.addEventListener('click', handleAiChatSubmit);
      dom.aiChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleAiChatSubmit();
        }
      });
    }

    $$('.chat-suggest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.dataset.query;
        if (dom.aiChatInput) {
          dom.aiChatInput.value = query;
          handleAiChatSubmit();
        }
      });
    });

    // Recipes Tab listeners
    if (dom.recipeModalClose) {
      dom.recipeModalClose.addEventListener('click', closeRecipeModal);
    }
    if (dom.btnRecipeCancel) {
      dom.btnRecipeCancel.addEventListener('click', closeRecipeModal);
    }
    if (dom.btnRecipeSave) {
      dom.btnRecipeSave.addEventListener('click', saveRecipe);
    }
    if (dom.btnRecipeAddIngredient) {
      dom.btnRecipeAddIngredient.addEventListener('click', () => addRecipeIngredientRow());
    }
    if (dom.recipeModal) {
      dom.recipeModal.addEventListener('click', (e) => {
        if (e.target === dom.recipeModal) closeRecipeModal();
      });
    }
  }

  // ==========================================
  // MANUAL ORDER LOGIC
  // ==========================================
  const PREPARATIONS = {
    'sin-energetica': 'Sin Energética',
    'con-energetica': 'Con Energética'
  };

  function openManualModal() {
    state.manualCart = {};
    Object.keys(PRODUCTS).forEach(id => {
      const prod = PRODUCTS[id];
      if (prod.active !== false) {
        if (id === 'tropiconce' || id === 'pink-fantasy') {
          Object.keys(PREPARATIONS).forEach(prepKey => {
            state.manualCart[`${id}-${prepKey}`] = 0;
          });
        } else {
          state.manualCart[id] = 0;
        }
      }
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
    Object.keys(state.manualCart).forEach(itemId => {
      const qty = state.manualCart[itemId];
      
      let baseId = itemId;
      let optionText = '';
      let optionKey = '';
      
      if (itemId.includes('-sin-energetica') || itemId.includes('-con-energetica')) {
        const index = itemId.indexOf('-');
        baseId = itemId.substring(0, index);
        optionKey = itemId.substring(index + 1);
        optionText = PREPARATIONS[optionKey];
      }
      
      const prod = PRODUCTS[baseId];
      if (!prod) return;
      
      const displayName = optionText ? `${prod.name} (${optionText})` : prod.name;
      
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
            <div style="font-weight: 600; font-size: 0.95rem;">${displayName}</div>
            <div style="font-size: 0.85rem; color: var(--gold);">${formatCurrency(prod.price)}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--bg-primary); padding: 0.2rem; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <button type="button" class="btn-qty minus" data-id="${itemId}" style="width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; color: var(--text-primary); cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;">-</button>
          <span style="min-width: 20px; text-align: center; font-weight: bold;">${qty}</span>
          <button type="button" class="btn-qty plus" data-id="${itemId}" style="width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; color: var(--text-primary); cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;">+</button>
        </div>
      `;
      
      row.querySelector('.minus').addEventListener('click', () => {
        if (state.manualCart[itemId] > 0) {
          state.manualCart[itemId]--;
          renderManualProducts();
          updateManualTotal();
        }
      });

      row.querySelector('.plus').addEventListener('click', () => {
        state.manualCart[itemId]++;
        renderManualProducts();
        updateManualTotal();
      });

      dom.manProductsList.appendChild(row);
    });
  }

  function updateManualTotal() {
    let eligibleQty = 0;
    let otherTotal = 0;
    
    Object.keys(state.manualCart).forEach(id => {
      const qty = state.manualCart[id] || 0;
      if (qty <= 0) return;
      
      let baseId = id;
      if (id.includes('-sin-energetica') || id.includes('-con-energetica')) {
        baseId = id.split('-')[0];
      }
      
      if (baseId === 'tropiconce' || baseId === 'pink-fantasy') {
        eligibleQty += qty;
      } else {
        otherTotal += PRODUCTS[baseId].price * qty;
      }
    });

    const pairs = Math.floor(eligibleQty / 2);
    const singles = eligibleQty % 2;
    const promoTotal = (pairs * 18000) + (singles * 9990);
    const subtotal = promoTotal + otherTotal;
    
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
    let eligibleQty = 0;
    let otherTotal = 0;
    let originalSubtotal = 0;

    Object.keys(state.manualCart).forEach(id => {
      const qty = state.manualCart[id];
      if (qty > 0) {
        let baseId = id;
        let optionText = '';
        if (id.includes('-sin-energetica') || id.includes('-con-energetica')) {
          const index = id.indexOf('-');
          baseId = id.substring(0, index);
          const optionKey = id.substring(index + 1);
          optionText = PREPARATIONS[optionKey];
        }

        const prod = PRODUCTS[baseId];
        const displayName = optionText ? `${prod.name} (${optionText})` : prod.name;

        items.push({
          id: id,
          name: displayName,
          price: prod.price,
          quantity: qty,
          image: prod.image
        });
        
        originalSubtotal += prod.price * qty;
        
        if (baseId === 'tropiconce' || baseId === 'pink-fantasy') {
          eligibleQty += qty;
        } else {
          otherTotal += prod.price * qty;
        }
      }
    });

    if (items.length === 0) {
      alert("Debes agregar al menos un producto al pedido.");
      return;
    }

    const pairs = Math.floor(eligibleQty / 2);
    const singles = eligibleQty % 2;
    const promoTotal = (pairs * 18000) + (singles * 9990);
    const subtotal = promoTotal + otherTotal;
    const discount = originalSubtotal - subtotal;
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
      subtotal: originalSubtotal,
      discount,
      deliveryFee,
      total,
      payment: { method: dom.manPayment.value, status: 'confirmed' },
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
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
  function openHistoryTab() {
    const tabButtons = $$('.tab-nav-btn');
    tabButtons.forEach(btn => {
      if (btn.dataset.section === 'historySection') {
        btn.click();
      }
    });
  }

  async function fetchHistory() {
    if (!firebaseReady || !db || !state.firestoreModule) {
      if (dom.historyResultsTableBody) {
        dom.historyResultsTableBody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center; padding: 2rem;">Firebase no está conectado</td></tr>';
      }
      return;
    }
    
    let startDate = null;
    let endDate = null;
    
    if (state.historyPicker && state.historyPicker.selectedDates.length > 0) {
      startDate = state.historyPicker.selectedDates[0];
      endDate = state.historyPicker.selectedDates[1] || new Date(startDate);
    } else {
      if (dom.historyResultsTableBody) {
        dom.historyResultsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Por favor selecciona un rango de fechas.</td></tr>';
      }
      return;
    }
    
    dom.btnSearchHistory.innerText = "Buscando...";
    dom.btnSearchHistory.disabled = true;
    
    try {
      const { collection, getDocs } = state.firestoreModule;
      
      const startLimit = new Date(startDate);
      startLimit.setHours(0,0,0,0);
      
      const endLimit = new Date(endDate);
      endLimit.setHours(23,59,59,999);
      
      const ordersRef = collection(db, 'orders');
      const snapshot = await getDocs(ordersRef);
      
      let totalRev = 0;
      let ordersList = [];
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        let orderDate = null;
        if (data.createdAt) {
          if (data.createdAt.toDate) {
            orderDate = data.createdAt.toDate();
          } else if (data.createdAt.seconds) {
            orderDate = new Date(data.createdAt.seconds * 1000);
          } else {
            orderDate = new Date(data.createdAt);
          }
        }
        
        if (orderDate && orderDate >= startLimit && orderDate <= endLimit) {
          const status = (data.status || '').toLowerCase().trim();
          if (status === 'entregado' || status === 'delivered') {
            ordersList.push({
              id: docSnap.id,
              dateObj: orderDate,
              ...data
            });
            totalRev += (data.total || data.totals?.finalTotal || 0);
          }
        }
      });
      
      ordersList.sort((a, b) => b.dateObj - a.dateObj);
      
      let html = '';
      
      if (ordersList.length === 0) {
        html = `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 3rem;">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
              No se encontraron ventas entregadas en este rango de fechas.
            </td>
          </tr>
        `;
      } else {
        ordersList.forEach(data => {
          const dateStr = data.dateObj.toLocaleString('es-CL');
          const productsStr = (data.cart || []).map(p => `<strong>${p.quantity}x</strong> ${p.name}`).join('<br>');
          const cust = data.customer || {};
          const customerHtml = `
            <div style="font-weight: 600;">${cust.name || 'Sin nombre'}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">📞 ${cust.phone || 'Sin tel'}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${cust.address || 'Retiro en local'}">📍 ${cust.address || 'Retiro en local'}</div>
          `;
          
          const payMethod = (data.payment?.method || 'Efectivo').toUpperCase();
          const orderTotal = (data.total || data.totals?.finalTotal || 0);
          
          html += `
            <tr>
              <td style="font-weight: 700; color: var(--gold); font-family: monospace; font-size: 0.9rem;">#${data.orderNumber || 'MANUAL'}</td>
              <td style="font-size: 0.8rem; white-space: nowrap;">${dateStr}</td>
              <td>${customerHtml}</td>
              <td style="line-height: 1.4; font-size: 0.8rem;">${productsStr}</td>
              <td style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary);">${payMethod}</td>
              <td style="text-align: right; font-weight: 700; color: var(--gold); font-family: 'Inter', sans-serif; font-size: 0.9rem;">$${orderTotal.toLocaleString('es-CL')}</td>
            </tr>
          `;
        });
      }
      
      if (dom.historyResultsTableBody) dom.historyResultsTableBody.innerHTML = html;
      if (dom.historyTotalRevenue) dom.historyTotalRevenue.innerText = `$${totalRev.toLocaleString('es-CL')}`;
      if (dom.historyOrdersCount) dom.historyOrdersCount.innerText = ordersList.length;
      
    } catch (error) {
      console.error("Error fetching history:", error);
      if (dom.historyResultsTableBody) {
        dom.historyResultsTableBody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center; padding: 2rem;">Error al buscar: ${error.message}</td></tr>`;
      }
    }
    
    dom.btnSearchHistory.innerText = "Buscar Ventas";
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

  // ============================================
  // TABS NAVIGATION CONTROLLER
  // ============================================
  function initTabsNav() {
    const tabButtons = $$('.tab-nav-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const sectionId = btn.dataset.section;
        

        // Toggle sections
        $$('.admin-section-container').forEach(sec => {
          if (sec.id === sectionId) {
            sec.style.display = 'block';
          } else {
            sec.style.display = 'none';
          }
        });

        // Toggle active button class
        tabButtons.forEach(b => {
          if (b.dataset.section === sectionId) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
        
        // If switching to accounting, redraw charts
        if (sectionId === 'accountingSection') {
          renderCharts();
        }
        
        // If switching to recipes, render the list
        if (sectionId === 'recipesSection') {
          renderRecipesList();
        }
      });
    });
  }

  // ============================================
  // ACCOUNTING DATA LOADERS & SYNC
  // ============================================
  async function loadAccountingData() {
    if (!firebaseReady || !db || !state.firestoreModule) return;
    const { collection, getDocs } = state.firestoreModule;

    try {
      // 1. Fetch Costs
      const costsSnapshot = await getDocs(collection(db, 'product_costs'));
      state.productCosts = {};
      costsSnapshot.forEach(doc => {
        state.productCosts[doc.id] = parseFloat(doc.data().cost || 0);
      });

      // 2. Fetch Expenses
      const expensesSnapshot = await getDocs(collection(db, 'expenses'));
      state.expenses = [];
      expensesSnapshot.forEach(doc => {
        state.expenses.push({
          id: doc.id,
          ...doc.data()
        });
      });
      state.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

      // 3. Fetch Inventory
      const inventorySnapshot = await getDocs(collection(db, 'supplies_inventory'));
      state.inventory = [];
      inventorySnapshot.forEach(doc => {
        state.inventory.push({
          id: doc.id,
          ...doc.data()
        });
      });
      state.inventory.sort((a, b) => a.name.localeCompare(b.name));

      // 3.5. Fetch Recipes
      const recipesSnapshot = await getDocs(collection(db, 'recipes'));
      state.recipes = [];
      recipesSnapshot.forEach(doc => {
        state.recipes.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // 4. Load initial investment from localStorage
      const savedInvestment = localStorage.getItem('lomas_initial_investment');
      if (savedInvestment) {
        state.initialInvestment = parseFloat(savedInvestment);
        if (dom.finInitialInvestment) {
          dom.finInitialInvestment.value = state.initialInvestment;
        }
      }

      // Populate views
      renderProductCostsTable();
      renderExpensesTable();
      renderInventoryTable();
      renderInventorySelectOptions();
      updateFinanceMetrics();
      runAiAccountantAudit();
    } catch (err) {
      console.error('Error loading accounting data:', err);
    }
  }

  function loadDemoAccountingData() {
    state.productCosts = {
      'tropiconce': 4500,
      'pink-fantasy': 4500,
      'promo-piscola': 9500,
      'promo-piscola-3l': 10500,
      'promo-manzana': 13000,
      'promo-manzana-3l': 14000,
      'pack-escudo-silver': 4000,
      'pack-escudo': 5000,
      'pack-cristal': 5000,
      'pack-royal': 6000,
      'pack-heineken': 6000
    };

    state.expenses = [
      { id: 'exp1', date: formatDateYMD(new Date(Date.now() - 86400000)), provider: 'CCU Chile', detail: 'Compra stock de cervezas Royal y Escudo', amount: 150000 },
      { id: 'exp2', date: formatDateYMD(new Date(Date.now() - 172800000)), provider: 'Distribuidora Oriente', detail: 'Insumos botellas, tapas y pulpas de fruta', amount: 85000 },
      { id: 'exp3', date: formatDateYMD(new Date(Date.now() - 345600000)), provider: 'Servipag', detail: 'Pago luz y servicios local comercial', amount: 42000 },
      { id: 'exp4', date: formatDateYMD(new Date(Date.now() - 691200000)), provider: 'Meta Ads', detail: 'Publicidad Instagram campañas preventa', amount: 50000 }
    ];

    state.inventory = [
      { id: 'inv1', name: 'Gin Boolton Royal 1L', stock: 12, cost: 4590, updatedAt: formatDateYMD(new Date(Date.now() - 86400000)) },
      { id: 'inv2', name: 'Pisco Alto del Carmen 35° 1L', stock: 18, cost: 5800, updatedAt: formatDateYMD(new Date(Date.now() - 172800000)) },
      { id: 'inv3', name: 'Tónica Fever Tree 200ml', stock: 48, cost: 950, updatedAt: formatDateYMD(new Date(Date.now() - 86400000)) },
      { id: 'inv4', name: 'Vaso Plástico Transparente 500cc', stock: 250, cost: 85, updatedAt: formatDateYMD(new Date(Date.now() - 172800000)) }
    ];

    const savedInvestment = localStorage.getItem('lomas_initial_investment');
    if (savedInvestment) {
      state.initialInvestment = parseFloat(savedInvestment);
      if (dom.finInitialInvestment) {
        dom.finInitialInvestment.value = state.initialInvestment;
      }
    }

    renderProductCostsTable();
    renderExpensesTable();
    renderInventoryTable();
    renderInventorySelectOptions();
    updateFinanceMetrics();
    runAiAccountantAudit();
  }

  function renderProductCostsTable() {
    if (!dom.productCostsTableBody) return;
    
    let html = '';
    Object.keys(PRODUCTS).forEach(key => {
      const p = PRODUCTS[key];
      const cost = state.productCosts[key] !== undefined ? state.productCosts[key] : Math.round(p.price * 0.5);
      const margin = p.price - cost;
      const marginPct = p.price > 0 ? (margin / p.price) * 100 : 0;
      const isDisabled = p.active === false;
      
      html += `
        <tr data-product-id="${key}" style="${isDisabled ? 'opacity: 0.45; background: rgba(0,0,0,0.015);' : ''}">
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <img src="${p.image}" style="width:30px; height:30px; object-fit:contain; border-radius:4px;">
              <span>${p.name} ${isDisabled ? '<strong style="color:var(--text-secondary); font-size:0.75rem; margin-left:0.5rem;">(DESACTIVADO)</strong>' : ''}</span>
            </div>
          </td>
          <td style="font-weight:600;">$${p.price.toLocaleString('es-CL')}</td>
          <td>
            <input type="number" class="product-cost-input" data-product-id="${key}" value="${cost}" min="0" ${isDisabled ? 'disabled' : ''}>
          </td>
          <td class="product-margin-td" style="font-weight:600; color: ${isDisabled ? 'var(--text-secondary)' : (marginPct >= 30 ? 'var(--success)' : 'var(--error)')};">
            $${margin.toLocaleString('es-CL')} (${marginPct.toFixed(0)}%)
          </td>
        </tr>
      `;
    });
    
    dom.productCostsTableBody.innerHTML = html;

    // Listen to changes in cost inputs to update table row margins dynamically
    dom.productCostsTableBody.querySelectorAll('.product-cost-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const prodId = input.dataset.productId;
        const newCost = parseInt(e.target.value) || 0;
        const price = PRODUCTS[prodId].price;
        const margin = price - newCost;
        const marginPct = price > 0 ? (margin / price) * 100 : 0;
        
        const td = input.closest('tr').querySelector('.product-margin-td');
        td.style.color = marginPct >= 30 ? 'var(--success)' : 'var(--error)';
        td.textContent = `$${margin.toLocaleString('es-CL')} (${marginPct.toFixed(0)}%)`;
      });
    });
  }

  async function saveProductCosts() {
    const inputs = dom.productCostsTableBody.querySelectorAll('.product-cost-input');
    const btn = dom.btnSaveProductCosts;
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      for (const input of inputs) {
        const prodId = input.dataset.productId;
        const cost = parseInt(input.value) || 0;
        state.productCosts[prodId] = cost;

        if (firebaseReady && db && state.firestoreModule) {
          const { doc, setDoc } = state.firestoreModule;
          const costRef = doc(db, 'product_costs', prodId);
          await setDoc(costRef, { cost: cost, updatedAt: new Date() }, { merge: true });
        }
      }
      
      alert('¡Costos actualizados correctamente!');
      updateFinanceMetrics();
      runAiAccountantAudit();
    } catch (err) {
      console.error('Error saving product costs:', err);
      alert('Error al guardar costos: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar Cambios';
    }
  }

  // ============================================
  // EXPENSES MANAGEMENT
  // ============================================
  async function saveExpense(date, provider, detail, amount, items = [], affectsInventory = true) {
    let imageUrl = '';
    
    if (state.currentReceiptFile && firebaseReady && db && state.firestoreModule) {
      try {
        const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js');
        const storage = getStorage(app);
        const fileRef = ref(storage, `receipts/${Date.now()}-${state.currentReceiptFile.name}`);
        const snapshot = await uploadBytes(fileRef, state.currentReceiptFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (uploadErr) {
        console.error('Error uploading receipt to Storage:', uploadErr);
        imageUrl = state.currentReceiptBase64 || '';
      }
    } else {
      imageUrl = state.currentReceiptBase64 || '';
    }

    const expData = {
      date,
      provider,
      detail,
      amount: parseInt(amount) || 0,
      items: items,
      imageUrl: imageUrl,
      affectsInventory: affectsInventory,
      createdAt: new Date()
    };

    if (firebaseReady && db && state.firestoreModule) {
      try {
        const { collection, addDoc } = state.firestoreModule;
        const docRef = await addDoc(collection(db, 'expenses'), expData);
        state.expenses.unshift({
          id: docRef.id,
          ...expData
        });
        if (affectsInventory) {
          await saveSuppliesFromExpense(items, date);
        }
      } catch (err) {
        console.error('Error saving expense to Firestore:', err);
        alert('Error al conectar con la base de datos, se guardará localmente.');
        state.expenses.unshift({ id: 'local-' + Date.now(), ...expData });
        if (affectsInventory) {
          saveDemoSuppliesFromExpense(items, date);
        }
      }
    } else {
      state.expenses.unshift({ id: 'demo-' + Date.now(), ...expData });
      if (affectsInventory) {
        saveDemoSuppliesFromExpense(items, date);
      }
    }

    renderExpensesTable();
    updateFinanceMetrics();
    runAiAccountantAudit();
    resetExpenseForm();
  }

  function renderExpensesTable() {
    if (!dom.expensesTableBody) return;
    
    if (state.expenses.length === 0) {
      dom.expensesTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
            No hay gastos cargados este período.
          </td>
        </tr>
      `;
      return;
    }
    
    let html = '';
    state.expenses.forEach(exp => {
      html += `
        <tr>
          <td style="font-weight:600; white-space:nowrap;">${exp.date}</td>
          <td>${exp.provider}</td>
          <td>${exp.detail}</td>
          <td style="font-weight:700; color:var(--error);">$${exp.amount.toLocaleString('es-CL')}</td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              ${exp.imageUrl ? `
                <button class="btn-view-receipt" data-img="${exp.imageUrl}" style="background:none; border:none; color:var(--gold); cursor:pointer; font-size:1.1rem; padding:2px;" title="Ver boleta">
                  👁️
                </button>
              ` : ''}
              <button class="btn-delete-expense" data-id="${exp.id}" style="background:none; border:none; color:var(--error); cursor:pointer; font-size:1.1rem; padding:2px;" title="Eliminar egreso">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    dom.expensesTableBody.innerHTML = html;

    // View buttons
    dom.expensesTableBody.querySelectorAll('.btn-view-receipt').forEach(btn => {
      btn.addEventListener('click', () => {
        const imgUrl = btn.dataset.img;
        openReceiptPhotoModal(imgUrl);
      });
    });

    // Delete buttons
    dom.expensesTableBody.querySelectorAll('.btn-delete-expense').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm('¿Estás seguro de que deseas eliminar este registro de gasto?')) return;
        
        try {
          if (firebaseReady && db && state.firestoreModule) {
            const { doc, deleteDoc } = state.firestoreModule;
            await deleteDoc(doc(db, 'expenses', id));
          }
          state.expenses = state.expenses.filter(exp => exp.id !== id);
          renderExpensesTable();
          updateFinanceMetrics();
          runAiAccountantAudit();
        } catch (err) {
          console.error('Error deleting expense:', err);
          alert('Error al eliminar: ' + err.message);
        }
      });
    });
  }

  function resetExpenseForm() {
    dom.expenseForm.style.display = 'none';
    dom.receiptUploadZone.style.display = 'flex';
    dom.ocrProgressContainer.style.display = 'none';
    dom.receiptFileInput.value = '';
    dom.expDate.value = '';
    dom.expProvider.value = '';
    dom.expDetail.value = '';
    dom.expAmount.value = '';
    if (dom.expAffectsInventory) {
      dom.expAffectsInventory.checked = true;
    }
    state.currentReceiptFile = null;
    state.currentReceiptBase64 = null;
    if (dom.expenseItemsTableBody) {
      dom.expenseItemsTableBody.innerHTML = '';
      renderExpenseItemsTable();
    }
  }

  // ============================================
  // METRICS & PROFITS CALCULATOR
  // ============================================
  function updateFinanceMetrics() {
    // 1. Gross Revenue
    const validOrders = state.orders.filter(order => {
      const isPaid = order.payment?.status === 'paid' || order.status === 'confirmed' || order.status === 'preparing' || order.status === 'delivering' || order.status === 'delivered';
      return isPaid && order.status !== 'cancelled';
    });

    const grossRevenue = validOrders.reduce((sum, order) => sum + (parseInt(order.total) || 0), 0);

    // 2. COGS (Costo de Ventas)
    let cogs = 0;
    validOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          let baseId = item.id || '';
          if (baseId.startsWith('tropiconce')) baseId = 'tropiconce';
          else if (baseId.startsWith('pink-fantasy')) baseId = 'pink-fantasy';
          
          let unitCost = state.productCosts[baseId];
          if (unitCost === undefined) {
            const product = PRODUCTS[baseId];
            const itemPrice = parseInt(item.price) || 0;
            unitCost = product ? Math.round(product.price * 0.5) : Math.round(itemPrice * 0.5);
          }
          cogs += unitCost * (parseInt(item.quantity) || 1);
        });
      }
    });

    // 3. Gross Margin
    const grossMargin = grossRevenue - cogs;
    const grossMarginPct = grossRevenue > 0 ? (grossMargin / grossRevenue) * 100 : 0;

    // 4. OpEx
    const opex = state.expenses.reduce((sum, exp) => sum + (parseInt(exp.amount) || 0), 0);

    // 5. Net Profit
    const netProfit = grossMargin - opex;
    const netProfitPct = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    // 6. ROI
    const roi = state.initialInvestment > 0 ? (netProfit / state.initialInvestment) * 100 : 0;

    // Calculate Inventory Value
    const inventoryValue = state.inventory.reduce((sum, item) => sum + (parseFloat(item.stock || 0) * parseFloat(item.cost || 0)), 0);

    // Update HTML values
    if (dom.finGrossRevenue) dom.finGrossRevenue.textContent = `$${grossRevenue.toLocaleString('es-CL')}`;
    if (dom.finOpEx) dom.finOpEx.textContent = `$${opex.toLocaleString('es-CL')}`;
    if (dom.finInventoryValue) dom.finInventoryValue.textContent = `$${Math.round(inventoryValue).toLocaleString('es-CL')}`;
    
    if (dom.finNetProfit) {
      dom.finNetProfit.textContent = `$${netProfit.toLocaleString('es-CL')}`;
      dom.finNetProfitPct.textContent = `${netProfit >= 0 ? '+' : ''}${netProfitPct.toFixed(1)}%`;
      dom.finNetProfitPct.className = `kpi-percentage-finance ${netProfit >= 0 ? 'profit-text' : 'loss-text'}`;
      dom.finNetProfitCard.className = `kpi-card-finance ${netProfit >= 0 ? 'profit' : 'loss'}`;
    }

    if (dom.finROI) {
      dom.finROI.textContent = `ROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`;
    }

    // Refresh charts if they are visible
    if (dom.accountingSection && dom.accountingSection.style.display !== 'none') {
      renderCharts();
    }
  }

  // ============================================
  // GRAPHICS DRAWING (CHART.JS)
  // ============================================
  function renderCharts() {
    if (typeof Chart === 'undefined') return;

    if (state.charts.revenueCostChartInstance) state.charts.revenueCostChartInstance.destroy();
    if (state.charts.expenseDistributionChartInstance) state.charts.expenseDistributionChartInstance.destroy();

    // 1. Line/Bar Chart: Revenue vs COGS vs OpEx
    const revenueCostCtx = $('#revenueCostChart');
    if (revenueCostCtx) {
      const labels = [];
      const revenueData = [];
      const cogsData = [];
      const opexData = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = formatDateYMD(d);
        labels.push(d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }));

        const dayOrders = state.orders.filter(o => {
          const isPaid = o.payment?.status === 'paid' || o.status === 'confirmed' || o.status === 'preparing' || o.status === 'delivering' || o.status === 'delivered';
          if (!isPaid || o.status === 'cancelled') return false;
          
          let oDate = '';
          if (o.createdAt) {
            oDate = o.createdAt.seconds 
              ? formatDateYMD(new Date(o.createdAt.seconds * 1000))
              : formatDateYMD(new Date(o.createdAt));
          }
          return oDate === dateStr;
        });

        const dayRev = dayOrders.reduce((sum, o) => sum + (parseInt(o.total) || 0), 0);
        revenueData.push(dayRev);

        let dayCogs = 0;
        dayOrders.forEach(o => {
          if (o.items) {
            o.items.forEach(item => {
              let baseId = item.id || '';
              if (baseId.startsWith('tropiconce')) baseId = 'tropiconce';
              else if (baseId.startsWith('pink-fantasy')) baseId = 'pink-fantasy';
              const cost = state.productCosts[baseId] !== undefined ? state.productCosts[baseId] : Math.round((parseInt(item.price) || 0) * 0.5);
              dayCogs += cost * (parseInt(item.quantity) || 1);
            });
          }
        });
        cogsData.push(dayCogs);

        const dayOpex = state.expenses
          .filter(e => e.date === dateStr)
          .reduce((sum, e) => sum + (parseInt(e.amount) || 0), 0);
        opexData.push(dayOpex);
      }

      state.charts.revenueCostChartInstance = new Chart(revenueCostCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Ingresos Brutos ($)',
              data: revenueData,
              backgroundColor: 'rgba(46, 204, 113, 0.65)',
              borderColor: '#2ecc71',
              borderWidth: 1
            },
            {
              label: 'Costo Venta (COGS) ($)',
              data: cogsData,
              backgroundColor: 'rgba(230, 126, 34, 0.65)',
              borderColor: '#e67e22',
              borderWidth: 1
            },
            {
              label: 'Gastos OpEx ($)',
              data: opexData,
              backgroundColor: 'rgba(231, 76, 60, 0.65)',
              borderColor: '#e74c3c',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: { color: '#555' }
            },
            x: {
              grid: { color: 'rgba(0,0,0,0.03)' },
              ticks: { color: '#555' }
            }
          },
          plugins: {
            legend: { labels: { color: '#444' } }
          }
        }
      });
    }

    // 2. Doughnut Chart: Expense Breakdown
    const expenseDistributionCtx = $('#expenseDistributionChart');
    if (expenseDistributionCtx) {
      const providerTotals = {};
      state.expenses.forEach(e => {
        const prov = e.provider || 'Otros';
        providerTotals[prov] = (providerTotals[prov] || 0) + (parseInt(e.amount) || 0);
      });

      const labels = Object.keys(providerTotals);
      const data = Object.values(providerTotals);

      const finalLabels = labels.length > 0 ? labels : ['Sin Gastos'];
      const finalData = data.length > 0 ? data : [1];
      const colors = [
        '#dca311', '#e67e22', '#3498db', '#9b59b6', '#e74c3c', '#2ecc71', '#1abc9c'
      ];

      state.charts.expenseDistributionChartInstance = new Chart(expenseDistributionCtx, {
        type: 'doughnut',
        data: {
          labels: finalLabels,
          datasets: [{
            data: finalData,
            backgroundColor: finalLabels[0] === 'Sin Gastos' ? ['rgba(0,0,0,0.05)'] : colors.slice(0, finalLabels.length),
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'right',
              labels: { color: '#444', font: { size: 10 } } 
            }
          }
        }
      });
    }
  }

  // ============================================
  // AI ACCOUNTANT (AUDITING & ADVISORY CHAT)
  // ============================================
  function runAiAccountantAudit() {
    if (!dom.aiAlertsList) return;

    const alerts = [];

    // 1. Verify balance discrepancies
    state.orders.forEach(order => {
      if (order.status === 'cancelled') return;

      let calculatedSum = 0;
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          calculatedSum += (parseInt(item.price) || 0) * (parseInt(item.quantity) || 1);
        });
      }
      calculatedSum += parseInt(order.deliveryFee) || 0;
      calculatedSum -= parseInt(order.discount) || 0;

      const totalDiff = Math.abs(calculatedSum - (parseInt(order.total) || 0));
      if (totalDiff > 5) {
        alerts.push({
          type: 'danger',
          text: `🚨 <strong>Descuadre en Pedido #${order.orderNumber || order.id.slice(0, 6)}:</strong> El total registrado es de $${(parseInt(order.total) || 0).toLocaleString('es-CL')} pero la suma detallada de productos y despacho calcula $${calculatedSum.toLocaleString('es-CL')} (diferencia de $${totalDiff.toLocaleString('es-CL')}).`
        });
      }
    });

    // 2. Unconfigured Costs
    const unconfiguredCostsProducts = [];
    Object.keys(PRODUCTS).forEach(key => {
      const cost = state.productCosts[key];
      if (cost === 0 || cost === undefined) {
        unconfiguredCostsProducts.push(PRODUCTS[key].name);
      }
    });

    if (unconfiguredCostsProducts.length > 0) {
      alerts.push({
        type: 'warning',
        text: `⚠️ <strong>Costos no configurados:</strong> Hay productos sin costo registrado (${unconfiguredCostsProducts.join(', ')}). Los cálculos de utilidad bruta pueden estar inflados.`
      });
    }

    // 3. Critical Margins
    Object.keys(PRODUCTS).forEach(key => {
      const p = PRODUCTS[key];
      const cost = state.productCosts[key] !== undefined ? state.productCosts[key] : Math.round(p.price * 0.5);
      const margin = p.price - cost;
      const marginPct = p.price > 0 ? (margin / p.price) * 100 : 0;
      if (marginPct < 30 && cost > 0) {
        alerts.push({
          type: 'warning',
          text: `📈 <strong>Margen Crítico:</strong> El producto '${p.name}' tiene un margen bruto de ${marginPct.toFixed(0)}% (costo $${cost.toLocaleString('es-CL')}). Se sugiere aumentar el precio de venta o negociar costos con el proveedor.`
        });
      }
    });

    // 4. Net Profit/Loss
    const validOrders = state.orders.filter(order => {
      const isPaid = order.payment?.status === 'paid' || order.status === 'confirmed' || order.status === 'preparing' || order.status === 'delivering' || order.status === 'delivered';
      return isPaid && order.status !== 'cancelled';
    });
    const grossRevenue = validOrders.reduce((sum, order) => sum + (parseInt(order.total) || 0), 0);
    
    let cogs = 0;
    validOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          let baseId = item.id || '';
          if (baseId.startsWith('tropiconce')) baseId = 'tropiconce';
          else if (baseId.startsWith('pink-fantasy')) baseId = 'pink-fantasy';
          const cost = state.productCosts[baseId] !== undefined ? state.productCosts[baseId] : Math.round((parseInt(item.price) || 0) * 0.5);
          cogs += cost * (parseInt(item.quantity) || 1);
        });
      }
    });
    const grossMargin = grossRevenue - cogs;
    const opex = state.expenses.reduce((sum, exp) => sum + (parseInt(exp.amount) || 0), 0);
    const netProfit = grossMargin - opex;

    if (netProfit < 0 && grossRevenue > 0) {
      alerts.push({
        type: 'danger',
        text: `⚖️ <strong>Utilidad Neta Negativa (Pérdidas):</strong> Tu utilidad neta es de -$${Math.abs(netProfit).toLocaleString('es-CL')}. Los gastos operacionales ($${opex.toLocaleString('es-CL')}) superan el margen bruto ($${grossMargin.toLocaleString('es-CL')}). Considera recortar gastos fijos de inmediato.`
      });
    }

    // 5. Low Stock / Critical Stock warnings
    state.inventory.forEach(item => {
      const stock = parseFloat(item.stock) || 0;
      const capacity = parseFloat(item.capacity) || 1;
      const unit = item.unit || 'unidades';
      const unitsCount = stock / capacity;
      
      const purchaseLabel = unit === 'ml' ? 'botellas' : unit === 'gr' ? 'paquetes' : 'unidades';
      
      if (unitsCount <= 3) {
        alerts.push({
          type: 'danger',
          text: `🚨 <strong>Stock Crítico de Insumo:</strong> Quedan solo <strong>${unitsCount.toFixed(1).replace(/\.0$/, '')} ${purchaseLabel}</strong> (${stock.toLocaleString('es-CL')} ${unit}) de '${item.name}'. ¡Es urgente abastecer este insumo!`
        });
      } else if (unitsCount <= 8) {
        alerts.push({
          type: 'warning',
          text: `⚠️ <strong>Poco Stock de Insumo:</strong> Quedan <strong>${unitsCount.toFixed(1).replace(/\.0$/, '')} ${purchaseLabel}</strong> (${stock.toLocaleString('es-CL')} ${unit}) de '${item.name}'. Considera comprar más pronto.`
        });
      }
    });

    if (alerts.length === 0) {
      dom.aiAlertsList.innerHTML = `
        <div class="ai-alert success">
          <span class="alert-icon">✓</span>
          <p>Auditoría de caja e indicadores financieros completada: No se detectan anomalías, descuadres ni márgenes de riesgo.</p>
        </div>
      `;
    } else {
      dom.aiAlertsList.innerHTML = alerts.map(a => `
        <div class="ai-alert ${a.type}">
          <span class="alert-icon">${a.type === 'danger' ? '✖' : '⚠️'}</span>
          <p>${a.text}</p>
        </div>
      `).join('');
    }
  }

  function handleAiChatSubmit() {
    if (!dom.aiChatInput || !dom.aiChatMessages) return;
    const query = dom.aiChatInput.value.trim();
    if (!query) return;

    addAiChatMessage(query, 'user');
    dom.aiChatInput.value = '';
    dom.aiChatMessages.scrollTop = dom.aiChatMessages.scrollHeight;

    setTimeout(() => {
      const response = generateAiAccountantResponse(query);
      addAiChatMessage(response, 'assistant');
      dom.aiChatMessages.scrollTop = dom.aiChatMessages.scrollHeight;
    }, 600);
  }

  function addAiChatMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `ai-message ${sender}`;
    msg.innerHTML = text;
    dom.aiChatMessages.appendChild(msg);
  }

  function generateAiAccountantResponse(query) {
    const q = query.toLowerCase();

    // Context / scope boundaries
    const businessFinanceTerms = [
      'utilidad', 'margen', 'ganancia', 'pérdida', 'perdida', 'gasto', 'costo',
      'cogs', 'descuadre', 'caja', 'diferencia', 'venta', 'ingreso', 'dinero',
      'roi', 'inversion', 'inversión', 'rentable', 'rentabilidad', 'cfo', 'contador',
      'local', 'lomas', 'drinks', 'boleta', 'factura', 'equilibrio', 'break', 'even'
    ];
    
    const isRelated = businessFinanceTerms.some(term => q.includes(term));
    if (!isRelated && !q.includes('hola') && !q.includes('buenas')) {
      return `Como contador virtual de <strong>Lomas & Drinks</strong>, solo puedo responder consultas sobre las finanzas, costos, utilidades, boletas o auditorías del negocio. Por favor, realiza una consulta dentro de este ámbito contable.`;
    }

    const validOrders = state.orders.filter(order => {
      const isPaid = order.payment?.status === 'paid' || order.status === 'confirmed' || order.status === 'preparing' || order.status === 'delivering' || order.status === 'delivered';
      return isPaid && order.status !== 'cancelled';
    });
    const grossRevenue = validOrders.reduce((sum, order) => sum + (parseInt(order.total) || 0), 0);
    
    let cogs = 0;
    validOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          let baseId = item.id || '';
          if (baseId.startsWith('tropiconce')) baseId = 'tropiconce';
          else if (baseId.startsWith('pink-fantasy')) baseId = 'pink-fantasy';
          const cost = state.productCosts[baseId] !== undefined ? state.productCosts[baseId] : Math.round((parseInt(item.price) || 0) * 0.5);
          cogs += cost * (parseInt(item.quantity) || 1);
        });
      }
    });

    const grossMargin = grossRevenue - cogs;
    const grossMarginPct = grossRevenue > 0 ? (grossMargin / grossRevenue) * 100 : 0;
    const opex = state.expenses.reduce((sum, exp) => sum + (parseInt(exp.amount) || 0), 0);
    const netProfit = grossMargin - opex;
    const netProfitPct = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    const roi = state.initialInvestment > 0 ? (netProfit / state.initialInvestment) * 100 : 0;

    if (q === 'hola' || q.startsWith('hola ') || q.startsWith('buenas noches') || q.startsWith('buenos dias')) {
      return `¡Hola! Soy tu contador virtual. He auditado las finanzas de Lomas & Drinks. Actualmente registramos <strong>$${grossRevenue.toLocaleString('es-CL')}</strong> en ventas brutos y <strong>$${opex.toLocaleString('es-CL')}</strong> en gastos operacionales. ¿Qué aspecto contable te gustaría revisar hoy?`;
    }

    if (q.includes('mejorar') || q.includes('aumentar') || q.includes('reducir costos') || q.includes('recortar')) {
      let worstProduct = '';
      let worstMargin = 100;
      Object.keys(PRODUCTS).forEach(key => {
        const p = PRODUCTS[key];
        const cost = state.productCosts[key] !== undefined ? state.productCosts[key] : Math.round(p.price * 0.5);
        const marginPct = p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0;
        if (marginPct < worstMargin && cost > 0) {
          worstMargin = marginPct;
          worstProduct = p.name;
        }
      });

      return `<strong>Análisis contable para optimizar utilidades de Lomas & Drinks:</strong><br>
        1. <strong>Márgenes de Producto:</strong> Tu producto con menor margen bruto es '${worstProduct}' con solo un <strong>${worstMargin.toFixed(0)}%</strong>. Te aconsejo subir su precio o buscar insumos más económicos.<br>
        2. <strong>Estructura OpEx:</strong> Los gastos fijos/operacionales suman $${opex.toLocaleString('es-CL')} (${(grossRevenue > 0 ? (opex/grossRevenue*100) : 0).toFixed(0)}% de los ingresos). Se sugiere suspender campañas de marketing poco eficientes y centralizar despachos para bajar costos de traslado.<br>
        3. <strong>Venta Cruzada:</strong> Ofrece promociones agrupadas (ej. la promo 2x) para elevar el Ticket Promedio, lo que diluye los costos logísticos por pedido.`;
    }

    if (q.includes('descuadre') || q.includes('caja') || q.includes('cuadra') || q.includes('error')) {
      const discrepantOrders = [];
      state.orders.forEach(order => {
        if (order.status === 'cancelled') return;
        let sum = 0;
        if (order.items) {
          order.items.forEach(item => {
            sum += (parseInt(item.price) || 0) * (parseInt(item.quantity) || 1);
          });
        }
        sum += parseInt(order.deliveryFee) || 0;
        sum -= parseInt(order.discount) || 0;
        if (Math.abs(sum - (parseInt(order.total) || 0)) > 5) {
          discrepantOrders.push(`Pedido #${order.orderNumber || order.id.slice(0, 6)}`);
        }
      });

      if (discrepantOrders.length > 0) {
        return `⚠️ <strong>¡Alerta de Auditoría!</strong> Encontré <strong>${discrepantOrders.length} descuadre(s)</strong> en los registros de caja:<br>
          * <strong>${discrepantOrders.join(', ')}</strong> tiene una discrepancia entre el total facturado y la suma de sus productos + envío.<br><br>
          Por favor, revisa estas órdenes en la pestaña de Pedidos.`;
      } else {
        return `✅ <strong>Auditoría de Caja Exitosa:</strong> Todas las transacciones cuadran al 100%. No he encontrado ninguna diferencia matemática entre los totales facturados y el desglose de productos/despacho en las órdenes.`;
      }
    }

    if (q.includes('rentable') || q.includes('estrella') || q.includes('rentabilidad') || q.includes('margen')) {
      let bestProduct = '';
      let bestMarginPct = 0;
      Object.keys(PRODUCTS).forEach(key => {
        const p = PRODUCTS[key];
        const cost = state.productCosts[key] !== undefined ? state.productCosts[key] : Math.round(p.price * 0.5);
        const marginPct = p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0;
        if (marginPct > bestMarginPct) {
          bestMarginPct = marginPct;
          bestProduct = p.name;
        }
      });

      return `🍹 <strong>Análisis de Rentabilidad de Productos:</strong><br>
        * El producto más rentable porcentualmente es <strong>${bestProduct}</strong>, con un margen bruto de <strong>${bestMarginPct.toFixed(0)}%</strong> por unidad vendida.<br>
        * Te recomiendo enfocar tus esfuerzos de marketing en este producto, ya que genera más utilidad directa por peso ingresado.`;
    }

    if (q.includes('perdida') || q.includes('pérdida') || q.includes('ganancia') || q.includes('renta') || q.includes('utilidad') || q.includes('roi')) {
      if (grossRevenue === 0) {
        return `Actualmente no hay ventas acumuladas registradas en el sistema para calcular utilidad. Ingresa órdenes para auditar.`;
      }

      const balanceText = netProfit >= 0 
        ? `Tus operaciones son saludables, con una utilidad neta de <strong>+$${netProfit.toLocaleString('es-CL')}</strong> (margen neto del ${netProfitPct.toFixed(1)}%).` 
        : `Tienes pérdidas netas por un total de <strong>-$${Math.abs(netProfit).toLocaleString('es-CL')}</strong>. Debes reducir los gastos operacionales.`;

      return `📊 <strong>Estado de Pérdidas y Ganancias (P&G):</strong><br>
        * <strong>Ventas Totales:</strong> $${grossRevenue.toLocaleString('es-CL')}<br>
        * <strong>Costo de Venta (COGS):</strong> $${cogs.toLocaleString('es-CL')} (Margen Bruto: ${grossMarginPct.toFixed(0)}%)<br>
        * <strong>Gastos Fijos/OpEx:</strong> $${opex.toLocaleString('es-CL')}<br>
        * <strong>Utilidad Neta:</strong> $${netProfit.toLocaleString('es-CL')}<br><br>
        <strong>Conclusión:</strong> ${balanceText}<br>
        <strong>ROI acumulado:</strong> ${roi.toFixed(2)}% (sobre una inversión inicial de $${state.initialInvestment.toLocaleString('es-CL')}).`;
    }

    if (q.includes('equilibrio') || q.includes('break') || q.includes('punto')) {
      if (opex === 0) {
        return `Tus gastos operacionales (OpEx) están en $0. En esta condición, el punto de equilibrio es inmediato. Si registras gastos de boletas, recalcularé el volumen de ventas necesario para cubrirlos.`;
      }

      let totalUnits = 0;
      let totalMargins = 0;
      Object.keys(PRODUCTS).forEach(key => {
        const p = PRODUCTS[key];
        const cost = state.productCosts[key] !== undefined ? state.productCosts[key] : Math.round(p.price * 0.5);
        totalMargins += (p.price - cost);
        totalUnits++;
      });
      const avgMarginPerUnit = totalMargins / totalUnits;
      const breakEvenUnits = Math.ceil(opex / avgMarginPerUnit);

      return `⚖️ <strong>Punto de Equilibrio Financiero:</strong><br>
        * Tus costos de operación fijos (OpEx) actuales son de <strong>$${opex.toLocaleString('es-CL')}</strong>.<br>
        * En promedio, cada producto del catálogo genera <strong>$${Math.round(avgMarginPerUnit).toLocaleString('es-CL')}</strong> de utilidad bruta.<br>
        * Para cubrir tus gastos y comenzar a generar ganancias líquidas, requieres vender al menos <strong>${breakEvenUnits} unidades</strong> en total.<br>
        * Actualmente tienes un volumen acumulado de ventas, lo que indica que estás a un ${((grossMargin/opex)*100).toFixed(0)}% de alcanzar el equilibrio de operación.`;
    }

    return `He procesado tu pregunta sobre Lomas & Drinks. Como contador del local, te informo que los ingresos brutos son de $${grossRevenue.toLocaleString('es-CL')}, con un costo de ventas de $${cogs.toLocaleString('es-CL')} y gastos de boletas de $${opex.toLocaleString('es-CL')}. Por favor, pregúntame específicamente sobre 'márgenes', 'descuadres', 'gastos', 'punto de equilibrio' o 'utilidades' para entregarte un informe detallado de esa sección.`;
  }

  // ============================================
  // OCR RECEIPTS SCANNING (TESSERACT.JS)
  // ============================================
  async function handleReceiptUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    state.currentReceiptFile = file;

    const reader = new FileReader();
    reader.onload = (event) => {
      state.currentReceiptBase64 = event.target.result;
      if (dom.ocrPreviewImage) dom.ocrPreviewImage.src = event.target.result;
    };
    reader.readAsDataURL(file);

    dom.receiptUploadZone.style.display = 'none';
    dom.ocrProgressContainer.style.display = 'flex';
    dom.expenseForm.style.display = 'none';

    updateOcrProgress('Cargando motor de reconocimiento OCR...', 10);

    try {
      if (typeof Tesseract === 'undefined') {
        throw new Error('La librería Tesseract.js no se cargó correctamente. Usando simulación inteligente.');
      }

      updateOcrProgress('Preprocesando imagen para mejor lectura...', 15);

      // Preprocess: convert to high-contrast B&W to remove stamp/seal noise
      const preprocessed = await preprocessReceiptImage(file);
      
      updateOcrProgress('Inicializando Tesseract (Español)...', 25);
      
      Tesseract.recognize(
        preprocessed,
        'spa',
        { 
          logger: m => {
            if (m.status === 'recognizing text') {
              const progress = Math.round(25 + (m.progress * 65));
              updateOcrProgress('Escaneando caracteres y montos de la boleta...', progress);
            }
          } 
        }
      ).then(async ({ data: { text } }) => {
        updateOcrProgress('Analizando e interpretando datos contables...', 95);
        console.log('[OCR Extracted Text]:', text);
        
        const extracted = parseReceiptText(text);
        console.log('[OCR Parsed Receipt]:', JSON.stringify(extracted));
        
        dom.expDate.value = extracted.date || formatDateYMD(new Date());
        dom.expProvider.value = extracted.provider || '';
        dom.expDetail.value = extracted.detail || 'Insumos y mercadería';
        dom.expAmount.value = extracted.amount || '';

        // Extract sub-items from OCR text
        const items = parseOCRLineItems(text);
        console.log('[OCR Items Count]:', items.length, items);
        dom.expenseItemsTableBody.innerHTML = '';
        if (items.length > 0) {
          items.forEach(item => {
            addExpenseItemRow(item.name, item.qty, item.price);
          });
          console.log('[OCR] Added ' + items.length + ' items to expense table');
        } else {
          renderExpenseItemsTable();
          console.warn('[OCR] No items detected from boleta text');
        }

        dom.ocrProgressContainer.style.display = 'none';
        dom.expenseForm.style.display = 'block';
      }).catch(err => {
        console.error('OCR recognition error:', err);
        fallbackToSimulatedOcr(file);
      });

    } catch (err) {
      console.warn('OCR Initialization failed, falling back to smart simulation:', err);
      fallbackToSimulatedOcr(file);
    }
  }

  function updateOcrProgress(title, pct) {
    if (dom.ocrStatusTitle) dom.ocrStatusTitle.textContent = title;
    if (dom.ocrProgressBarFill) dom.ocrProgressBarFill.style.width = `${pct}%`;
    if (dom.ocrStatusPct) dom.ocrStatusPct.textContent = `${pct}%`;
  }

  // Preprocess receipt image: convert to high-contrast B&W to remove stamp/seal noise
  function preprocessReceiptImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Scale down if very large (improves OCR speed without losing quality)
        let w = img.width;
        let h = img.height;
        const maxDim = 2000;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        canvas.width = w;
        canvas.height = h;
        
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        
        // Step 1: Convert to grayscale with emphasis on dark ink
        // Blue/light colors (stamps) become lighter, black text stays dark
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2];
          
          // Detect and remove blue/cyan stamp colors
          // Blue stamps have high blue channel relative to others
          const isBlueish = (b > 100 && b > r * 1.2 && b > g * 1.1);
          const isCyanish = (b > 100 && g > 100 && r < 150 && (b + g) > r * 2.5);
          
          if (isBlueish || isCyanish) {
            // Make stamp areas white
            data[i] = data[i+1] = data[i+2] = 255;
          } else {
            // Standard grayscale for everything else
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            data[i] = data[i+1] = data[i+2] = gray;
          }
        }
        
        // Step 2: Increase contrast (make darks darker, lights lighter)
        const contrast = 80; // strong contrast boost
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        for (let i = 0; i < data.length; i += 4) {
          data[i]   = Math.max(0, Math.min(255, Math.round(factor * (data[i] - 128) + 128)));
          data[i+1] = Math.max(0, Math.min(255, Math.round(factor * (data[i+1] - 128) + 128)));
          data[i+2] = Math.max(0, Math.min(255, Math.round(factor * (data[i+2] - 128) + 128)));
        }
        
        // Step 3: Adaptive threshold - make it pure black & white
        const threshold = 140;
        for (let i = 0; i < data.length; i += 4) {
          const val = data[i] < threshold ? 0 : 255;
          data[i] = data[i+1] = data[i+2] = val;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        console.log('[OCR Preprocess] Image converted to B&W:', w, 'x', h);
        
        // Return as blob for Tesseract
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            console.warn('[OCR Preprocess] Canvas toBlob failed, using original file');
            resolve(file);
          }
        }, 'image/png');
      };
      
      img.onerror = () => {
        console.warn('[OCR Preprocess] Image load failed, using original file');
        resolve(file);
      };
      
      // Load from file
      const url = URL.createObjectURL(file);
      img.src = url;
    });
  }

  function parseReceiptText(text) {
    const res = {
      amount: null,
      date: null,
      provider: null,
      detail: 'Compra de insumos'
    };

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    const dateMatch = text.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (dateMatch) {
      res.date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    } else {
      const dateMatchIso = text.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
      if (dateMatchIso) {
        res.date = `${dateMatchIso[1]}-${dateMatchIso[2]}-${dateMatchIso[3]}`;
      }
    }

    const providerCandidates = [];
    const ignoreProviderRegex = /boleta|factura|electronica|r\.u\.t|rut|giro|fecha|nro|telefono|tel|cel|cliente|vendedor|caja/i;
    for (let i = 0; i < Math.min(6, lines.length); i++) {
      const line = lines[i];
      if (!ignoreProviderRegex.test(line) && line.length > 3 && line.length < 35 && !/\d{2,}/.test(line)) {
        providerCandidates.push(line);
      }
    }
    if (providerCandidates.length > 0) {
      res.provider = providerCandidates[0];
    } else {
      res.provider = ''; // Clear provider if not found instead of inventing
    }

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].toLowerCase();
      if ((line.includes('total') || line.includes('pagar') || line.includes('neto') || line.includes('monto')) && !line.includes('subtotal') && !line.includes('descuento')) {
        const match = lines[i].replace(/[^\d]/g, '');
        if (match.length >= 3 && match.length <= 8) {
          res.amount = parseInt(match);
          break;
        }
      }
    }

    if (!res.amount) {
      const allNumbers = text.match(/\d+[\d.,]*/g);
      if (allNumbers) {
        const candidates = allNumbers
          .map(num => parseInt(num.replace(/[.,]/g, '')))
          .filter(val => val >= 1000 && val < 500000);
        if (candidates.length > 0) {
          res.amount = Math.max(...candidates);
        }
      }
    }

    return res;
  }

  function fallbackToSimulatedOcr(file) {
    updateOcrProgress('Procesando archivo de boleta...', 50);
    setTimeout(() => {
      // Clear fields to let user fill manually, do NOT invent data.
      dom.expDate.value = formatDateYMD(new Date());
      dom.expProvider.value = '';
      dom.expDetail.value = '';
      dom.expAmount.value = '';
      if (dom.expenseItemsTableBody) {
        dom.expenseItemsTableBody.innerHTML = '';
        renderExpenseItemsTable();
      }

      dom.ocrProgressContainer.style.display = 'none';
      dom.expenseForm.style.display = 'block';

      alert('No se pudo extraer el texto de la boleta automáticamente. Por favor, completa los datos de la compra manualmente.');
    }, 1000);
  }

  function formatDateYMD(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  // ============================================
  // SUPPLIES INVENTORY & ADJUSTMENTS CONTROLLERS
  // ============================================
  function renderInventoryTable() {
    if (!dom.inventoryTableBody) return;
    
    if (state.inventory.length === 0) {
      dom.inventoryTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
            No hay insumos registrados. Sube boletas de compras para poblar el inventario.
          </td>
        </tr>
      `;
      return;
    }
    
    let html = '';
    state.inventory.forEach(item => {
      const stock = parseFloat(item.stock) || 0;
      const capacity = parseFloat(item.capacity) || 1;
      const unit = item.unit || 'unidades';
      const cost = parseFloat(item.cost) || 0;
      
      const unitsCount = stock / capacity;
      const totalValue = unitsCount * cost;
      
      // Determine low stock flags based on purchase units
      let stockStyle = 'font-weight:700; color:var(--gold);';
      let stockBadge = '';
      
      if (unitsCount <= 3) {
        stockStyle = 'font-weight:700; color:var(--status-cancelled); background: var(--status-cancelled-bg); padding: 3px 8px; border-radius: 6px; display: inline-block;';
        stockBadge = '<span style="font-size:0.7rem; color:var(--status-cancelled); font-weight:bold; display:block; margin-top:4px;">🚨 STOCK CRÍTICO</span>';
      } else if (unitsCount <= 8) {
        stockStyle = 'font-weight:700; color:var(--status-preparing); background: var(--status-preparing-bg); padding: 3px 8px; border-radius: 6px; display: inline-block;';
        stockBadge = '<span style="font-size:0.7rem; color:var(--status-preparing); font-weight:bold; display:block; margin-top:4px;">⚠️ STOCK BAJO</span>';
      }
      
      // Format Stock Display Text
      let stockText = '';
      if (unit === 'unidades') {
        stockText = `${stock.toFixed(1).replace(/\.0$/, '')} unidades`;
      } else {
        const purchaseLabel = unit === 'ml' ? 'botella(s)' : 'bolsa(s)/paquete(s)';
        stockText = `${unitsCount.toFixed(1).replace(/\.0$/, '')} ${purchaseLabel} (${stock.toLocaleString('es-CL')} ${unit})`;
      }
      
      html += `
        <tr>
          <td style="font-weight:600; color:var(--text-primary);">${item.name}</td>
          <td>
            <span style="${stockStyle}">${stockText}</span>
            ${stockBadge}
          </td>
          <td>$${Math.round(cost).toLocaleString('es-CL')} ${unit !== 'unidades' ? `por u.` : ''}</td>
          <td style="font-weight:600;">$${Math.round(totalValue).toLocaleString('es-CL')}</td>
          <td style="color:var(--text-secondary); font-size:0.8rem;">${item.updatedAt || 'Sin fecha'}</td>
        </tr>
      `;
    });
    
    dom.inventoryTableBody.innerHTML = html;
  }

  function renderInventorySelectOptions() {
    if (!dom.invAdjustSelect) return;
    
    let html = '<option value="">-- Seleccionar Insumo --</option>';
    html += '<option value="__new__">🆕 [Nuevo Insumo / Ingrediente]</option>';
    
    state.inventory.forEach(item => {
      const stock = parseFloat(item.stock) || 0;
      const capacity = parseFloat(item.capacity) || 1;
      const unit = item.unit || 'unidades';
      const unitsCount = stock / capacity;
      
      let displayStock = '';
      if (unit === 'unidades') {
        displayStock = `${stock.toFixed(1).replace(/\.0$/, '')} u.`;
      } else {
        displayStock = `${unitsCount.toFixed(1).replace(/\.0$/, '')} u. (${stock.toLocaleString('es-CL')} ${unit})`;
      }
      html += `<option value="${item.id}">${item.name} (Stock: ${displayStock})</option>`;
    });
    
    dom.invAdjustSelect.innerHTML = html;
  }

  function openInventoryModal() {
    if (!dom.inventoryModal) return;
    renderInventorySelectOptions();
    if (dom.invAdjustSelect) dom.invAdjustSelect.value = '';
    if (dom.invAdjustType) dom.invAdjustType.value = 'set';
    if (dom.invAdjustQty) dom.invAdjustQty.value = '';
    if (dom.invAdjustCost) dom.invAdjustCost.value = '';
    if (dom.invAdjustComment) dom.invAdjustComment.value = '';
    if (dom.newSupplyNameGroup) dom.newSupplyNameGroup.style.display = 'none';
    if (dom.newSupplyName) dom.newSupplyName.value = '';
    if (dom.invCostGroup) dom.invCostGroup.style.display = 'block';
    
    dom.inventoryModal.style.display = 'flex';
    void dom.inventoryModal.offsetWidth;
    dom.inventoryModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeInventoryModal() {
    if (dom.inventoryModal) {
      dom.inventoryModal.classList.remove('active');
      setTimeout(() => {
        dom.inventoryModal.style.display = 'none';
        document.body.style.overflow = '';
      }, 300);
    }
  }

  function findClosestSupply(itemName) {
    if (!state.inventory || state.inventory.length === 0) return null;
    
    const clean = (s) => s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
      
    const itemWords = clean(itemName);
    if (itemWords.length === 0) return null;
    
    let bestMatch = null;
    let maxOverlap = 0;
    
    for (const supply of state.inventory) {
      const supplyWords = clean(supply.name);
      let overlap = 0;
      for (const w of itemWords) {
        if (supplyWords.includes(w)) overlap++;
      }
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestMatch = supply;
      }
    }
    
    if (maxOverlap >= 1) {
      return bestMatch;
    }
    return null;
  }

  async function saveSuppliesFromExpense(items, date) {
    if (!firebaseReady || !db || !state.firestoreModule) return;
    const { doc, getDoc, setDoc } = state.firestoreModule;

    for (const item of items) {
      const matchedSupply = findClosestSupply(item.name);
      const targetId = matchedSupply ? matchedSupply.id : item.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
        
      if (!targetId) continue;
      
      const docRef = doc(db, 'supplies_inventory', targetId);
      const docSnap = await getDoc(docRef);
      
      let currentStock = 0;
      let currentCost = 0;
      let capacity = 1;
      let unit = 'unidades';
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        currentStock = parseFloat(data.stock || 0);
        currentCost = parseFloat(data.cost || 0);
        capacity = parseFloat(data.capacity || 1) || 1;
        unit = data.unit || 'unidades';
      } else if (matchedSupply) {
        // Fallback to local matched state if document snapshot doesn't exist yet but matched in state
        currentStock = parseFloat(matchedSupply.stock || 0);
        currentCost = parseFloat(matchedSupply.cost || 0);
        capacity = parseFloat(matchedSupply.capacity || 1) || 1;
        unit = matchedSupply.unit || 'unidades';
      }
      
      const purchasedUnits = parseFloat(item.qty) || 0;
      const purchasedCost = parseFloat(item.price) || 0;
      const addedStock = purchasedUnits * capacity;
      const newStock = currentStock + addedStock;
      
      const currentUnits = currentStock / capacity;
      const newUnits = newStock / capacity;
      
      let newCost = purchasedCost;
      if (currentUnits > 0 && newUnits > 0) {
        newCost = (currentUnits * currentCost + purchasedUnits * purchasedCost) / newUnits;
      }
      
      const supplyData = {
        name: docSnap.exists() ? docSnap.data().name : (matchedSupply ? matchedSupply.name : item.name),
        stock: newStock,
        cost: Math.round(newCost),
        unit: unit,
        capacity: capacity,
        updatedAt: date
      };
      
      await setDoc(docRef, supplyData, { merge: true });
      
      const localItemIndex = state.inventory.findIndex(i => i.id === targetId);
      if (localItemIndex > -1) {
        state.inventory[localItemIndex] = { id: targetId, ...supplyData };
      } else {
        state.inventory.push({ id: targetId, ...supplyData });
      }
    }
    
    state.inventory.sort((a, b) => a.name.localeCompare(b.name));
    renderInventoryTable();
    renderInventorySelectOptions();
  }

  function saveDemoSuppliesFromExpense(items, date) {
    for (const item of items) {
      const matchedSupply = findClosestSupply(item.name);
      const targetId = matchedSupply ? matchedSupply.id : item.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
        
      if (!targetId) continue;
      
      const localItemIndex = state.inventory.findIndex(i => i.id === targetId);
      let currentStock = 0;
      let currentCost = 0;
      let capacity = 1;
      let unit = 'unidades';
      let name = matchedSupply ? matchedSupply.name : item.name;
      
      if (localItemIndex > -1) {
        const existing = state.inventory[localItemIndex];
        currentStock = parseFloat(existing.stock || 0);
        currentCost = parseFloat(existing.cost || 0);
        capacity = parseFloat(existing.capacity || 1) || 1;
        unit = existing.unit || 'unidades';
        name = existing.name;
      }
      
      const purchasedUnits = parseFloat(item.qty) || 0;
      const purchasedCost = parseFloat(item.price) || 0;
      const addedStock = purchasedUnits * capacity;
      const newStock = currentStock + addedStock;
      
      const currentUnits = currentStock / capacity;
      const newUnits = newStock / capacity;
      
      let newCost = purchasedCost;
      if (currentUnits > 0 && newUnits > 0) {
        newCost = (currentUnits * currentCost + purchasedUnits * purchasedCost) / newUnits;
      }
      
      const supplyData = {
        name,
        stock: newStock,
        cost: Math.round(newCost),
        unit: unit,
        capacity: capacity,
        updatedAt: date
      };
      
      if (localItemIndex > -1) {
        state.inventory[localItemIndex] = { id: targetId, ...supplyData };
      } else {
        state.inventory.push({ id: targetId, ...supplyData });
      }
    }
    
    state.inventory.sort((a, b) => a.name.localeCompare(b.name));
    renderInventoryTable();
    renderInventorySelectOptions();
  }

  async function saveInventoryAdjustment() {
    const supplyId = dom.invAdjustSelect.value;
    const adjustType = dom.invAdjustType.value;
    const qty = parseFloat(dom.invAdjustQty.value) || 0;
    const cost = parseInt(dom.invAdjustCost.value) || 0;
    const comment = dom.invAdjustComment.value.trim();
    const unit = dom.invAdjustUnit ? dom.invAdjustUnit.value : 'unidades';
    const capacity = parseFloat(dom.invAdjustCapacity ? dom.invAdjustCapacity.value : 1) || 1;
    
    if (!supplyId || qty <= 0 || !comment) {
      alert('Por favor completa todos los campos del ajuste.');
      return;
    }
    
    let targetId = supplyId;
    let name = '';
    
    if (supplyId === '__new__') {
      name = dom.newSupplyName.value.trim();
      if (!name) {
        alert('Por favor escribe el nombre del nuevo insumo.');
        return;
      }
      targetId = name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    } else {
      const existing = state.inventory.find(i => i.id === supplyId);
      if (existing) name = existing.name;
    }

    const todayStr = formatDateYMD(new Date());
    
    const existingIndex = state.inventory.findIndex(i => i.id === targetId);
    let currentStock = 0;
    let currentCost = cost;
    
    if (existingIndex > -1) {
      currentStock = parseFloat(state.inventory[existingIndex].stock || 0);
      if (cost <= 0) {
        currentCost = parseFloat(state.inventory[existingIndex].cost || 0);
      }
    }
    
    let newStock = currentStock;
    if (adjustType === 'set') {
      newStock = qty;
    } else if (adjustType === 'add') {
      newStock = currentStock + qty;
    } else if (adjustType === 'consume') {
      newStock = Math.max(0, currentStock - qty);
    }
    
    const supplyData = {
      name: name,
      stock: newStock,
      cost: currentCost,
      unit: unit,
      capacity: capacity,
      updatedAt: todayStr
    };

    const btn = dom.btnSaveInventoryAdjustment;
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      if (firebaseReady && db && state.firestoreModule) {
        const { doc, setDoc } = state.firestoreModule;
        await setDoc(doc(db, 'supplies_inventory', targetId), supplyData, { merge: true });
        
        const { collection, addDoc } = state.firestoreModule;
        await addDoc(collection(db, 'inventory_adjustments'), {
          supplyId: targetId,
          supplyName: name,
          type: adjustType,
          qty: qty,
          newStock: newStock,
          comment: comment,
          createdAt: new Date()
        });
      }

      if (existingIndex > -1) {
        state.inventory[existingIndex] = { id: targetId, ...supplyData };
      } else {
        state.inventory.push({ id: targetId, ...supplyData });
      }

      state.inventory.sort((a, b) => a.name.localeCompare(b.name));
      renderInventoryTable();
      renderInventorySelectOptions();
      
      closeInventoryModal();
      alert('Inventario actualizado correctamente.');
    } catch (err) {
      console.error('Error applying inventory adjustment:', err);
      alert('Error: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Aplicar Ajuste';
    }
  }

  // ============================================
  // DETAILED EXPENSE ITEMS FORM TABLE
  // ============================================
  function renderExpenseItemsTable() {
    if (!dom.expenseItemsTableBody) return;
    
    const rows = dom.expenseItemsTableBody.querySelectorAll('tr');
    if (rows.length === 0) {
      dom.expenseItemsTableBody.innerHTML = `
        <tr class="empty-items-row">
          <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 1rem;">
            Ningún insumo detallado. Agrégalos para sumarlos al inventario.
          </td>
        </tr>
      `;
    }
  }

  function addExpenseItemRow(name = '', qty = 1, price = '') {
    if (!dom.expenseItemsTableBody) return;
    
    const emptyRow = dom.expenseItemsTableBody.querySelector('.empty-items-row');
    if (emptyRow) emptyRow.remove();

    const rowId = 'row-' + Date.now() + '-' + Math.round(Math.random()*1000);
    const row = document.createElement('tr');
    row.id = rowId;
    row.className = 'expense-item-row';
    
    row.innerHTML = `
      <td>
        <input type="text" class="exp-item-name" value="${name}" placeholder="Ej: Gin Boolton 1L" style="width:100%; font-size:0.8rem; padding:4px;" required>
      </td>
      <td>
        <input type="number" class="exp-item-qty" value="${qty}" min="0.1" step="any" style="width:100%; font-size:0.8rem; padding:4px; text-align:center;" required>
      </td>
      <td>
        <input type="number" class="exp-item-price" value="${price}" min="0" placeholder="4590" style="width:100%; font-size:0.8rem; padding:4px;" required>
      </td>
      <td class="exp-item-total" style="font-weight:600; padding:6px 4px; font-size:0.8rem; text-align:right;">
        $${Math.round(qty * (price || 0)).toLocaleString('es-CL')}
      </td>
      <td style="text-align:center;">
        <button type="button" class="btn-delete-item-row" style="background:none; border:none; color:var(--error); cursor:pointer; font-size:1.15rem; padding:0; line-height:1;">×</button>
      </td>
    `;
    
    dom.expenseItemsTableBody.appendChild(row);

    const inputQty = row.querySelector('.exp-item-qty');
    const inputPrice = row.querySelector('.exp-item-price');
    const totalCell = row.querySelector('.exp-item-total');

    const updateRowTotal = () => {
      const q = parseFloat(inputQty.value) || 0;
      const p = parseInt(inputPrice.value) || 0;
      const tot = q * p;
      totalCell.textContent = `$${Math.round(tot).toLocaleString('es-CL')}`;
      updateExpenseTotalFromItems();
    };

    inputQty.addEventListener('input', updateRowTotal);
    inputPrice.addEventListener('input', updateRowTotal);

    row.querySelector('.btn-delete-item-row').addEventListener('click', () => {
      row.remove();
      renderExpenseItemsTable();
      updateExpenseTotalFromItems();
    });

    updateExpenseTotalFromItems();
  }

  function updateExpenseTotalFromItems() {
    if (!dom.expenseItemsTableBody || !dom.expAmount) return;
    
    const rows = dom.expenseItemsTableBody.querySelectorAll('.expense-item-row');
    if (rows.length === 0) return;
    
    let sum = 0;
    rows.forEach(row => {
      const q = parseFloat(row.querySelector('.exp-item-qty').value) || 0;
      const p = parseInt(row.querySelector('.exp-item-price').value) || 0;
      sum += q * p;
    });
    
    dom.expAmount.value = sum;
  }

  function getExpenseItemsList() {
    const items = [];
    if (!dom.expenseItemsTableBody) return items;
    
    const rows = dom.expenseItemsTableBody.querySelectorAll('.expense-item-row');
    rows.forEach(row => {
      const name = row.querySelector('.exp-item-name').value.trim();
      const qty = parseFloat(row.querySelector('.exp-item-qty').value) || 0;
      const price = parseInt(row.querySelector('.exp-item-price').value) || 0;
      
      if (name && qty > 0 && price > 0) {
        items.push({
          name: name,
          qty: qty,
          price: price
        });
      }
    });
    return items;
  }

  function parseOCRLineItems(text) {
    const items = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    console.log('[OCR Items] Raw lines:', lines);

    // --- 1. Find item zone (between header row and totals) ---
    const headerRe = /descripci[oó]n|detalle|precio\s*unit|cantidad|cant\b|product/i;
    const endRe = /afecto|net[oa]\b|iva\b|i\.?v\.?a|total\b|subtotal|exento/i;
    const skipRe = /total|subtotal|net[oa]\b|iva\b|i\.?v\.?a|exento|rut|r\.?u\.?t|giro|efectivo|tarjeta|d[eé]bito|cr[eé]dito|visa|redcompra|mastercard|vuelto|cambio|vendedor|hora\s+\d|afecto|timbre|emisi[oó]n|forma\s*de\s*pago|por\s*lo\s*siguiente/i;

    let zoneStart = 0;
    let zoneEnd = lines.length;
    for (let i = 0; i < lines.length; i++) {
      if (headerRe.test(lines[i])) zoneStart = i + 1;
    }
    for (let i = zoneStart; i < lines.length; i++) {
      if (endRe.test(lines[i])) { zoneEnd = i; break; }
    }
    console.log('[OCR Items] Zone:', zoneStart, '->', zoneEnd);

    // --- 2. Helpers (noise-tolerant) ---
    // Extract all numbers from a line (handles Chilean 4.590 / 13.770 format)
    // Also merges numbers split by spaces: OCR reads "5.940" as "5 940"
    function extractNums(line) {
      // Pre-merge: "5 940" → "5940", "10 320" → "10320", "13 770" → "13770"
      const merged = line.replace(/(\d{1,3})\s+(\d{3})(?!\d)/g, '$1$2');
      const matches = merged.match(/\d[\d.,]*\d|\d+/g) || [];
      return matches.map(m => parseInt(m.replace(/[.,]/g, '')) || 0).filter(n => n > 0);
    }

    // Does the line contain at least one number >= 100? (price signal)
    // This is tolerant of OCR noise – even "Ll e 4.590 13770" passes
    function hasPriceNumbers(line) {
      return extractNums(line).some(n => n >= 100);
    }

    // Does the line contain at least one word of 4+ letters? (product name signal)
    // Requires 4+ chars to filter out 1-2 letter OCR noise ("Ll", "e", "MN")
    function hasProductWords(line) {
      return /[A-Za-záéíóúñÁÉÍÓÚÑ]{4,}/.test(line);
    }

    // Clean a name line: aggressively strip OCR noise, keep product text
    function cleanName(line) {
      let c = line
        .replace(/[<>—–=\[\]{}°€£¿?!|\\*#@^~`"(),]+/g, ' ')  // remove symbol noise
        .replace(/[.$,;:]+/g, ' ')                               // remove punctuation noise
        .replace(/\s{2,}/g, ' ')
        .trim();
      // Remove isolated 1-2 letter lowercase fragments (OCR noise like "e", "ad", "Ll", "MN")
      // but keep uppercase abbreviations that could be real (CG, OZ, UN, ML, GR, KG, LD)
      const words = c.split(/\s+/);
      const kept = words.filter(w => {
        if (w.length >= 3) return true;                         // keep 3+ char words
        if (/^\d+$/.test(w)) return true;                       // keep standalone numbers (sizes)
        if (/^[A-ZÁÉÍÓÚÑ]{2}$/.test(w)) return true;           // keep 2-char uppercase (CG, OZ)
        if (/^[xX]$/.test(w)) return true;                      // keep "x" (multiplier)
        if (/^[xX]\d+$/.test(w)) return true;                   // keep "x6", "x10" (pack size)
        if (/^\d+[A-Za-z]+$/.test(w)) return true;              // keep "1L", "6L", "1Kg"
        return false;
      });
      return kept.join(' ').trim();
    }

    // --- 3. Noise-tolerant multi-line parsing ---
    // Strategy: lines with product words (4+ letter words) = name lines
    //           lines with big numbers (>= 100) = price lines
    //           Pair each name line with the next price line
    let pending = null; // { name: string, qty: number }

    for (let i = zoneStart; i < zoneEnd; i++) {
      const line = lines[i];
      if (skipRe.test(line)) continue;
      if (line.length < 2) continue;

      const hasWords = hasProductWords(line);
      const hasPrices = hasPriceNumbers(line);

      console.log('[OCR Items] L' + i + ': "' + line + '" words=' + hasWords + ' prices=' + hasPrices);

      // -- CASE A: Product name line (has words, no big prices) --
      if (hasWords && !hasPrices) {
        const cleaned = cleanName(line);
        // Try to find leading quantity digit
        const qtyMatch = cleaned.match(/^(\d{1,2})\s+([A-Za-záéíóúñÁÉÍÓÚÑ].*)/);
        if (qtyMatch && qtyMatch[2].length > 2) {
          const parsedQty = parseInt(qtyMatch[1]);
          pending = { name: qtyMatch[2].trim(), qty: parsedQty >= 1 ? parsedQty : 1 };
        } else {
          pending = { name: cleaned, qty: 1 };
        }
        console.log('[OCR Items]   -> Pending: "' + pending.name + '" qty=' + pending.qty);
        continue;
      }

      // -- CASE B: Price line (has big numbers) + we have a pending product name --
      if (hasPrices && pending) {
        const nums = extractNums(line);
        const bigNums = nums.filter(n => n >= 100);
        let unitPrice = 0;
        let qty = pending.qty;

        if (bigNums.length >= 2) {
          // The SMALLER number is always unit price, LARGER is line total
          const sorted = [...bigNums].sort((a, b) => a - b);
          unitPrice = sorted[0];           // smallest = unit price
          const lineTotal = sorted[sorted.length - 1]; // largest = line total
          
          // Infer quantity from total / unitPrice
          if (unitPrice > 0) {
            const inferredQty = Math.round(lineTotal / unitPrice);
            if (inferredQty >= 1 && inferredQty <= 999 &&
                Math.abs(lineTotal - unitPrice * inferredQty) < unitPrice * 0.15) {
              qty = inferredQty;
            }
          }
        } else if (bigNums.length === 1) {
          unitPrice = bigNums[0];
        }

        // Also check if there's an explicit small qty in the numbers
        if (nums.length >= 3) {
          const smallNums = nums.filter(n => n >= 1 && n < 100);
          if (smallNums.length > 0 && bigNums.length >= 2) {
            const sorted = [...bigNums].sort((a, b) => a - b);
            const sn = smallNums[0];
            const lineTotal = sorted[sorted.length - 1];
            if (Math.abs(lineTotal - sorted[0] * sn) < sorted[0] * 0.15) {
              qty = sn;
              unitPrice = sorted[0];
            }
          }
        }

        if (unitPrice > 0 && pending.name.length > 1) {
          items.push({ name: pending.name, qty: qty, price: unitPrice });
          console.log('[OCR Items]   -> MATCH: "' + pending.name + '" x' + qty + ' @ $' + unitPrice);
        }
        pending = null;
        continue;
      }

      // -- CASE C: Has BOTH words and prices on same line --
      if (hasWords && hasPrices) {
        const cleaned = cleanName(line);
        const nums = extractNums(line);
        const bigNums = nums.filter(n => n >= 100);
        // Separate text from numbers
        const namePart = cleaned.replace(/\d[\d.,]*\d|\d+/g, ' ').replace(/\s{2,}/g, ' ').trim();

        if (namePart.length > 2 && bigNums.length > 0) {
          const sorted = [...bigNums].sort((a, b) => a - b);
          let unitPrice = sorted[0];
          let qty = 1;
          if (sorted.length >= 2) {
            const lineTotal = sorted[sorted.length - 1];
            const inferredQty = Math.round(lineTotal / unitPrice);
            if (inferredQty >= 1 && inferredQty <= 999 &&
                Math.abs(lineTotal - unitPrice * inferredQty) < unitPrice * 0.15) {
              qty = inferredQty;
            }
          }
          items.push({ name: namePart, qty: qty, price: unitPrice });
          pending = null;
        } else if (pending) {
          // This might be a price line with some noise words
          if (bigNums.length >= 1) {
            const sorted = [...bigNums].sort((a, b) => a - b);
            let unitPrice = sorted[0];
            let qty = pending.qty;
            if (sorted.length >= 2) {
              const lineTotal = sorted[sorted.length - 1];
              const inferredQty = Math.round(lineTotal / unitPrice);
              if (inferredQty >= 1 && inferredQty <= 999 &&
                  Math.abs(lineTotal - unitPrice * inferredQty) < unitPrice * 0.15) {
                qty = inferredQty;
              }
            }
            items.push({ name: pending.name, qty: qty, price: unitPrice });
            pending = null;
          }
        } else {
          pending = { name: cleaned, qty: 1 };
        }
        continue;
      }

      // -- CASE D: Price line but no pending name (orphan) -> skip --
      if (hasPrices && !pending) continue;

      // -- All other lines: noise, skip --
    }

    // --- 4. Fallback: single-line patterns if nothing found ---
    if (items.length === 0) {
      console.log('[OCR Items] No multi-line items found, trying single-line fallback...');
      for (const line of lines) {
        if (skipRe.test(line)) continue;

        const mX = line.match(/^(\d+)\s*[xX*]\s*(.+?)\s+\$?\s*([\d][\d.,]*)\s*$/);
        if (mX) {
          const qty = parseInt(mX[1]);
          const name = mX[2].trim();
          const price = parseInt(mX[3].replace(/[.,]/g, '')) || 0;
          if (qty > 0 && name.length > 2 && price > 0) {
            items.push({ name, qty, price });
            continue;
          }
        }

        const mD = line.match(/^(.+?)\s+\$\s*([\d][\d.,]*)\s*$/);
        if (mD) {
          const name = mD[1].trim();
          const price = parseInt(mD[2].replace(/[.,]/g, '')) || 0;
          if (name.length > 2 && price > 50) {
            items.push({ name, qty: 1, price });
            continue;
          }
        }
      }
    }

    console.log('[OCR Items] Final extracted:', JSON.stringify(items));
    return items;
  }

  // ============================================
  // RECEIPT PHOTO MODAL CONTROLLER
  // ============================================
  function closeReceiptPhotoModal() {
    if (dom.receiptPhotoModal) dom.receiptPhotoModal.style.display = 'none';
  }

  // ============================================
  // RECIPES & INGREDIENT DEDUCTIONS CONTROLLERS
  // ============================================
  const RECIPE_TARGETS = [
    { id: 'tropiconce-sin-energetica', name: 'Tropiconce (Sin Energética)', baseId: 'tropiconce', option: 'Sin Energética' },
    { id: 'tropiconce-con-energetica', name: 'Tropiconce (Con Energética)', baseId: 'tropiconce', option: 'Con Energética' },
    { id: 'pink-fantasy-sin-energetica', name: 'Pink Fantasy (Sin Energética)', baseId: 'pink-fantasy', option: 'Sin Energética' },
    { id: 'pink-fantasy-con-energetica', name: 'Pink Fantasy (Con Energética)', baseId: 'pink-fantasy', option: 'Con Energética' },
    { id: 'promo-piscola', name: 'Promo Piscola Normal', baseId: 'promo-piscola', option: null },
    { id: 'promo-piscola-3l', name: 'Promo Piscola Agrandada (3L)', baseId: 'promo-piscola-3l', option: null },
    { id: 'promo-manzana', name: 'Promo Pisco Manzana', baseId: 'promo-manzana', option: null },
    { id: 'promo-manzana-3l', name: 'Promo Manzana Agrandada (3L)', baseId: 'promo-manzana-3l', option: null },
    { id: 'pack-escudo-silver', name: 'Six Pack Escudo Silver', baseId: 'pack-escudo-silver', option: null },
    { id: 'pack-escudo', name: 'Six Pack Escudo', baseId: 'pack-escudo', option: null },
    { id: 'pack-cristal', name: 'Six Pack Cristal', baseId: 'pack-cristal', option: null },
    { id: 'pack-royal', name: 'Six Pack Royal Guard', baseId: 'pack-royal', option: null },
    { id: 'pack-heineken', name: 'Six Pack Heineken', baseId: 'pack-heineken', option: null }
  ];

  function renderRecipesList() {
    if (!dom.recipesGridList) return;
    
    dom.recipesGridList.innerHTML = '';
    
    RECIPE_TARGETS.forEach(target => {
      const prod = PRODUCTS[target.baseId];
      if (!prod) return;
      
      const recipe = state.recipes.find(r => r.id === target.id);
      let ingredientsHtml = '<p style="color:var(--text-muted); font-size:0.8rem; margin:0.25rem 0;">Sin ingredientes configurados.</p>';
      
      if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
        ingredientsHtml = '<ul style="margin: 0.5rem 0; padding-left: 1.2rem; font-size: 0.8rem; line-height:1.5;">';
        recipe.ingredients.forEach(ing => {
          const supply = state.inventory.find(i => i.id === ing.supplyId);
          const supplyName = supply ? supply.name : ing.supplyId;
          const supplyUnit = supply ? (supply.unit || 'unidades') : 'u';
          ingredientsHtml += `<li><strong>${ing.qty} ${supplyUnit}</strong> de ${supplyName}</li>`;
        });
        ingredientsHtml += '</ul>';
      }
      
      const card = document.createElement('div');
      card.className = 'accounting-card';
      card.style.margin = '0';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.justifyContent = 'space-between';
      card.style.gap = '1rem';
      
      card.innerHTML = `
        <div>
          <div style="display: flex; align-items: center; gap: 0.8rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.8rem;">
            <img src="${prod.image}" alt="${prod.name}" style="width: 45px; height: 45px; object-fit: contain; background: rgba(255,255,255,0.05); border-radius: 6px;">
            <div>
              <h4 style="margin: 0; font-size: 0.95rem; color: var(--gold);">${target.name}</h4>
              <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary);">${prod.description || ''}</p>
            </div>
          </div>
          <div style="margin-top: 0.8rem;">
            <h5 style="margin: 0; font-size: 0.8rem; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px;">Receta / Ingredientes:</h5>
            ${ingredientsHtml}
          </div>
        </div>
        <button class="btn btn-action primary btn-edit-recipe" data-id="${target.id}" style="font-size: 0.8rem; padding: 0.5rem; width: 100%;">
          📝 Configurar Receta
        </button>
      `;
      
      card.querySelector('.btn-edit-recipe').addEventListener('click', () => {
        openRecipeModal(target.id);
      });
      
      dom.recipesGridList.appendChild(card);
    });
  }

  function openRecipeModal(productId) {
    if (!dom.recipeModal) return;
    
    state.selectedRecipeProductId = productId;
    const target = RECIPE_TARGETS.find(t => t.id === productId);
    if (dom.recipeModalTitle) {
      dom.recipeModalTitle.textContent = `Configurar Receta: ${target ? target.name : productId}`;
    }
    
    if (dom.recipeIngredientsTableBody) {
      dom.recipeIngredientsTableBody.innerHTML = '';
    }
    
    const recipe = state.recipes.find(r => r.id === productId);
    if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
      recipe.ingredients.forEach(ing => {
        addRecipeIngredientRow(ing.supplyId, ing.qty);
      });
    } else {
      addRecipeIngredientRow();
    }
    
    dom.recipeModal.style.display = 'flex';
    void dom.recipeModal.offsetWidth;
    dom.recipeModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeRecipeModal() {
    if (dom.recipeModal) {
      dom.recipeModal.classList.remove('active');
      setTimeout(() => {
        dom.recipeModal.style.display = 'none';
        document.body.style.overflow = '';
        state.selectedRecipeProductId = null;
      }, 300);
    }
  }

  function addRecipeIngredientRow(supplyId = '', qty = '') {
    if (!dom.recipeIngredientsTableBody) return;
    
    const rowId = 'rec-row-' + Date.now() + '-' + Math.round(Math.random()*1000);
    const row = document.createElement('tr');
    row.id = rowId;
    row.className = 'recipe-ingredient-row';
    
    let selectOptions = '<option value="">-- Seleccionar Insumo --</option>';
    state.inventory.forEach(item => {
      selectOptions += `<option value="${item.id}" ${item.id === supplyId ? 'selected' : ''}>${item.name}</option>`;
    });
    
    let unitLabel = 'u.';
    if (supplyId) {
      const supply = state.inventory.find(i => i.id === supplyId);
      if (supply) unitLabel = supply.unit || 'unidades';
    }
    
    row.innerHTML = `
      <td>
        <select class="rec-ing-select" style="width:100%; font-size:0.8rem; padding:4px;" required>
          ${selectOptions}
        </select>
      </td>
      <td>
        <input type="number" class="rec-ing-qty" value="${qty}" min="0.001" step="any" placeholder="Ej: 200" style="width:100%; font-size:0.8rem; padding:4px; text-align:center;" required>
      </td>
      <td>
        <span class="rec-ing-unit" style="font-size:0.8rem; color:var(--text-secondary); font-weight:600; padding: 0 4px;">${unitLabel}</span>
      </td>
      <td style="text-align:center;">
        <button type="button" class="btn-delete-rec-row" style="background:none; border:none; color:var(--error); cursor:pointer; font-size:1.15rem; padding:0; line-height:1;">×</button>
      </td>
    `;
    
    dom.recipeIngredientsTableBody.appendChild(row);
    
    const select = row.querySelector('.rec-ing-select');
    const unitSpan = row.querySelector('.rec-ing-unit');
    
    select.addEventListener('change', (e) => {
      const val = e.target.value;
      const supply = state.inventory.find(i => i.id === val);
      unitSpan.textContent = supply ? (supply.unit || 'unidades') : 'u.';
    });
    
    row.querySelector('.btn-delete-rec-row').addEventListener('click', () => {
      row.remove();
      if (dom.recipeIngredientsTableBody.querySelectorAll('.recipe-ingredient-row').length === 0) {
        addRecipeIngredientRow();
      }
    });
  }

  async function saveRecipe() {
    if (!state.selectedRecipeProductId) return;
    
    const rows = dom.recipeIngredientsTableBody.querySelectorAll('.recipe-ingredient-row');
    const ingredients = [];
    
    let hasError = false;
    rows.forEach(row => {
      const supplyId = row.querySelector('.rec-ing-select').value;
      const qty = parseFloat(row.querySelector('.rec-ing-qty').value) || 0;
      
      if (supplyId) {
        if (qty <= 0) {
          hasError = true;
        } else {
          ingredients.push({
            supplyId: supplyId,
            qty: qty
          });
        }
      }
    });
    
    if (hasError) {
      alert('Por favor ingresa cantidades válidas (mayores a cero) para todos los ingredientes seleccionados.');
      return;
    }
    
    const productId = state.selectedRecipeProductId;
    
    const btn = dom.btnRecipeSave;
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    
    const recipeData = {
      ingredients: ingredients,
      updatedAt: new Date()
    };
    
    try {
      if (firebaseReady && db && state.firestoreModule) {
        const { doc, setDoc } = state.firestoreModule;
        await setDoc(doc(db, 'recipes', productId), recipeData, { merge: true });
      }
      
      const existingIndex = state.recipes.findIndex(r => r.id === productId);
      if (existingIndex > -1) {
        state.recipes[existingIndex] = { id: productId, ...recipeData };
      } else {
        state.recipes.push({ id: productId, ...recipeData });
      }
      
      renderRecipesList();
      closeRecipeModal();
      alert('Receta guardada con éxito.');
    } catch (err) {
      console.error('Error saving recipe:', err);
      alert('Error al guardar la receta. Intenta nuevamente.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar Receta';
    }
  }

  async function deductIngredientsForOrder(order) {
    if (!firebaseReady || !db || !state.firestoreModule) return;
    const { doc, setDoc } = state.firestoreModule;
    
    if (!order.items || !Array.isArray(order.items)) return;
    
    for (const item of order.items) {
      const itemId = item.id;
      const quantity = parseInt(item.quantity) || 1;
      
      const recipe = state.recipes.find(r => r.id === itemId);
      if (!recipe || !recipe.ingredients) continue;
      
      for (const ing of recipe.ingredients) {
        const supplyId = ing.supplyId;
        const useQty = parseFloat(ing.qty) * quantity;
        
        const supplyIndex = state.inventory.findIndex(i => i.id === supplyId);
        if (supplyIndex > -1) {
          const supply = state.inventory[supplyIndex];
          const newStock = Math.max(0, parseFloat(supply.stock || 0) - useQty);
          
          supply.stock = newStock;
          supply.updatedAt = formatDateYMD(new Date());
          
          const supplyRef = doc(db, 'supplies_inventory', supplyId);
          await setDoc(supplyRef, { stock: newStock, updatedAt: supply.updatedAt }, { merge: true });
        }
      }
    }
    
    renderInventoryTable();
    runAiAccountantAudit();
  }

  function deductDemoIngredientsForOrder(order) {
    if (!order.items || !Array.isArray(order.items)) return;
    
    for (const item of order.items) {
      const itemId = item.id;
      const quantity = parseInt(item.quantity) || 1;
      
      const recipe = state.recipes.find(r => r.id === itemId);
      if (!recipe || !recipe.ingredients) continue;
      
      for (const ing of recipe.ingredients) {
        const supplyId = ing.supplyId;
        const useQty = parseFloat(ing.qty) * quantity;
        
        const supplyIndex = state.inventory.findIndex(i => i.id === supplyId);
        if (supplyIndex > -1) {
          const supply = state.inventory[supplyIndex];
          supply.stock = Math.max(0, parseFloat(supply.stock || 0) - useQty);
          supply.updatedAt = formatDateYMD(new Date());
        }
      }
    }
    
    renderInventoryTable();
    runAiAccountantAudit();
  }

})();
