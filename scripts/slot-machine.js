document.addEventListener('DOMContentLoaded', () => {
  const launchForm = document.getElementById('launchForm');
  const launchName = document.getElementById('launchName');
  const launchPhone = document.getElementById('launchPhone');
  const launchSlotContainer = document.getElementById('launchSlotContainer');
  const spinBtn = document.getElementById('spinBtn');
  const resultDisplay = document.getElementById('slotResult');
  const prizeSelector = document.getElementById('prizeSelector');
  
  const reels = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3')
  ];
  
  const symbols = ['🍹', '🍻', '🧊', '🍒', '🍋', '🍇'];
  const symbolHeight = 80;
  const symbolsPerReel = 30;

  let isSpinning = false;
  let userData = null;

  function showCustomAlert(title, message, icon = '⚠️') {
    try {
      const overlay = document.getElementById('customAlertOverlay');
      if (!overlay) {
        alert(title + '\\n\\n' + message.replace(/<br>/g, '\\n').replace(/<[^>]+>/g, ''));
        return;
      }
      
      document.getElementById('customAlertTitle').textContent = title;
      document.getElementById('customAlertMessage').innerHTML = message;
      
      const iconEl = document.getElementById('customAlertIcon');
      if (icon) {
        iconEl.textContent = icon;
        iconEl.style.display = 'block';
      } else {
        iconEl.style.display = 'none';
      }
      
      overlay.classList.remove('hidden');
      
      const btn = document.getElementById('customAlertBtn');
      if (btn) {
        btn.onclick = () => {
          overlay.classList.add('hidden');
        };
      }
    } catch(err) {
      console.error('Alert error:', err);
      alert(title + ' - ' + message.replace(/<[^>]+>/g, ''));
    }
  }

  // Initialize reels
  function initReels() {
    reels.forEach(reel => {
      reel.innerHTML = '';
      for (let i = 0; i < symbolsPerReel; i++) {
        const symbolDiv = document.createElement('div');
        symbolDiv.className = 'slot-symbol';
        symbolDiv.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        reel.appendChild(symbolDiv);
      }
      reel.style.transform = `translateY(0px)`;
      reel.style.transition = 'none';
    });
  }

  initReels();

  // Form Submission
  if (launchForm) {
    launchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = launchName.value.trim();
      const phone = launchPhone.value.trim();
      
      if (!name || !phone) return alert('Por favor ingresa tu nombre y teléfono.');
      
      const btn = launchForm.querySelector('button');
      btn.textContent = 'Verificando...';
      btn.disabled = true;

      // LocalStorage Fallback Check
      if (localStorage.getItem('launch_played_' + phone)) {
        btn.textContent = 'REGISTRARME Y DESBLOQUEAR';
        btn.disabled = false;
        showCustomAlert(
          '¡PILLADO! 🕵️‍♂️', 
          'Ya intentaste tirar la palanca.<br><br><strong>¿Por qué no invitas a un amigo a jugar?</strong> Quizás tenga mejor suerte que tú esta vez 😏<br><br>Siempre puedes volver al lanzamiento y conocernos 🍹',
          ''
        );
        return;
      }

      try {
        if (typeof window.db !== 'undefined') {
          try {
            const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const q = query(collection(window.db, 'launch_attempts'), where('phone', '==', phone));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              btn.textContent = 'REGISTRARME Y DESBLOQUEAR';
              btn.disabled = false;
              showCustomAlert(
                '¡PILLADO! 🕵️‍♂️', 
                'Ya intentaste tirar la palanca.<br><br><strong>¿Por qué no invitas a un amigo a jugar?</strong> Quizás tenga mejor suerte que tú esta vez 😏<br><br>Siempre puedes volver al lanzamiento y conocernos 🍹',
                ''
              );
              return;
            }
          } catch (dbCheckError) {
            console.warn('No se pudo verificar en base de datos, procediendo...', dbCheckError);
          }
        }

        // Unlock game
        userData = { name, phone };
        launchForm.style.display = 'none';
        launchSlotContainer.style.opacity = '1';
        launchSlotContainer.style.pointerEvents = 'auto';
        spinBtn.disabled = false;
        spinBtn.style.opacity = '1';
        resultDisplay.textContent = '¡TIRA LA PALANCA!';
        
      } catch (error) {
        console.error('Error general:', error);
        alert('Ocurrió un error. Intenta de nuevo.');
        btn.textContent = 'REGISTRARME Y DESBLOQUEAR';
        btn.disabled = false;
      }
    });
  }

  // Spin Logic
  if (spinBtn) {
    spinBtn.addEventListener('click', () => {
      if (isSpinning || !userData) return;
      isSpinning = true;
      spinBtn.disabled = true;
      spinBtn.style.opacity = '0.5';
      resultDisplay.textContent = 'GIRANDO...';

      // Save attempt immediately to prevent reload cheating (Fire and Forget)
      localStorage.setItem('launch_played_' + userData.phone, 'true');
      if (typeof window.db !== 'undefined') {
        import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js').then(({ collection, addDoc, serverTimestamp }) => {
          addDoc(collection(window.db, 'launch_attempts'), {
            name: userData.name,
            phone: userData.phone,
            timestamp: serverTimestamp()
          }).catch(e => console.warn('Error saving attempt:', e));
        }).catch(e => console.warn('Error importing firestore:', e));
      }
      
      // Determine Outcome (10% win rate)
      const isWin = Math.random() > 0.90;
      // const isWin = true; // For testing
      let finalSymbols = [];

      if (isWin) {
        const winSymbol = symbols[Math.floor(Math.random() * 3)];
        finalSymbols = [winSymbol, winSymbol, winSymbol];
      } else {
        finalSymbols = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ];
        if (finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2]) {
          finalSymbols[2] = finalSymbols[2] === '🍒' ? '🍋' : '🍒';
        }
      }

      const stopIndex = symbolsPerReel - 3;
      
      reels.forEach((reel, i) => {
        reel.children[stopIndex].textContent = finalSymbols[i];
        const stopPosition = stopIndex * symbolHeight;
        
        setTimeout(() => {
          reel.style.transition = 'transform 3s cubic-bezier(0.1, 0.7, 0.1, 1)';
          reel.style.transform = `translateY(-${stopPosition}px)`;
        }, i * 300);
      });

      setTimeout(() => {
        isSpinning = false;
        
        if (isWin) {
          resultDisplay.innerHTML = `<span style="color: var(--gold); font-weight: bold;">¡GANASTE! 🎉</span>`;
          spinBtn.style.display = 'none';
          prizeSelector.style.display = 'block';
        } else {
          resultDisplay.innerHTML = `<span>Casi... ¡Nos vemos el día del lanzamiento!</span>`;
          spinBtn.innerHTML = 'INTENTO AGOTADO';
        }
      }, 3600);
    });
  }

  // Prize Selection
  document.querySelectorAll('.select-prize-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const selectedPrize = e.target.dataset.prize;
      let couponCode = '';
      
      if (selectedPrize === 'HIELO GRATIS') couponCode = 'HIELO-LOMAS';
      if (selectedPrize === 'ENVÍO GRATIS') couponCode = 'FREE-LOMAS';
      if (selectedPrize === '10% DCTO') couponCode = '10-LOMAS';

      prizeSelector.innerHTML = '<p style="color:white;">Guardando tu premio...</p>';

      try {
        if (typeof window.db !== 'undefined') {
          const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
          await addDoc(collection(window.db, 'launch_coupons'), {
            name: userData.name,
            phone: userData.phone,
            prize: selectedPrize,
            coupon: couponCode,
            createdAt: serverTimestamp()
          });
        }
        
        navigator.clipboard.writeText(couponCode);
        prizeSelector.innerHTML = `
          <div style="background: rgba(46, 204, 113, 0.2); padding: 15px; border-radius: 8px; border: 1px solid #2ecc71;">
            <p style="color: #2ecc71; font-weight: bold; margin-bottom: 5px;">¡CUPÓN GUARDADO Y COPIADO!</p>
            <p style="color: white; font-size: 1.2rem; letter-spacing: 2px;">${couponCode}</p>
            <p style="font-size: 0.8rem; margin-top: 5px; color: var(--text-muted);">Úsalo a partir del 26 de Junio.</p>
          </div>
        `;
        
        if (typeof gtag === 'function') {
          gtag('event', 'earn_virtual_currency', { virtual_currency_name: selectedPrize });
        }
      } catch (error) {
        console.error('Error guardando cupón:', error);
        prizeSelector.innerHTML = '<p style="color:red;">Error de conexión. Anota tu código: ' + couponCode + '</p>';
      }
    });
  });
});
