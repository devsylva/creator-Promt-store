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
    wrapper.className = 'newsletter-gate newsletter-steps';
    wrapper.innerHTML = [
      '<div class="newsletter-steps__progress" aria-hidden="true">',
      '  <span class="newsletter-steps__progress-bar" data-progress></span>',
      '</div>',
      '<div class="newsletter-step" data-step="1" data-state="active">',
      '  <div class="newsletter-step__header">',
      '    <div class="newsletter-step__badge">Step 1</div>',
      '    <div>',
      '      <p class="newsletter-step__title">Start verification</p>',
      '      <p class="newsletter-step__hint">30s – we email you the unlock code.</p>',
      '    </div>',
      '    <button type="button" class="newsletter-step__action" data-action="start">Begin</button>',
      '  </div>',
      '  <div class="newsletter-step__body" data-body-step="1" hidden>',
      '    <div class="newsletter-gate__row">',
      '      <input type="text" class="newsletter-gate__input" name="name" placeholder="Your name" autocomplete="name" />',
      '      <select class="newsletter-gate__input" name="country">',
      '        <option value="">Country</option>',
      '      </select>',
      '    </div>',
      '    <div class="newsletter-gate__row">',
      '      <input type="email" class="newsletter-gate__input" name="email" placeholder="Email address" autocomplete="email" />',
      '      <button type="button" class="newsletter-gate__btn" data-action="send">Send code</button>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div class="newsletter-step" data-step="2" data-state="locked">',
      '  <div class="newsletter-step__header">',
      '    <div class="newsletter-step__badge">Step 2</div>',
      '    <div>',
      '      <p class="newsletter-step__title">Enter the 4 digits</p>',
      '      <p class="newsletter-step__hint">Check your inbox or spam.</p>',
      '    </div>',
      '  </div>',
      '  <div class="newsletter-step__body" data-body-step="2" hidden>',
      '    <div class="newsletter-gate__row">',
      '      <input type="text" maxlength="4" class="newsletter-gate__input" name="otp" placeholder="Enter 4-digit code" inputmode="numeric" />',
      '      <button type="button" class="newsletter-gate__btn" data-action="verify">Verify email</button>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div class="newsletter-step" data-step="3" data-state="locked">',
      '  <div class="newsletter-step__header">',
      '    <div class="newsletter-step__badge">Step 3</div>',
      '    <div>',
      '      <p class="newsletter-step__title">Finish checkout</p>',
      '      <p class="newsletter-step__hint">Unlocks after email is verified.</p>',
      '    </div>',
      '  </div>',
      '  <div class="newsletter-step__body" data-body-step="3" hidden>',
      '    <p class="newsletter-step__summary">Checkout unlocks automatically once Step 2 is done.</p>',
      '  </div>',
      '</div>',
      '<p class="newsletter-gate__status" aria-live="polite"></p>'
    ].join('');

    // populate the country select after building the HTML
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
      startBtn: wrapper.querySelector('[data-action="start"]'),
      nameInput: wrapper.querySelector('input[name="name"]'),
      countryInput: wrapper.querySelector('input[name="country"], select[name="country"]'),
      emailInput: wrapper.querySelector('input[name="email"]'),
      otpInput: wrapper.querySelector('input[name="otp"]'),
      sendBtn: wrapper.querySelector('[data-action="send"]'),
      verifyBtn: wrapper.querySelector('[data-action="verify"]'),
      otpRow: wrapper.querySelector('[data-body-step="2"]'),
      statusEl: wrapper.querySelector('.newsletter-gate__status'),
      stepBodies: {
        1: wrapper.querySelector('[data-body-step="1"]'),
        2: wrapper.querySelector('[data-body-step="2"]'),
        3: wrapper.querySelector('[data-body-step="3"]')
      },
      steps: wrapper.querySelectorAll('.newsletter-step')
    };
  }

  function setStatus(statusEl, message, tone) {
    statusEl.textContent = message || '';
    statusEl.dataset.tone = tone || '';
  }

  function disableInputs(el, disabled) {
    [el.startBtn, el.nameInput, el.countryInput, el.emailInput, el.otpInput, el.sendBtn, el.verifyBtn].forEach(node => {
      if (node) {
        node.disabled = disabled;
      }
    });
  }

  function setStepState(el, stepNumber, state) {
    const step = el.wrapper.querySelector('.newsletter-step[data-step="' + stepNumber + '"]');
    if (!step) return;
    step.dataset.state = state;
  }

  function revealStepBody(el, stepNumber) {
    const body = el.stepBodies[stepNumber];
    if (body) {
      body.hidden = false;
    }
  }

  function hideStepBody(el, stepNumber) {
    const body = el.stepBodies[stepNumber];
    if (body) {
      body.hidden = true;
    }
  }

  function updateProgress(el, currentStep) {
    if (!el.progressBar) return;
    const percentages = { 0: 12, 1: 33, 2: 66, 3: 100 };
    const percent = percentages[currentStep] || 12;
    el.progressBar.style.width = percent + '%';
    el.progressBar.dataset.step = String(currentStep);
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
      revealStepBody(el, 2);
      setStepState(el, 1, 'completed');
      setStepState(el, 2, 'active');
      updateProgress(el, 2);
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
      disableInputs(el, true);
      return email;
    } catch (err) {
      setStatus(el.statusEl, 'Network error. Please retry.', 'error');
      disableInputs(el, false);
      return false;
    }
  }

  function wireGate(el, onVerified) {
    el.sendBtn.addEventListener('click', async () => {
      const email = await sendOtp(el);
      if (email) {
        el.currentEmail = email;
      }
    });

    el.verifyBtn.addEventListener('click', async () => {
      const email = await verifyOtp(el);
      if (email) {
        el.wrapper.classList.add('newsletter-gate--verified');
        setStepState(el, 2, 'completed');
        setStepState(el, 3, 'active');
        revealStepBody(el, 3);
        updateProgress(el, 3);
        persistVerifiedEmail(email);
        onVerified(email);
      }
    });
  }

  function updateCheckoutButton(checkoutBtn, verifiedEmail) {
    if (!checkoutBtn) return;
    if (verifiedEmail) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Finish checkout';
    } else {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Step 3: checkout (locked)';
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
    checkoutBtn.parentElement.insertBefore(gate.wrapper, checkoutBtn);

    setStepState(gate, 1, 'active');
    hideStepBody(gate, 1);
    hideStepBody(gate, 2);
    hideStepBody(gate, 3);
    updateProgress(gate, 0);

    let verifiedEmail = loadVerifiedEmail();
    if (verifiedEmail) {
      setStatus(gate.statusEl, `Verified as ${verifiedEmail}. You can checkout.`, 'success');
      gate.wrapper.classList.add('newsletter-gate--verified');
      setStepState(gate, 1, 'completed');
      setStepState(gate, 2, 'completed');
      setStepState(gate, 3, 'active');
      revealStepBody(gate, 3);
      updateProgress(gate, 3);
      disableInputs(gate, true);
    }

    updateCheckoutButton(checkoutBtn, verifiedEmail);

    gate.startBtn.addEventListener('click', () => {
      revealStepBody(gate, 1);
      setStepState(gate, 1, 'active');
      updateProgress(gate, verifiedEmail ? 3 : 1);
      gate.nameInput.focus();
    });

    wireGate(gate, (email) => {
      verifiedEmail = email;
      updateCheckoutButton(checkoutBtn, verifiedEmail);
    });

    checkoutBtn.addEventListener('click', async function() {
      if (!verifiedEmail) {
        gate.wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setStatus(gate.statusEl, 'Please verify your newsletter email to continue.', 'error');
        return;
      }

      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Redirecting…';

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
          updateCheckoutButton(checkoutBtn, verifiedEmail);
          return;
        }

        const result = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (result.error) {
          setStatus(gate.statusEl, result.error.message, 'error');
          updateCheckoutButton(checkoutBtn, verifiedEmail);
        }
      } catch (error) {
        console.error('Error:', error);
        setStatus(gate.statusEl, 'An error occurred. Please try again.', 'error');
        updateCheckoutButton(checkoutBtn, verifiedEmail);
      }
    });
  };
})();
