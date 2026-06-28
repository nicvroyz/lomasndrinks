// ============================================
// LOMAS & DRINKS — Main Application Logic
// E-commerce Cart, Checkout, Delivery Zones,
// Order Tracking & Real-time Firebase Sync
// ============================================

(function() {
  'use strict';

  // ─── CONFIGURACIÓN DE TIENDA ───
  const CONFIG = {
    // Modo Trasnoche (Late Night Mode):
    // - true: Forzado siempre encendido (para pruebas)
    // - false: Desactivado por completo (deja solo catálogo de Previa/Fiesta de día)
    // - 'auto': Activación automática basada en horario de Chile (01:00 AM a 02:59 AM)
    LATE_NIGHT_MODE: false
  };

  // ─── ORIGIN POINT (private - never shown to users) ───
  const ORIGIN_LAT = -36.79213;
  const ORIGIN_LNG = -73.05781;

  // ─── DELIVERY ZONES ───
  // 0-5km: Free | 5.01-8km: $1,500 (free ≥2 units) | 8.01-15km: $3,000 (free ≥3 units) | >15km: No delivery
  const DELIVERY_ZONES = [
    { maxKm: 5,  fee: 0,    freeMinUnits: 1, label: '¡Envío gratis!', color: '#2ecc71' },
    { maxKm: 8,  fee: 1500, freeMinUnits: 2, label: 'Envío $1.500', freeLabel: '¡Gratis con +2 unidades!', color: '#f39c12' },
    { maxKm: 15, fee: 3000, freeMinUnits: 3, label: 'Envío $3.000', freeLabel: '¡Gratis con +3 unidades!', color: '#e67e22' }
  ];

  // ─── PRODUCT DATA ───
  const PRODUCTS = {
    'tropiconce': { id: 'tropiconce', name: 'Tropiconce (1 Litro)', price: 9990, image: 'assets/images/tropiconce.png', description: 'Cocktail tropical de 1 Litro con mango, maracuyá y toque cítrico' },
    'pink-fantasy': { id: 'pink-fantasy', name: 'Pink Fantasy (1 Litro)', price: 9990, image: 'assets/images/pink_fantasy.png', description: 'Cocktail rosado de 1 Litro con fresa, frambuesa y toque floral' },
    'promo-piscola': { id: 'promo-piscola', name: 'Promo Piscola Normal', price: 20000, image: 'assets/images/piscola.png', description: 'Pisco 1L + Bebida 1.5L + Hielo 1kg' },
    'promo-piscola-3l': { id: 'promo-piscola-3l', name: 'Promo Piscola Agrandada', price: 22000, image: 'assets/images/piscola.png', description: 'Pisco 1L + Bebida 3L + Hielo 1kg' },
    'promo-manzana': { id: 'promo-manzana', name: 'Promo Pisco Manzana', price: 27000, image: 'assets/images/manzana.png', description: 'Pisco Manzana 1L + Bebida 1.5L + Hielo 1kg' },
    'promo-manzana-3l': { id: 'promo-manzana-3l', name: 'Promo Manzana Agrandada', price: 29000, image: 'assets/images/manzana.png', description: 'Pisco Manzana 1L + Bebida 3L + Hielo 1kg' },
    'pack-escudo-silver': { id: 'pack-escudo-silver', name: 'Six Pack Escudo Silver', price: 7000, image: 'assets/images/escudo_silver.png', description: 'Six Pack Cerveza Escudo Silver' },
    'pack-escudo': { id: 'pack-escudo', name: 'Six Pack Escudo', price: 9000, image: 'assets/images/escudo.png', description: 'Six Pack Cerveza Escudo Normal' },
    'pack-cristal': { id: 'pack-cristal', name: 'Six Pack Cristal', price: 9000, image: 'assets/images/cristal.png', description: 'Six Pack Cerveza Cristal' },
    'pack-royal': { id: 'pack-royal', name: 'Six Pack Royal Guard', price: 10500, image: 'assets/images/royal.png', description: 'Six Pack Cerveza Royal Guard' },
    'pack-heineken': { id: 'pack-heineken', name: 'Six Pack Heineken', price: 10500, image: 'assets/images/heineken.png', description: 'Six Pack Cerveza Heineken' }
  };

  // ─── STATUS FLOW (shared with admin) ───
  const STATUS_ORDER = ['new', 'confirmed', 'preparing', 'delivering', 'delivered'];
  const STATUS_LABELS = {
    'new': 'Pedido Recibido',
    'confirmed': 'Confirmado',
    'preparing': 'Preparando',
    'delivering': 'En Camino',
    'delivered': 'Entregado',
    'cancelled': 'Cancelado'
  };

  // ─── STATE ───
  let cart = [];
  let deliveryFee = 0;
  let deliveryDistance = null;
  let deliveryZone = null;
  let userCoords = null;
  let currentTrackingOrderId = null;
  let currentTrackingOrderNumber = null;
  let trackingUnsubscribe = null;
  const CART_KEY = 'lomasdrinks_cart';
  const ORDERS_KEY = 'lomasdrinks_orders';
  const TRACKING_KEY = 'lomasdrinks_tracking';
  let realRecentOrders = [];

  // ─── DOM HELPERS ───
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ─── CACHED DOM ELEMENTS ───
  let cartOverlay, cartSidebar, cartItems, cartFooter, cartBadge;
  let cartSubtotal, cartTotal, checkoutOverlay, checkoutSummary;
  let transferInfo, orderConfirmation, checkoutForm;
  let trackingOverlay, trackOrderToggle;

  // ─── INITIALIZATION ───
  function init() {
    checkStoreHours();
    initLateNightMode();
    cacheDom();
    loadCart();
    bindEvents();
    initScrollAnimations();
    initNavbar();
    initFirebaseConnection();
    restoreTracking();
    initUrgencyEffects();
    initCarousel();
    initLaunchCountdown();
    checkPaymentReturn();
  }

  //  HERO CAROUSEL 
  function initCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    const slides = Array.from(track.children);
    const nextBtn = document.getElementById('carouselNext');
    const prevBtn = document.getElementById('carouselPrev');
    const nav = document.getElementById('carouselNav');
    const dots = Array.from(nav.children);
    
    let currentIndex = 0;
    let autoPlayInterval;

    function moveToSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      track.style.transform = `translateX(-${index * 100}%)`;
      
      slides.forEach(s => s.classList.remove('current-slide'));
      dots.forEach(d => d.classList.remove('current-slide'));
      
      slides[index].classList.add('current-slide');
      dots[index].classList.add('current-slide');
      currentIndex = index;
    }

    function nextSlide() { moveToSlide(currentIndex + 1); }
    function prevSlide() { moveToSlide(currentIndex - 1); }

    function startAutoPlay() {
      autoPlayInterval = setInterval(nextSlide, 5000);
    }

    function resetAutoPlay() {
      clearInterval(autoPlayInterval);
      startAutoPlay();
    }

    nextBtn.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
    prevBtn.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        moveToSlide(index);
        resetAutoPlay();
      });
    });

    startAutoPlay();
  }

  // 🍹 LATE NIGHT MODE 🍹
  function initLateNightMode() {
    // Get the current hour in Chile (America/Santiago) timezone (0-23)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Santiago',
      hour: 'numeric',
      hourCycle: 'h23'
    });
    
    const chileHour = parseInt(formatter.format(new Date()), 10);
    
    // Evaluate based on config setting
    let isLateNight = false;
    if (CONFIG.LATE_NIGHT_MODE === true) {
      isLateNight = true;
    } else if (CONFIG.LATE_NIGHT_MODE === 'auto') {
      isLateNight = chileHour >= 1 && chileHour < 3;
    }
    
    if (isLateNight) {
      document.body.classList.add('late-night-mode');
    } else {
      document.body.classList.remove('late-night-mode');
    }
  }

  // 🕒 STORE HOURS (SCHEDULED ORDERS) 🕒
  let isStoreClosed = false;

  function checkStoreHours() {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Santiago',
      hour: 'numeric',
      hourCycle: 'h23'
    });
    const chileHour = parseInt(formatter.format(new Date()), 10);
    
    // Store is closed from 02:00 to 20:59 (2 to 20 inclusive) in Chile Time
    isStoreClosed = chileHour >= 2 && chileHour < 21;
    
    // UI Elements
    const banner = document.getElementById('storeStatusBanner');
    const promoBanner = document.getElementById('promoBanner');
    const scheduledGroup = document.getElementById('scheduledTimeGroup');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    if (isStoreClosed) {
      if (promoBanner) promoBanner.style.display = 'none';
      if (banner) {
        banner.style.display = 'block';
        // Dynamic exciting message
        const statusText = document.getElementById('storeStatusText');
        if (statusText) {
          const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          const nowCL = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
          const diaHoy = dias[nowCL.getDay()];
          const diaN = nowCL.getDate();
          statusText.innerHTML = `🔥 <strong>HOY ${diaHoy.toUpperCase()} ${diaN}</strong> — Abrimos a las 21:00 y atendemos hasta las 2:00 AM 🍸 ¡Programa tu pedido ahora!`;
        }
      }
      if (scheduledGroup) scheduledGroup.style.display = 'block';
      if (placeOrderBtn) placeOrderBtn.innerHTML = '📅 PROGRAMAR PEDIDO';
    } else {
      if (banner) banner.style.display = 'none';
      if (promoBanner) promoBanner.style.display = 'block';
      if (scheduledGroup) scheduledGroup.style.display = 'none';
      if (placeOrderBtn) placeOrderBtn.innerHTML = '🛒 CONFIRMAR PEDIDO';
    }
  }

  // 🕒 LOAD BOOKED TIME SLOTS FROM FIRESTORE 🕒
  async function loadTimeSlots() {
    const grid = document.getElementById('timeSlotsGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading-slots">Cargando horarios disponibles...</div>';
    
    const TIME_SLOTS = ['21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00', '00:30', '01:00', '01:30', '02:00'];
    const maxOrdersPerSlot = 1;
    const takenSlots = {};
    
    TIME_SLOTS.forEach(slot => takenSlots[slot] = 0);
    
    if (firebaseReady && db) {
      try {
        const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        
        // Calculate start of current Santiago booking period (03:00 AM) timezone-independently
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Santiago',
          year: 'numeric', month: 'numeric', day: 'numeric',
          hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
        });
        const parts = formatter.formatToParts(new Date());
        const partValues = {};
        parts.forEach(p => partValues[p.type] = p.value);
        
        const chileDate = new Date(
          parseInt(partValues.year),
          parseInt(partValues.month) - 1,
          parseInt(partValues.day),
          parseInt(partValues.hour),
          parseInt(partValues.minute),
          parseInt(partValues.second)
        );
        
        const startChile = new Date(chileDate);
        startChile.setHours(3, 0, 0, 0);
        if (chileDate < startChile) {
          startChile.setDate(startChile.getDate() - 1);
        }
        const timeDifference = startChile.getTime() - chileDate.getTime();
        const santiagoStartInstant = new Date(new Date().getTime() + timeDifference);
        
        const q = query(
          collection(db, 'orders'),
          where('createdAt', '>=', santiagoStartInstant)
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.isScheduled && data.scheduledTime) {
            const time = data.scheduledTime;
            if (takenSlots[time] !== undefined) {
              takenSlots[time]++;
            }
          }
        });
      } catch (err) {
        console.error('Error fetching taken time slots:', err);
      }
    }
    
    grid.innerHTML = '';
    
    const hiddenInput = document.getElementById('scheduledTime');
    if (hiddenInput) hiddenInput.value = '';
    
    TIME_SLOTS.forEach(slot => {
      // Si la hora ya fue reservada por otra persona, desaparece de la grilla
      if (takenSlots[slot] >= maxOrdersPerSlot) {
        return;
      }
      
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'time-slot-btn';
      btn.dataset.time = slot;
      
      btn.textContent = slot + ' hrs';
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (hiddenInput) hiddenInput.value = slot;
      });
      grid.appendChild(btn);
    });

    if (grid.children.length === 0) {
      grid.innerHTML = '<div class="no-slots-alert" style="grid-column: 1/-1; text-align: center; color: var(--error); padding: 1.5rem; border: 1px dashed var(--error); border-radius: 8px; font-size: 0.95rem;">⚠️ Todos los horarios de entrega de hoy están reservados. Contáctanos por WhatsApp para coordinar.</div>';
    }
  }

  function cacheDom() {
    cartOverlay = $('#cartOverlay');
    cartSidebar = $('#cartSidebar');
    cartItems = $('#cartItems');
    cartFooter = $('#cartFooter');
    cartBadge = $('#cartBadge');
    cartSubtotal = $('#cartSubtotal');
    cartTotal = $('#cartTotal');
    checkoutOverlay = $('#checkoutOverlay');
    checkoutSummary = $('#checkoutSummary');
    transferInfo = $('#transferInfo');
    orderConfirmation = $('#orderConfirmation');
    checkoutForm = $('#checkoutForm');
    trackingOverlay = $('#trackingOverlay');
    trackOrderToggle = $('#trackOrderToggle');
  }

  // ─── FIREBASE CONNECTION ───
  async function initFirebaseConnection() {
    if (typeof initFirebase === 'function') {
      await initFirebase();
      if (firebaseReady && db) {
        try {
          const { collection, query, orderBy, limit, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
          const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
          onSnapshot(q, (snapshot) => {
            realRecentOrders = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              if (data.customerName && data.items && data.items.length > 0) {
                realRecentOrders.push({
                  name: data.customerName.split(' ')[0],
                  area: 'Concepción y alrededores',
                  product: data.items[0].name + ' 🍸',
                  timestamp: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date()
                });
              }
            });
          });
        } catch (e) {
          console.warn('Real-time social proof error:', e);
        }
      }
    }
  }

  // ─── RESTORE TRACKING ───
  function restoreTracking() {
    try {
      const saved = localStorage.getItem(TRACKING_KEY);
      if (saved) {
        const { docId, orderNumber } = JSON.parse(saved);
        if (docId && orderNumber) {
          currentTrackingOrderId = docId;
          currentTrackingOrderNumber = orderNumber;
          if (trackOrderToggle) trackOrderToggle.style.display = 'flex';
          startTrackingListener(docId);
        }
      }
    } catch (e) {
      console.warn('Could not restore tracking:', e);
    }
  }

  // ─── URGENCY & SOCIAL PROOF ───
  function initUrgencyEffects() {
    // Simulated "viewers" counter
    const viewerEls = $$('.viewer-count');
    viewerEls.forEach(el => {
      let count = Math.floor(Math.random() * 12) + 8;
      el.textContent = count;
      setInterval(() => {
        count += Math.floor(Math.random() * 3) - 1;
        count = Math.max(5, Math.min(25, count));
        el.textContent = count;
      }, 5000 + Math.random() * 5000);
    });

    // Sticky CTA bar appears after scrolling past products
    const stickyBar = $('#stickyBar');
    if (stickyBar) {
      const productsSection = $('#productos');
      window.addEventListener('scroll', () => {
        if (!productsSection) return;
        const rect = productsSection.getBoundingClientRect();
        if (rect.bottom < 0) {
          stickyBar.classList.add('visible');
        } else {
          stickyBar.classList.remove('visible');
        }
      }, { passive: true });
    }

    // Floating notification pops
    startSocialProofNotifications();
  }

  function startSocialProofNotifications() {
    const names = ['Camila', 'Sebastián', 'Javiera', 'Matías', 'Valentina', 'Felipe', 'Catalina', 'Diego', 'Fernanda', 'Nicolás', 'Ignacio', 'Daniela', 'Sofía', 'Joaquín', 'Martina', 'Benjamín', 'Isidora', 'Vicente', 'Constanza', 'Tomás', 'Valeria', 'Cristóbal', 'Macarena'];
    let products = ['Tropiconce (1L) 🍹', 'Pink Fantasy (1L) 🌸'];
    
    if (document.body.classList.contains('late-night-mode')) {
      products = ['Promo Piscola Normal 🧊', 'Promo Pisco Manzana 🍏', 'Six Pack Escudo 🍻', 'Six Pack Cristal 🍻', 'Six Pack Royal Guard 🍻', 'Promo Piscola Agrandada 🧊'];
    }
    const areas = ['Centro', 'Barrio Universitario', 'Pedro de Valdivia', 'Lomas de San Andrés', 'Collao', 'Paicaví', 'Hualpén', 'Talcahuano', 'Santa Sabina', 'Nonguén', 'San Pedro de la Paz', 'Huertos Familiares', 'Spring Hill', 'Laguna Grande', 'Valle Escondido', 'Lorenzo Arenas'];

    let shown = false;
    setTimeout(() => {
      if (shown) return;
      showSocialProof(names, products, areas);
      shown = true;
    }, 8000);

    setInterval(() => {
      if (Math.random() > 0.4) {
        showSocialProof(names, products, areas);
      }
    }, 25000 + Math.random() * 15000);
  }

  function showSocialProof(names, products, areas) {
    const existing = document.querySelector('.social-proof-pop');
    if (existing) existing.remove();

    let name, product, area, mins;

    if (realRecentOrders.length > 0 && Math.random() < 0.4) {
      const realOrder = realRecentOrders[Math.floor(Math.random() * realRecentOrders.length)];
      name = realOrder.name;
      product = realOrder.product;
      area = realOrder.area;
      const diffMs = new Date() - realOrder.timestamp;
      mins = Math.max(1, Math.floor(diffMs / 60000));
      if (mins > 59) mins = Math.floor(Math.random() * 15) + 2;
    } else {
      name = names[Math.floor(Math.random() * names.length)];
      let baseProduct = products[Math.floor(Math.random() * products.length)];
      area = areas[Math.floor(Math.random() * areas.length)];
      mins = Math.floor(Math.random() * 15) + 2;
      
      let qty = 1;
      if (baseProduct.toLowerCase().includes('six pack')) {
        qty = Math.floor(Math.random() * 3) + 1; // 1, 2, 3
      } else if (baseProduct.toLowerCase().includes('promo')) {
        qty = Math.floor(Math.random() * 2) + 1; // 1, 2
      } else {
        qty = Math.floor(Math.random() * 2) + 1; // 1, 2 for cocktails
      }
      
      if (qty > 1) {
        product = `${qty}x ${baseProduct}`;
      } else {
        product = baseProduct;
      }
    }

    const pop = document.createElement('div');
    pop.className = 'social-proof-pop';
    pop.innerHTML = `
      <div class="social-proof-content">
        <span class="social-proof-avatar">🛍️</span>
        <div>
          <strong>${name}</strong> de ${area}<br>
          <span style="color:var(--gold);font-size:0.85rem;">compró ${product}</span><br>
          <span style="font-size:0.75rem;color:var(--text-muted);">hace ${mins} min</span>
        </div>
      </div>
    `;
    document.body.appendChild(pop);

    setTimeout(() => {
      pop.classList.add('hide');
      setTimeout(() => pop.remove(), 500);
    }, 5000);
  }

  // ─── EVENT BINDINGS ───
  function bindEvents() {
    // Cart toggle
    $('#cartToggle').addEventListener('click', openCart);
    $('#cartClose').addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    // Checkout
    $('#checkoutBtn').addEventListener('click', openCheckout);
    $('#checkoutClose').addEventListener('click', closeCheckout);
    checkoutOverlay.addEventListener('click', (e) => {
      if (e.target === checkoutOverlay) closeCheckout();
    });

    // Upsell Checkboxes
    const upsellCheckboxes = document.querySelectorAll('.upsell-checkbox');
    upsellCheckboxes.forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const card = e.target.closest('.product-card');
        const baseId = e.target.dataset.target; // 'promo-piscola'
        const btn = card.querySelector('.btn-add-cart');
        const priceDisplay = card.querySelector('.product-price');
        
        if (e.target.checked) {
          const newId = baseId + '-3l';
          btn.dataset.product = newId;
          btn.dataset.name = PRODUCTS[newId].name;
          btn.dataset.price = PRODUCTS[newId].price;
          priceDisplay.innerHTML = `<span class="currency">$</span>${formatCurrency(PRODUCTS[newId].price).replace('$', '')}`;
        } else {
          btn.dataset.product = baseId;
          btn.dataset.name = PRODUCTS[baseId].name;
          btn.dataset.price = PRODUCTS[baseId].price;
          priceDisplay.innerHTML = `<span class="currency">$</span>${formatCurrency(PRODUCTS[baseId].price).replace('$', '')}`;
        }
      });
    });

    // Beer Selector
    const beerSelector = document.getElementById('beer-selector');
    if (beerSelector) {
      beerSelector.addEventListener('change', (e) => {
        const option = e.target.options[e.target.selectedIndex];
        const card = e.target.closest('.product-card');
        const btn = card.querySelector('.btn-add-cart');
        const priceDisplay = card.querySelector('.product-price');
        const img = card.querySelector('#beer-image');
        
        btn.dataset.product = option.value;
        btn.dataset.name = option.dataset.name;
        btn.dataset.price = option.dataset.price;
        btn.dataset.image = option.dataset.image;
        if (img && option.dataset.image) {
          img.src = option.dataset.image;
          if (option.dataset.image.endsWith('.jpg')) {
            img.style.mixBlendMode = 'multiply';
            img.style.filter = 'contrast(1.1) brightness(0.9)';
          } else {
            img.style.mixBlendMode = 'normal';
            img.style.filter = 'none';
          }
        }
        priceDisplay.innerHTML = `<span class="currency">$</span>${formatCurrency(parseInt(option.dataset.price)).replace('$', '')}`;
      });
    }

    // Add to cart buttons
    $$('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', handleAddToCart);
    });

    // Quantity selectors
    $$('.qty-btn').forEach(btn => {
      btn.addEventListener('click', handleQuantityChange);
    });

    // Payment method toggle
    $$('input[name="paymentMethod"]').forEach(radio => {
      radio.addEventListener('change', handlePaymentChange);
    });

    // Place order
    $('#placeOrderBtn').addEventListener('click', handlePlaceOrder);

    // Mobile menu
    $('#mobileToggle').addEventListener('click', toggleMobileMenu);

    // Smooth scroll for anchor links
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', handleSmoothScroll);
    });

    // Tracking modal
    if (trackOrderToggle) {
      trackOrderToggle.addEventListener('click', openTracking);
    }
    const trackingClose = $('#trackingClose');
    if (trackingClose) trackingClose.addEventListener('click', closeTracking);
    if (trackingOverlay) {
      trackingOverlay.addEventListener('click', (e) => {
        if (e.target === trackingOverlay) closeTracking();
      });
    }

    // View tracking from confirmation
    const viewTrackingBtn = $('#viewTrackingBtn');
    if (viewTrackingBtn) {
      viewTrackingBtn.addEventListener('click', () => {
        closeCheckout();
        setTimeout(openTracking, 300);
      });
    }

    // Geolocation button
    const geoBtn = $('#geolocateBtn');
    if (geoBtn) {
      geoBtn.addEventListener('click', requestGeolocation);
    }

    // Sticky bar CTA
    const stickyBarBtn = $('#stickyBarBtn');
    if (stickyBarBtn) {
      stickyBarBtn.addEventListener('click', () => {
        document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Escape key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCart();
        closeCheckout();
        closeTracking();
      }
    });
  }

  // ═══════════════════════════════════════
  // GEOLOCATION & DELIVERY CALCULATION
  // ═══════════════════════════════════════

  function requestGeolocation() {
    const geoBtn = $('#geolocateBtn');
    const geoStatus = $('#geoStatus');
    const deliveryResult = $('#deliveryResult');

    if (!navigator.geolocation) {
      geoStatus.innerHTML = '<span style="color:var(--error);">Tu navegador no soporta geolocalización. Contáctanos por WhatsApp.</span>';
      return;
    }

    geoBtn.textContent = '📍 Obteniendo ubicación...';
    geoBtn.disabled = true;
    geoStatus.innerHTML = '<span style="color:var(--text-secondary);">Buscando tu ubicación...</span>';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        const distance = haversineDistance(
          ORIGIN_LAT, ORIGIN_LNG,
          userCoords.lat, userCoords.lng
        );

        deliveryDistance = Math.round(distance * 10) / 10;
        calculateDeliveryFee();

        geoBtn.innerHTML = '✅ Ubicación detectada';
        geoBtn.disabled = false;
        geoBtn.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';

        renderDeliveryResult();
        updateCheckoutTotal();
      },
      (error) => {
        geoBtn.textContent = '📍 CALCULAR ENVÍO';
        geoBtn.disabled = false;
        let msg = 'No pudimos obtener tu ubicación.';
        if (error.code === 1) msg = 'Permiso de ubicación denegado. Actívalo en tu navegador.';
        geoStatus.innerHTML = `<span style="color:var(--error);">${msg}</span>
          <br><span style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;display:block;">También puedes contactarnos por <a href="https://wa.me/56922303780" style="color:var(--gold);">WhatsApp</a> para consultar el envío.</span>`;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function calculateDeliveryFee() {
    if (deliveryDistance === null) {
      deliveryFee = 0;
      deliveryZone = null;
      return;
    }

    const totalUnits = getCartCount();

    // Find the zone
    for (const zone of DELIVERY_ZONES) {
      if (deliveryDistance <= zone.maxKm) {
        deliveryZone = zone;
        // Check if free delivery applies based on quantity
        if (totalUnits >= zone.freeMinUnits) {
          deliveryFee = 0;
        } else {
          deliveryFee = zone.fee;
        }
        return;
      }
    }

    // Outside all zones — no delivery
    deliveryZone = null;
    deliveryFee = -1; // -1 means no delivery available
  }

  function renderDeliveryResult() {
    const result = $('#deliveryResult');
    if (!result) return;

    if (deliveryDistance === null) {
      result.style.display = 'none';
      return;
    }

    result.style.display = 'block';
    const totalUnits = getCartCount();

    if (deliveryFee === -1) {
      // No delivery
      result.innerHTML = `
        <div class="delivery-result-card delivery-no-zone">
          <div class="delivery-result-icon">🚫</div>
          <div class="delivery-result-info">
            <strong>Fuera de zona de reparto</strong>
            <p>Estás a ${deliveryDistance} km. Solo hacemos entregas hasta 15 km.</p>
            <p style="margin-top:0.5rem;"><a href="https://wa.me/56922303780" target="_blank" style="color:var(--gold);">Contáctanos por WhatsApp</a> para buscar una solución.</p>
          </div>
        </div>
      `;
      return;
    }

    const isFree = deliveryFee === 0;
    const zone = deliveryZone;

    if (isFree && deliveryDistance <= 5) {
      result.innerHTML = `
        <div class="delivery-result-card delivery-free">
          <div class="delivery-result-icon">🎉</div>
          <div class="delivery-result-info">
            <strong>¡Envío GRATIS!</strong>
            <p>Estás a ${deliveryDistance} km — dentro de la zona de envío gratuito.</p>
          </div>
          <div class="delivery-result-price free">$0</div>
        </div>
      `;
    } else if (isFree) {
      result.innerHTML = `
        <div class="delivery-result-card delivery-free">
          <div class="delivery-result-icon">🎉</div>
          <div class="delivery-result-info">
            <strong>¡Envío GRATIS!</strong>
            <p>Estás a ${deliveryDistance} km — envío gratis por llevar ${totalUnits} unidades.</p>
          </div>
          <div class="delivery-result-price free">$0</div>
        </div>
      `;
    } else {
      // Has fee, show how to get free delivery
      const unitsNeeded = zone.freeMinUnits - totalUnits;
      result.innerHTML = `
        <div class="delivery-result-card delivery-paid">
          <div class="delivery-result-icon">🚚</div>
          <div class="delivery-result-info">
            <strong>Envío ${formatPrice(deliveryFee)}</strong>
            <p>Estás a ${deliveryDistance} km de distancia.</p>
            <p class="delivery-tip">💡 ¡Agrega ${unitsNeeded} unidad${unitsNeeded > 1 ? 'es' : ''} más y el envío es <strong style="color:#2ecc71;">GRATIS</strong>!</p>
          </div>
          <div class="delivery-result-price">${formatPrice(deliveryFee)}</div>
        </div>
      `;
    }
  }

  function updateCheckoutTotal() {
    calculateDeliveryFee();
    renderDeliveryResult();

    const subtotalNormal = getCartSubtotalWithoutDiscount();
    const totalWithoutDelivery = getCartTotal();
    const checkoutSubtotalEl = $('#checkoutSubtotalValue');
    const checkoutDeliveryEl = $('#checkoutDeliveryValue');
    const checkoutTotalEl = $('#checkoutTotalValue');

    if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = formatPrice(subtotalNormal);

    if (checkoutDeliveryEl) {
      if (deliveryDistance === null) {
        checkoutDeliveryEl.textContent = 'Calcular arriba ↑';
        checkoutDeliveryEl.style.color = 'var(--text-muted)';
      } else if (deliveryFee === -1) {
        checkoutDeliveryEl.textContent = 'Fuera de zona';
        checkoutDeliveryEl.style.color = 'var(--error)';
      } else if (deliveryFee === 0) {
        checkoutDeliveryEl.textContent = '¡GRATIS!';
        checkoutDeliveryEl.style.color = '#2ecc71';
      } else {
        checkoutDeliveryEl.textContent = formatPrice(deliveryFee);
        checkoutDeliveryEl.style.color = 'var(--orange)';
      }
    }

    if (checkoutTotalEl) {
      const total = deliveryFee > 0 ? totalWithoutDelivery + deliveryFee : totalWithoutDelivery;
      checkoutTotalEl.textContent = formatPrice(total);
    }
  }

  // ═══════════════════════════════════════
  // CART MANAGEMENT
  // ═══════════════════════════════════════

  function loadCart() {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) cart = JSON.parse(saved);
    } catch (e) { cart = []; }
    renderCart();
    updateBadge();
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateBadge();
  }

  function handleAddToCart(e) {
    const btn = e.currentTarget;
    const card = btn.closest('.product-card');
    let productId = btn.dataset.product;
    let productName = btn.dataset.name;
    const productPrice = parseInt(btn.dataset.price);
    const productImage = btn.dataset.image;

    if (card) {
      const mixerSelect = card.querySelector('.mixer-select');
      if (mixerSelect) {
        productName += ` (Con ${mixerSelect.value})`;
        productId += `-${mixerSelect.value.toLowerCase().replace('-', '')}`;
      }

      const energySelect = card.querySelector('.energy-select');
      if (energySelect) {
        const optionLabel = energySelect.options[energySelect.selectedIndex].text;
        productName += ` (${optionLabel})`;
        productId += `-${energySelect.value}`;
      }
    }

    if (typeof gtag === 'function') {
      gtag('event', 'add_to_cart', {
        currency: 'CLP',
        value: productPrice,
        items: [{ item_id: productId, item_name: productName, price: productPrice, quantity: 1 }]
      });
    }

    const qtyInput = card ? card.querySelector('.qty-value') : document.getElementById(`qty-${productId}`);
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

    addToCart({
      id: productId,
      name: productName,
      price: productPrice,
      image: productImage,
      quantity: quantity
    });

    if (qtyInput) qtyInput.value = '1';

    // Button animation
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '✓ ¡AGREGADO!';
    btn.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
    btn.classList.add('btn-success-pulse');
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.background = '';
      btn.classList.remove('btn-success-pulse');
    }, 1800);

    showToast(`🍸 ${productName} agregado al carrito`);
    openCart();
  }

  function addToCart(item) {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push({ ...item });
    }
    saveCart();
    renderCart();
    
    // GTM tracking
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'add_to_cart',
      ecommerce: {
        value: item.price * item.quantity,
        currency: 'CLP',
        items: [{
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        }]
      }
    });

    // Recalculate delivery when cart changes
    if (deliveryDistance !== null) {
      calculateDeliveryFee();
      renderDeliveryResult();
      updateCheckoutTotal();
    }
  }

  function updateCartItemQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    // GTM tracking
    window.dataLayer = window.dataLayer || [];
    if (delta > 0) {
      window.dataLayer.push({
        event: 'add_to_cart',
        ecommerce: {
          value: item.price * delta,
          currency: 'CLP',
          items: [{
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: delta
          }]
        }
      });
    } else if (delta < 0) {
      window.dataLayer.push({
        event: 'remove_from_cart',
        ecommerce: {
          value: item.price * Math.abs(delta),
          currency: 'CLP',
          items: [{
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: Math.abs(delta)
          }]
        }
      });
    }

    item.quantity += delta;
    if (item.quantity <= 0) { removeFromCart(id); return; }
    saveCart();
    renderCart();
    if (deliveryDistance !== null) {
      calculateDeliveryFee();
      renderDeliveryResult();
      updateCheckoutTotal();
    }
  }

  function removeFromCart(id) {
    const item = cart.find(i => i.id === id);
    if (item) {
      // GTM tracking
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'remove_from_cart',
        ecommerce: {
          value: item.price * item.quantity,
          currency: 'CLP',
          items: [{
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity
          }]
        }
      });
    }
    
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
    if (deliveryDistance !== null) {
      calculateDeliveryFee();
      renderDeliveryResult();
      updateCheckoutTotal();
    }
  }

  function getCartTotal() {
    let eligibleQty = 0;
    let otherTotal = 0;
    
    cart.forEach(item => {
      if (item.id && (item.id.startsWith('tropiconce') || item.id.startsWith('pink-fantasy'))) {
        eligibleQty += item.quantity;
      } else {
        otherTotal += item.price * item.quantity;
      }
    });
    
    const pairs = Math.floor(eligibleQty / 2);
    const singles = eligibleQty % 2;
    const promoTotal = (pairs * 18000) + (singles * 9990);
    
    return promoTotal + otherTotal;
  }

  function getCartSubtotalWithoutDiscount() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function formatPrice(price) {
    return '$' + price.toLocaleString('es-CL');
  }

  // ─── CART RENDERING ───
  function renderCart() {
    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <span class="cart-empty-icon">🛒</span>
          <p>Tu carrito está vacío</p>
          <p style="font-size:0.85rem;color:var(--gold);margin-bottom:1rem;">¡No te pierdas nuestros sabores!</p>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('cartClose').click(); document.getElementById('productos').scrollIntoView({behavior:'smooth'});">
            VER PRODUCTOS 🍸
          </button>
        </div>
      `;
      cartFooter.style.display = 'none';
    } else {
      cartItems.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}">
          </div>
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${formatPrice(item.price)}</div>
            <div class="cart-item-controls">
              <button class="cart-qty-btn" onclick="window._cartUpdateQty('${item.id}', -1)">−</button>
              <span class="cart-item-qty">${item.quantity}</span>
              <button class="cart-qty-btn" onclick="window._cartUpdateQty('${item.id}', 1)">+</button>
              <button class="cart-item-remove" onclick="window._cartRemove('${item.id}')">🗑</button>
            </div>
          </div>
        </div>
      `).join('');

      const subtotalNormal = getCartSubtotalWithoutDiscount();
      const total = getCartTotal();
      const discount = subtotalNormal - total;

      cartSubtotal.textContent = formatPrice(subtotalNormal);
      cartTotal.textContent = formatPrice(total);

      const cartDiscountRow = $('#cartDiscountRow');
      const cartDiscount = $('#cartDiscount');
      if (cartDiscountRow && cartDiscount) {
        if (discount > 0) {
          cartDiscountRow.style.display = 'flex';
          cartDiscount.textContent = '-' + formatPrice(discount);
        } else {
          cartDiscountRow.style.display = 'none';
        }
      }

      cartFooter.style.display = 'block';

      // Show delivery upsell in cart if applicable
      const count = getCartCount();
      const cartUpsell = document.getElementById('cartUpsell');
      if (cartUpsell) {
        if (count < 2) {
          cartUpsell.innerHTML = `<span class="cart-upsell-text">💡 Agrega 1 más para <strong style="color:#2ecc71;">envío GRATIS</strong> hasta 8km</span>`;
          cartUpsell.style.display = 'block';
        } else if (count < 3) {
          cartUpsell.innerHTML = `<span class="cart-upsell-text">💡 Agrega 1 más para <strong style="color:#2ecc71;">envío GRATIS</strong> a toda la ciudad</span>`;
          cartUpsell.style.display = 'block';
        } else {
          cartUpsell.innerHTML = `<span class="cart-upsell-text">🎉 <strong style="color:#2ecc71;">¡Envío GRATIS!</strong> para ti</span>`;
          cartUpsell.style.display = 'block';
        }
      }
    }
  }

  window._cartUpdateQty = updateCartItemQty;
  window._cartRemove = removeFromCart;

  function updateBadge() {
    const count = getCartCount();
    cartBadge.textContent = count;
    if (count > 0) {
      cartBadge.classList.add('show');
      cartBadge.classList.add('bump');
      setTimeout(() => cartBadge.classList.remove('bump'), 300);
    } else {
      cartBadge.classList.remove('show');
    }
  }

  // ─── CART SIDEBAR ───
  function openCart() {
    cartOverlay.classList.add('open');
    cartSidebar.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartOverlay.classList.remove('open');
    cartSidebar.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ─── CHECKOUT ───
  function openCheckout() {
    closeCart();
    renderCheckoutSummary();
    checkoutForm.style.display = '';
    orderConfirmation.style.display = 'none';
    updateCheckoutTotal();
    checkoutOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // GTM tracking
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'begin_checkout',
      ecommerce: {
        value: getCartTotal(),
        currency: 'CLP',
        items: cart.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      }
    });

    if (isStoreClosed) {
      loadTimeSlots();
    }
  }

  function closeCheckout() {
    checkoutOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderCheckoutSummary() {
    const items = cart.map(item => `
      <div class="checkout-summary-item">
        <span>${item.name} × ${item.quantity}</span>
        <span>${formatPrice(item.price * item.quantity)}</span>
      </div>
    `).join('');

    const subtotalNormal = getCartSubtotalWithoutDiscount();
    const total = getCartTotal();
    const discount = subtotalNormal - total;

    let discountHtml = '';
    if (discount > 0) {
      discountHtml = `
        <div class="checkout-summary-item" style="color:#2ecc71;">
          <span>Descuento Promo 2x</span>
          <span>-${formatPrice(discount)}</span>
        </div>
      `;
    }

    checkoutSummary.innerHTML = `
      <h3>Resumen del pedido</h3>
      ${items}
      <div class="checkout-summary-item" style="border-top:1px solid var(--border-subtle);padding-top:0.5rem;margin-top:0.5rem;">
        <span>Subtotal</span>
        <span id="checkoutSubtotalValue">${formatPrice(subtotalNormal)}</span>
      </div>
      ${discountHtml}
      <div class="checkout-summary-item">
        <span>Envío</span>
        <span id="checkoutDeliveryValue" style="color:var(--text-muted);">Calcular abajo ↓</span>
      </div>
      <div class="checkout-summary-total">
        <span>Total</span>
        <span id="checkoutTotalValue">${formatPrice(total)}</span>
      </div>
    `;
  }

  function handlePaymentChange(e) {
    const method = e.target.value;
    if (method === 'transfer') {
      transferInfo.classList.add('visible');
    } else {
      transferInfo.classList.remove('visible');
    }
  }

  // ═══════════════════════════════════════
  // PLACE ORDER
  // ═══════════════════════════════════════

  async function handlePlaceOrder(e) {
    e.preventDefault();

    const name = $('#customerName').value.trim();
    const email = $('#customerEmail').value.trim();
    const phone = $('#customerPhone').value.trim();
    const address = $('#customerAddress').value.trim();
    const reference = $('#customerReference').value.trim();
    const comments = $('#customerComments').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const scheduledTime = isStoreClosed ? $('#scheduledTime').value : null;

    // Validation
    if (!name) { highlightField('#customerName'); return showToast('Ingresa tu nombre', 'error'); }
    if (!email) { highlightField('#customerEmail'); return showToast('Ingresa tu correo electrónico', 'error'); }
    if (!phone) { highlightField('#customerPhone'); return showToast('Ingresa tu teléfono', 'error'); }
    if (!address) { highlightField('#customerAddress'); return showToast('Ingresa tu dirección', 'error'); }
    if (isStoreClosed && !scheduledTime) { highlightField('#scheduledTime'); return showToast('Selecciona la hora de entrega', 'error'); }
    if (cart.length === 0) return showToast('Tu carrito está vacío', 'error');

    // Check delivery zone
    if (deliveryFee === -1) {
      return showToast('Tu ubicación está fuera de nuestra zona de reparto', 'error');
    }

    const orderNumber = 'LD-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const finalDeliveryFee = deliveryFee > 0 ? deliveryFee : 0;
    const grandTotal = getCartTotal() + finalDeliveryFee;

    const order = {
      orderNumber,
      items: cart.map(item => ({
        id: item.id || '', name: item.name || '', price: item.price || 0,
        quantity: item.quantity || 1, image: item.image || ''
      })),
      customer: { 
        name: name || '', phone: phone || '', email: email || '', address: address || '', 
        reference: reference || '', comments: comments || '' 
      },
      payment: { method: paymentMethod || 'transfer', status: 'pending' },
      delivery: {
        fee: finalDeliveryFee || 0,
        distance: deliveryDistance || 0,
        coords: userCoords || null
      },
      isScheduled: isStoreClosed,
      scheduledTime: scheduledTime,
      subtotal: getCartTotal() || 0,
      total: grandTotal || 0,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const btn = $('#placeOrderBtn');
    btn.textContent = 'PROCESANDO...';
    btn.disabled = true;

    let firestoreDocId = null;

    try {
      if (firebaseReady && db) {
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const firestoreOrder = { ...order, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, 'orders'), firestoreOrder);
        firestoreDocId = docRef.id;
        console.log('✅ Pedido guardado en Firebase:', docRef.id);
      }

      saveOrderLocally({ ...order, firestoreDocId });
      currentTrackingOrderId = firestoreDocId;
      currentTrackingOrderNumber = orderNumber;
      localStorage.setItem(TRACKING_KEY, JSON.stringify({ docId: firestoreDocId, orderNumber }));
      if (trackOrderToggle) trackOrderToggle.style.display = 'flex';
      if (firestoreDocId) startTrackingListener(firestoreDocId);

      if (paymentMethod === 'flow') {
        const overlay = document.getElementById('paymentLoadingOverlay');
        if (overlay) overlay.classList.remove('hidden');
        
        try {
          const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderNumber: order.orderNumber,
              amount: order.total,
              email: email
            })
          });
          const data = await response.json();
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
            return;
          } else {
            throw new Error(data.error || 'No se obtuvo la URL de redirección.');
          }
        } catch (payErr) {
          console.error('Error al iniciar pago con Flow:', payErr);
          if (overlay) overlay.classList.add('hidden');
          btn.textContent = 'CONFIRMAR PEDIDO';
          btn.disabled = false;
          return showToast('Error al conectar con Flow: ' + payErr.message, 'error');
        }
      }

      showOrderConfirmation(order, paymentMethod);
      cart = [];
      saveCart();
      renderCart();
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      saveOrderLocally(order);
      
      if (paymentMethod === 'flow') {
        const overlay = document.getElementById('paymentLoadingOverlay');
        if (overlay) overlay.classList.remove('hidden');
        
        try {
          const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderNumber: order.orderNumber,
              amount: order.total,
              email: email
            })
          });
          const data = await response.json();
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
            return;
          } else {
            throw new Error(data.error || 'No se obtuvo la URL de redirección.');
          }
        } catch (payErr) {
          console.error('Error al iniciar pago con Flow (offline):', payErr);
          if (overlay) overlay.classList.add('hidden');
          btn.textContent = 'CONFIRMAR PEDIDO';
          btn.disabled = false;
          return showToast('Error al conectar con Flow: ' + payErr.message, 'error');
        }
      }
      
      showOrderConfirmation(order, paymentMethod);
      cart = [];
      saveCart();
      renderCart();
    }

    btn.textContent = 'CONFIRMAR PEDIDO';
    btn.disabled = false;
  }

  function saveOrderLocally(order) {
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      orders.unshift(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      
      if (order.customerName && order.items && order.items.length > 0) {
        realRecentOrders.unshift({
          name: order.customerName.split(' ')[0],
          area: 'Concepción y alrededores',
          product: order.items[0].name + ' 🍸',
          timestamp: new Date()
        });
      }
    } catch (e) { console.error('Error guardando pedido localmente:', e); }
  }

  function showOrderConfirmation(order, method) {
    if (typeof gtag === 'function') {
      gtag('event', 'purchase', {
        transaction_id: order.orderNumber,
        value: order.total,
        currency: 'CLP',
        items: order.items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity }))
      });
    }

    checkoutForm.style.display = 'none';
    orderConfirmation.style.display = 'block';
    $('#confirmationOrderNumber').textContent = `Pedido ${order.orderNumber}`;

    const msg = $('#confirmationMessage');
    const scheduleNotice = order.isScheduled ? `<br><br><strong>⏰ Importante:</strong> Tu pedido está programado para ser entregado a las <strong>${order.scheduledTime} hrs</strong>.` : '';
    
    if (method === 'transfer') {
      msg.innerHTML = `
        Tu pedido ha sido registrado. Realiza la transferencia por <strong>${formatPrice(order.total)}</strong> 
        y envía el comprobante por 
        <a href="https://wa.me/56922303780?text=Hola!%20Acabo%20de%20hacer%20el%20pedido%20${order.orderNumber}%20por%20${formatPrice(order.total)}%20y%20adjunto%20comprobante" target="_blank" style="color: var(--gold); font-weight: 600;">WhatsApp</a> 
        para confirmar tu pedido.
      `;
    } else if (method === 'flow_success') {
      msg.innerHTML = `
        ¡Pago verificado con éxito! 💳<br>
        Tu pedido ha sido confirmado y el equipo ya está en preparación. 
        Te contactaremos por WhatsApp ante cualquier duda. ¡Salud! 🥂
        ${scheduleNotice}
      `;
    } else {
      msg.innerHTML = `Tu pedido ha sido registrado exitosamente. Te contactaremos por WhatsApp para coordinar el pago y la entrega. 🎉`;
    }

    $('#customerName').value = '';
    $('#customerPhone').value = '';
    $('#customerAddress').value = '';
    $('#customerReference').value = '';
    $('#customerComments').value = '';
  }

  function highlightField(selector) {
    let field = $(selector);
    if (!field) return;
    if (selector === '#scheduledTime') {
      const grid = $('#timeSlotsGrid');
      if (grid) {
        grid.style.outline = '2px solid var(--error)';
        grid.style.borderRadius = 'var(--radius-sm)';
        setTimeout(() => { grid.style.outline = ''; }, 3000);
      }
      return;
    }
    field.style.borderColor = 'var(--error)';
    field.focus();
    setTimeout(() => { field.style.borderColor = ''; }, 3000);
  }

  // ═══════════════════════════════════════
  // ORDER TRACKING (synced with admin)
  // ═══════════════════════════════════════

  function openTracking() {
    if (!currentTrackingOrderNumber && !currentTrackingOrderId) {
      showToast('No tienes un pedido activo', 'error');
      return;
    }
    $('#trackingOrderNumber').textContent = `Pedido ${currentTrackingOrderNumber}`;
    if (!currentTrackingOrderId || !firebaseReady) {
      updateTrackingUI('new', null);
    }
    trackingOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeTracking() {
    trackingOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  async function startTrackingListener(docId) {
    if (!firebaseReady || !db || !docId) return;
    if (trackingUnsubscribe) { trackingUnsubscribe(); trackingUnsubscribe = null; }

    try {
      const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const orderRef = doc(db, 'orders', docId);
      trackingUnsubscribe = onSnapshot(orderRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          updateTrackingUI(data.status || 'new', data);
          updateLocalOrder(docId, data.status || 'new');
        }
      }, (error) => {
        console.error('Error en listener de tracking:', error);
      });
    } catch (error) {
      console.error('Error iniciando tracking listener:', error);
    }
  }

  function updateLocalOrder(docId, status) {
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      const order = orders.find(o => o.firestoreDocId === docId);
      if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      }
    } catch (e) {}
  }

  function updateTrackingUI(status, orderData) {
    const steps = $$('.tracking-step');
    const pipeline = $('#trackingPipeline');
    const cancelled = $('#trackingCancelled');
    const details = $('#trackingDetails');
    const updated = $('#trackingUpdated');

    if (status === 'cancelled') {
      pipeline.style.display = 'none';
      cancelled.style.display = 'block';
    } else {
      pipeline.style.display = 'block';
      cancelled.style.display = 'none';
      const currentIndex = STATUS_ORDER.indexOf(status);
      steps.forEach((step) => {
        const stepIndex = STATUS_ORDER.indexOf(step.dataset.status);
        step.classList.remove('active', 'completed');
        if (stepIndex < currentIndex) step.classList.add('completed');
        else if (stepIndex === currentIndex) step.classList.add('active');
      });
    }

    if (orderData && orderData.items) {
      const itemsHtml = orderData.items.map(item =>
        `<div class="tracking-detail-item"><span>${item.name} × ${item.quantity}</span><span>${formatPrice(item.price * item.quantity)}</span></div>`
      ).join('');
      details.innerHTML = `<h4>Detalle del pedido</h4>${itemsHtml}<div class="tracking-detail-total"><span>Total</span><span>${formatPrice(orderData.total)}</span></div>`;
    }

    if (orderData && orderData.updatedAt) {
      let timeStr = '';
      if (orderData.updatedAt.toDate) timeStr = orderData.updatedAt.toDate().toLocaleString('es-CL');
      else timeStr = new Date(orderData.updatedAt).toLocaleString('es-CL');
      updated.innerHTML = `<span class="tracking-live-dot"></span> Actualización en tiempo real · ${timeStr}`;
    } else {
      updated.innerHTML = `<span class="tracking-live-dot"></span> Conectado · Actualizaciones en tiempo real`;
    }
  }

  // ─── QUANTITY SELECTOR ───
  function handleQuantityChange(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const targetId = btn.dataset.target;
    const input = $(`#${targetId}`);
    if (!input) return;
    let value = parseInt(input.value) || 1;
    if (action === 'increase') value = Math.min(value + 1, 20);
    else if (action === 'decrease') value = Math.max(value - 1, 1);
    input.value = value;
  }

  // ─── TOAST NOTIFICATIONS ───
  function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : '⚠️'}</span> ${message}`;
    if (type === 'error') toast.style.borderColor = 'var(--error)';
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 300); }, 2500);
  }

  // ─── NAVBAR ───
  function initNavbar() {
    const navbar = $('#navbar');
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 50) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    }, { passive: true });
  }

  function toggleMobileMenu() {
    const navLinks = $('#navLinks');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    if (navLinks.style.display === 'flex') {
      navLinks.style.cssText = `display:flex;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:rgba(10,10,10,0.95);backdrop-filter:blur(20px);padding:1.5rem;border-bottom:1px solid rgba(255,255,255,0.06);gap:1rem;animation:fadeIn 0.3s ease;z-index:50;`;
    }
  }

  // ─── SMOOTH SCROLL ───
  function handleSmoothScroll(e) {
    const href = e.currentTarget.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    if (window.innerWidth <= 768) {
      $('#navLinks').style.display = 'none';
    }
  }

  // ─── SCROLL ANIMATIONS ───
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    $$('.animate-on-scroll').forEach(el => observer.observe(el));
  }

  // ==========================================
  // LAUNCH COUNTDOWN LOGIC
  // ==========================================
  function initLaunchCountdown() {
    const launchOverlay = document.getElementById('launchOverlay');
    if (!launchOverlay) return;

    // Force bypass post-launch
    launchOverlay.classList.add('hidden');
    launchOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
    return;

    // Target: June 26, 2026 at 13:30:00 Chile Time (UTC-4)
    const targetDate = new Date('2026-06-26T13:30:00-04:00').getTime();

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        clearInterval(timerInterval);
        launchOverlay.classList.add('hidden');
        document.body.style.overflow = 'auto'; // allow scrolling again
        return;
      }

      // Prevent scrolling while overlay is active
      document.body.style.overflow = 'hidden';

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownDisplay.innerHTML = `
        <div class="countdown-item">
          <span class="countdown-value">${days}</span>
          <span class="countdown-label">Días</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-value">${hours.toString().padStart(2, '0')}</span>
          <span class="countdown-label">Hrs</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-value">${minutes.toString().padStart(2, '0')}</span>
          <span class="countdown-label">Min</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-value">${seconds.toString().padStart(2, '0')}</span>
          <span class="countdown-label">Seg</span>
        </div>
      `;
    }

    updateCountdown();
    const timerInterval = setInterval(updateCountdown, 1000);
  }

  function checkPaymentReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderNum = urlParams.get('orderNumber');
    
    if (paymentStatus && orderNum) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      if (paymentStatus === 'success') {
        const orderTotal = getCartTotal();
        const cartItems = [...cart];
        
        // GTM tracking
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'purchase',
          ecommerce: {
            transaction_id: orderNum,
            value: parseFloat(orderTotal),
            currency: 'CLP',
            items: cartItems.map(item => ({
              item_id: item.id,
              item_name: item.name,
              price: item.price,
              quantity: item.quantity
            }))
          }
        });

        cart = [];
        saveCart();
        renderCart();
        
        showToast('¡Pago recibido con éxito! 🥂', 'success');
        
        const tracking = localStorage.getItem(TRACKING_KEY);
        if (tracking) {
          const trackData = JSON.parse(tracking);
          if (trackData.orderNumber === orderNum) {
            if (trackData.docId) {
              openTracking(trackData.docId);
            }
          }
        }
        
        const successOrder = {
          orderNumber: orderNum,
          total: orderTotal,
          customer: { name: 'Cliente' },
          payment: { method: 'flow', status: 'paid' },
          isScheduled: false
        };
        showOrderConfirmation(successOrder, 'flow_success');
      } else if (paymentStatus === 'failed') {
        showToast('El pago con Flow fue cancelado o rechazado. Intenta de nuevo. ❌', 'error');
      }
    }
  }

  // ─── START ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init(); });
  } else {
    init();
  }

})();
