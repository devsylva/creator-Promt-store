(function() {
  const STORAGE_KEY = 'cps_newsletter_verified';

  // Full country list used to populate dropdowns
  const COUNTRIES = [
    "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czechia","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","French Polynesia","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Republic of the Congo","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
  ];

  function loadVerifiedEmail() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (stored.email) {
        return stored.email;
      }
    } catch (err) {
      // Ignore corrupted storage
    }
    return '';
  }

  function persistVerifiedEmail(email) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email }));
    } catch (err) {
      // Storage failures are non-blocking
    }
  }

  function createGateElement() {
    const wrapper = document.createElement('div');
    wrapper.className = 'checkout-overlay is-hidden';
    wrapper.innerHTML = [
      '<div class="checkout-overlay__backdrop" data-close></div>',
      '<div class="checkout-overlay__modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">',
      '  <button type="button" class="checkout-overlay__close" aria-label="Close" data-close>×</button>',
      '  <div class="checkout-steps__progress" aria-hidden="true">',
      '    <span class="checkout-steps__progress-bar" data-progress></span>',
      '  </div>',
      '  <div class="checkout-step" data-step="1">',
      '    <div class="checkout-step__header">',
      '      <span class="checkout-step__badge">Step 1</span>',
      '      <div>',
      '        <h2 class="checkout-step__title" id="checkout-title">Start verification</h2>',
      '        <p class="checkout-step__hint">We’ll email you a 4‑digit unlock code.</p>',
      '      </div>',
      '    </div>',
      '    <div class="checkout-step__body">',
      '      <div class="newsletter-gate__row">',
      '        <input type="text" class="newsletter-gate__input" name="name" placeholder="Your name" autocomplete="name" />',
      '        <select class="newsletter-gate__input" name="country">',
      '          <option value="">Country</option>',
      '        </select>',
      '      </div>',
      '      <div class="newsletter-gate__row">',
      '        <input type="email" class="newsletter-gate__input" name="email" placeholder="Email address" autocomplete="email" />',
      '        <button type="button" class="newsletter-gate__btn" data-action="send">Send code</button>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="checkout-step" data-step="2">',
      '    <div class="checkout-step__header">',
      '      <span class="checkout-step__badge">Step 2</span>',
      '      <div>',
      '        <h2 class="checkout-step__title">Enter the 4 digits</h2>',
      '        <p class="checkout-step__hint">Check your inbox or spam folder.</p>',
      '      </div>',
      '    </div>',
      '    <div class="checkout-step__body">',
      '      <div class="newsletter-gate__row">',
      '        <input type="text" maxlength="4" class="newsletter-gate__input" name="otp" placeholder="Enter 4-digit code" inputmode="numeric" />',
      '        <button type="button" class="newsletter-gate__btn" data-action="verify">Verify email</button>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="checkout-step" data-step="3">',
      '    <div class="checkout-step__header">',
      '      <span class="checkout-step__badge">Step 3</span>',
      '      <div>',
      '        <h2 class="checkout-step__title">Finish checkout</h2>',
      '        <p class="checkout-step__hint">You’re all set — complete your payment.</p>',
      '      </div>',
      '    </div>',
      '    <div class="checkout-step__body">',
      '      <button type="button" class="btn-pill btn-pill--full" data-action="continue">Continue to Stripe</button>',
      '    </div>',
      '  </div>',
      '  <p class="newsletter-gate__status" aria-live="polite"></p>',
      '</div>'
    ].join('');

    const countrySelect = wrapper.querySelector('select[name="country"]');
    if (countrySelect) {
      COUNTRIES.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        countrySelect.appendChild(opt);
      });
    }

    return {
      wrapper,
      progressBar: wrapper.querySelector('[data-progress]'),
      nameInput: wrapper.querySelector('input[name="name"]'),
      countryInput: wrapper.querySelector('input[name="country"], select[name="country"]'),
      emailInput: wrapper.querySelector('input[name="email"]'),
      otpInput: wrapper.querySelector('input[name="otp"]'),
      sendBtn: wrapper.querySelector('[data-action="send"]'),
      verifyBtn: wrapper.querySelector('[data-action="verify"]'),
      continueBtn: wrapper.querySelector('[data-action="continue"]'),
      statusEl: wrapper.querySelector('.newsletter-gate__status'),
      closeBtns: wrapper.querySelectorAll('[data-close]'),
      steps: wrapper.querySelectorAll('.checkout-step')
    };
  }

  function setStatus(statusEl, message, tone) {
    statusEl.textContent = message || '';
    statusEl.dataset.tone = tone || '';
  }

  function disableInputs(el, disabled) {
    [el.nameInput, el.countryInput, el.emailInput, el.otpInput, el.sendBtn, el.verifyBtn, el.continueBtn].forEach(node => {
      if (node) {
        node.disabled = disabled;
      }
    });
  }

  function updateProgress(el, currentStep) {
    if (!el.progressBar) return;
    const percentages = { 1: 33, 2: 66, 3: 100 };
    const percent = percentages[currentStep] || 33;
    el.progressBar.style.width = percent + '%';
    el.progressBar.dataset.step = String(currentStep);
  }

  function setActiveStep(el, stepNumber) {
    el.steps.forEach(step => {
      const isActive = step.getAttribute('data-step') === String(stepNumber);
      step.classList.toggle('is-active', isActive);
    });
    updateProgress(el, stepNumber);
  }

  function openOverlay(el) {
    el.wrapper.classList.remove('is-hidden');
    document.body.classList.add('checkout-overlay-open');
  }

  function closeOverlay(el) {
    el.wrapper.classList.add('is-hidden');
    document.body.classList.remove('checkout-overlay-open');
  }

  async function sendOtp(el) {
    const name = (el.nameInput.value || '').trim();
    const country = (el.countryInput.value || '').trim();
    const email = (el.emailInput.value || '').trim();

    if (name.length < 2) {
      setStatus(el.statusEl, 'Please enter your name (2+ characters).', 'error');
      el.nameInput.focus();
      return false;
    }

    if (country.length < 2) {
      setStatus(el.statusEl, 'Please enter your country.', 'error');
      el.countryInput.focus();
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus(el.statusEl, 'Enter a valid email address.', 'error');
      el.emailInput.focus();
      return false;
    }

    setStatus(el.statusEl, 'Sending code…', 'info');
    disableInputs(el, true);

    try {
      const response = await fetch('/api/newsletter-signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, country, email })
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(el.statusEl, data.error || 'Unable to send code. Try again.', 'error');
        disableInputs(el, false);
        return false;
      }

      setStatus(el.statusEl, 'Code sent. Check your email for the 4 digits.', 'success');
      setActiveStep(el, 2);
      el.otpInput.focus();
      disableInputs(el, false);
      return email;
    } catch (err) {
      setStatus(el.statusEl, 'Network error. Please retry.', 'error');
      disableInputs(el, false);
      return false;
    }
  }

  async function verifyOtp(el) {
    const email = (el.emailInput.value || '').trim();
    const otp = (el.otpInput.value || '').trim();

    if (otp.length !== 4) {
      setStatus(el.statusEl, 'Enter the 4-digit code.', 'error');
      el.otpInput.focus();
      return false;
    }

    setStatus(el.statusEl, 'Verifying…', 'info');
    disableInputs(el, true);

    try {
      const response = await fetch('/api/newsletter-verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(el.statusEl, data.error || 'Invalid code. Try again.', 'error');
        disableInputs(el, false);
        return false;
      }

      setStatus(el.statusEl, 'Email verified. Checkout unlocked.', 'success');
      disableInputs(el, false);
      return email;
    } catch (err) {
      setStatus(el.statusEl, 'Network error. Please retry.', 'error');
      disableInputs(el, false);
      return false;
    }
  }

  function setHeroImage(imageUrl) {
    const heroImg = document.querySelector('.hero-image__inner img');
    if (heroImg && imageUrl) {
      heroImg.src = imageUrl;
      heroImg.style.display = '';
    }
  }

  window.setupCheckoutPage = function setupCheckoutPage(options) {
    const { toolkitType, stripePublicKey, imageUrl } = options;
    const checkoutBtn = document.getElementById('checkout-btn');

    setHeroImage(imageUrl);

    if (!checkoutBtn) {
      return;
    }

    const stripe = Stripe(stripePublicKey);
    const gate = createGateElement();
    document.body.appendChild(gate.wrapper);

    let verifiedEmail = loadVerifiedEmail();

    const startCheckout = async () => {
      gate.continueBtn.disabled = true;
      gate.continueBtn.textContent = 'Redirecting…';

      try {
        const response = await fetch('/api/checkout-session/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            toolkit_type: toolkitType,
            newsletter_email: verifiedEmail,
          }),
        });

        const data = await response.json();
        if (data.error) {
          setStatus(gate.statusEl, data.error, 'error');
          gate.continueBtn.disabled = false;
          gate.continueBtn.textContent = 'Continue to Stripe';
          return;
        }

        const result = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (result.error) {
          setStatus(gate.statusEl, result.error.message, 'error');
          gate.continueBtn.disabled = false;
          gate.continueBtn.textContent = 'Continue to Stripe';
        }
      } catch (error) {
        console.error('Error:', error);
        setStatus(gate.statusEl, 'An error occurred. Please try again.', 'error');
        gate.continueBtn.disabled = false;
        gate.continueBtn.textContent = 'Continue to Stripe';
      }
    };

    gate.closeBtns.forEach(btn => {
      btn.addEventListener('click', () => closeOverlay(gate));
    });

    gate.sendBtn.addEventListener('click', async () => {
      const email = await sendOtp(gate);
      if (email) {
        verifiedEmail = email;
      }
    });

    gate.verifyBtn.addEventListener('click', async () => {
      const email = await verifyOtp(gate);
      if (email) {
        verifiedEmail = email;
        persistVerifiedEmail(email);
        setActiveStep(gate, 3);
      }
    });

    gate.continueBtn.addEventListener('click', () => {
      if (!verifiedEmail) {
        setStatus(gate.statusEl, 'Please verify your email first.', 'error');
        setActiveStep(gate, 1);
        return;
      }
      startCheckout();
    });

    checkoutBtn.addEventListener('click', () => {
      setStatus(gate.statusEl, '', '');
      gate.continueBtn.textContent = 'Continue to Stripe';
      gate.continueBtn.disabled = false;
      if (verifiedEmail) {
        setActiveStep(gate, 3);
      } else {
        setActiveStep(gate, 1);
      }
      openOverlay(gate);
    });

    if (verifiedEmail) {
      setStatus(gate.statusEl, `Verified as ${verifiedEmail}.`, 'success');
    }
  };
})();
