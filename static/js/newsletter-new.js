const state = {
  currentStep: 1,
  name: '',
  country: '',
  email: ''
};

function showStep(stepNumber) {
  const steps = document.querySelectorAll('.step');
  steps.forEach(step => {
    step.classList.remove('active');
    if (parseInt(step.dataset.step) === stepNumber) {
      step.classList.add('active');
    }
  });
  state.currentStep = stepNumber;
}

function validateName(name) {
  return name.trim().length >= 2;
}

function validateCountry(country) {
  return country.trim().length >= 2;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function clearError(errorElement) {
  errorElement.textContent = '';
}

function showError(errorElement, message) {
  errorElement.textContent = message;
}

function clearOtpBoxes() {
  const otpBoxes = document.querySelectorAll('.otp-box');
  otpBoxes.forEach(box => {
    box.value = '';
  });
}

function getOtpValue() {
  const otpBoxes = document.querySelectorAll('.otp-box');
  return Array.from(otpBoxes).map(box => box.value).join('');
}

function showOtpView() {
  const emailView = document.getElementById('emailView');
  const otpView = document.getElementById('otpView');
  const successView = document.getElementById('successView');
  const emailDisplay = document.getElementById('emailDisplay');
  const otpError = document.getElementById('otpError');
  const otpBoxes = document.querySelectorAll('.otp-box');
  const resendMessage = document.getElementById('resendMessage');

  emailView.classList.add('hidden');
  otpView.classList.remove('hidden');
  successView.classList.add('hidden');
  emailDisplay.textContent = state.email;
  clearOtpBoxes();
  clearError(otpError);
  resendMessage.classList.add('hidden');
  otpBoxes[0].focus();

  const emailBtn = document.getElementById('emailBtn');
  emailBtn.disabled = false;
  emailBtn.textContent = 'Continue';
}

function showEmailView() {
  const emailView = document.getElementById('emailView');
  const otpView = document.getElementById('otpView');
  const successView = document.getElementById('successView');
  const emailInput = document.getElementById('emailInput');

  emailView.classList.remove('hidden');
  otpView.classList.add('hidden');
  successView.classList.add('hidden');
  emailInput.focus();
}

function showSuccessView() {
  const emailView = document.getElementById('emailView');
  const otpView = document.getElementById('otpView');
  const successView = document.getElementById('successView');
  const welcomeName = document.getElementById('welcomeName');

  emailView.classList.add('hidden');
  otpView.classList.add('hidden');
  successView.classList.remove('hidden');
  welcomeName.textContent = state.name;
}

document.addEventListener('DOMContentLoaded', () => {
  // Name step
  const nameBtn = document.getElementById('nameBtn');
  const nameInput = document.getElementById('nameInput');
  const nameError = document.getElementById('nameError');

  nameBtn.addEventListener('click', () => {
    const name = nameInput.value;
    clearError(nameError);

    if (!validateName(name)) {
      showError(nameError, 'Please enter at least 2 characters.');
      return;
    }

    state.name = name.trim();
    showStep(2);
  });

  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      nameBtn.click();
    }
  });

  // Country step
  const countryBtn = document.getElementById('countryBtn');
  const countryInput = document.getElementById('countryInput');
  const countryError = document.getElementById('countryError');

  countryBtn.addEventListener('click', () => {
    const country = countryInput.value;
    clearError(countryError);

    if (!validateCountry(country)) {
      showError(countryError, 'Please enter at least 2 characters.');
      return;
    }

    state.country = country.trim();
    showStep(3);
  });

  countryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      countryBtn.click();
    }
  });

  // Email step
  const emailBtn = document.getElementById('emailBtn');
  const emailInput = document.getElementById('emailInput');
  const emailError = document.getElementById('emailError');

  emailBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    clearError(emailError);

    if (!validateEmail(email)) {
      showError(emailError, 'Please enter a valid email address.');
      return;
    }

    state.email = email.trim();
    
    // Disable button during submission
    emailBtn.disabled = true;
    emailBtn.textContent = 'Sending...';

    try {
      // Call API to send OTP
      const response = await fetch('/api/newsletter-signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          country: state.country
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showError(emailError, data.error || 'Failed to send OTP');
        emailBtn.disabled = false;
        emailBtn.textContent = 'Continue';
        return;
      }

      showOtpView();
    } catch (error) {
      showError(emailError, 'Network error. Please try again.');
      emailBtn.disabled = false;
      emailBtn.textContent = 'Continue';
    }
  });

  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      emailBtn.click();
    }
  });

  // OTP boxes
  const otpBoxes = document.querySelectorAll('.otp-box');

  otpBoxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
      const value = e.target.value;

      if (!/^\d*$/.test(value)) {
        box.value = '';
        return;
      }

      if (value.length === 1 && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        otpBoxes[index - 1].focus();
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text');
      const digits = pasteData.replace(/\D/g, '').slice(0, 4);

      digits.split('').forEach((digit, i) => {
        if (otpBoxes[i]) {
          otpBoxes[i].value = digit;
        }
      });

      const lastIndex = Math.min(digits.length, otpBoxes.length) - 1;
      if (lastIndex >= 0) {
        otpBoxes[lastIndex].focus();
      }
    });
  });

  // Verify OTP
  const verifyBtn = document.getElementById('verifyBtn');
  const otpError = document.getElementById('otpError');

  verifyBtn.addEventListener('click', async () => {
    const otp = getOtpValue();
    clearError(otpError);

    if (otp.length !== 4) {
      showError(otpError, 'Please enter all 4 digits.');
      return;
    }

    // Disable button during verification
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    try {
      // Call API to verify OTP
      const response = await fetch('/api/newsletter-verify-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: state.email,
          otp: otp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showError(otpError, data.error || 'Invalid OTP');
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify';
        return;
      }

      // OTP verified successfully
      showSuccessView();
    } catch (error) {
      showError(otpError, 'Network error. Please try again.');
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify';
    }
  });

  // Resend link
  const resendLink = document.getElementById('resendLink');
  const resendMessage = document.getElementById('resendMessage');

  resendLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    try {
      // Call API to resend OTP
      const response = await fetch('/api/newsletter-signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          country: state.country
        })
      });

      const data = await response.json();

      if (response.ok) {
        resendMessage.classList.remove('hidden');
        setTimeout(() => {
          resendMessage.classList.add('hidden');
        }, 3000);
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
    }
  });

  // Change email link
  const changeEmailLink = document.getElementById('changeEmailLink');

  changeEmailLink.addEventListener('click', (e) => {
    e.preventDefault();
    showEmailView();
  });

  // Back links
  const backLinks = document.querySelectorAll('.back-link[data-back]');

  backLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetStep = parseInt(link.dataset.back);
      showStep(targetStep);
    });
  });

  // Initialize
  showStep(1);
  nameInput.focus();
});
