(function() {
  const STORAGE_KEY = 'cps_newsletter_verified';

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
    wrapper.className = 'newsletter-gate';
    wrapper.innerHTML = [
      '<div class="newsletter-gate__header">',
      '  <div class="newsletter-gate__badge">Required</div>',
      '  <div>',
      '    <p class="newsletter-gate__title">Join the newsletter to unlock checkout</p>',
      '    <p class="newsletter-gate__subtitle">We send a 4-digit code to confirm your email before payment.</p>',
      '  </div>',
      '</div>',
      '<div class="newsletter-gate__row">',
      '  <input type="text" class="newsletter-gate__input" name="name" placeholder="Your name" autocomplete="name" />',
      '  <input type="text" class="newsletter-gate__input" name="country" placeholder="Country" autocomplete="country-name" />',
      '</div>',
      '<div class="newsletter-gate__row">',
      '  <input type="email" class="newsletter-gate__input" name="email" placeholder="Email address" autocomplete="email" />',
      '  <button type="button" class="newsletter-gate__btn" data-action="send">Send code</button>',
      '</div>',
      '<div class="newsletter-gate__row" data-otp-row hidden>',
      '  <input type="text" maxlength="4" class="newsletter-gate__input" name="otp" placeholder="Enter 4-digit code" inputmode="numeric" />',
      '  <button type="button" class="newsletter-gate__btn" data-action="verify">Verify email</button>',
      '</div>',
      '<p class="newsletter-gate__status" aria-live="polite"></p>'
    ].join('');

    return {
      wrapper,
      nameInput: wrapper.querySelector('input[name="name"]'),
      countryInput: wrapper.querySelector('input[name="country"]'),
      emailInput: wrapper.querySelector('input[name="email"]'),
      otpInput: wrapper.querySelector('input[name="otp"]'),
      sendBtn: wrapper.querySelector('[data-action="send"]'),
      verifyBtn: wrapper.querySelector('[data-action="verify"]'),
      otpRow: wrapper.querySelector('[data-otp-row]'),
      statusEl: wrapper.querySelector('.newsletter-gate__status')
    };
  }

  function setStatus(statusEl, message, tone) {
    statusEl.textContent = message || '';
    statusEl.dataset.tone = tone || '';
  }

  function disableInputs(el, disabled) {
    [el.nameInput, el.countryInput, el.emailInput, el.otpInput, el.sendBtn, el.verifyBtn].forEach(node => {
      if (node) {
        node.disabled = disabled;
      }
    });
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
      el.otpRow.hidden = false;
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
        persistVerifiedEmail(email);
        onVerified(email);
      }
    });
  }

  function updateCheckoutButton(checkoutBtn, verifiedEmail) {
    if (!checkoutBtn) return;
    if (verifiedEmail) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Get this toolkit';
    } else {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Join newsletter to continue';
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

    let verifiedEmail = loadVerifiedEmail();
    if (verifiedEmail) {
      setStatus(gate.statusEl, `Verified as ${verifiedEmail}. You can checkout.`, 'success');
      gate.wrapper.classList.add('newsletter-gate--verified');
      disableInputs(gate, true);
    }

    updateCheckoutButton(checkoutBtn, verifiedEmail);

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
