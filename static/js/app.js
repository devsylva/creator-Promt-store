// ========================================
// MEDIA CONFIGURATION
// ========================================
// Edit these URLs to show actual images/videos instead of placeholders

const MEDIA = {
  heroImage: "",
  demoVideoEmbed: "https://www.youtube.com/embed/ULzbJ5y8UcY?rel=0&modestbranding=1",
  demoVideoFile: "",
  demoVideoThumbnail: "",
  toolkitImage: "https://rvosqmvsgmcuaujkphhr.supabase.co/storage/v1/object/public/SUITCASE/IMAGE%20SUITCASE/79eeff69-d4ff-4348-a66f-2ca38c1a88bc_4096x3058.png",
  toolkitVideo: "https://rvosqmvsgmcuaujkphhr.supabase.co/storage/v1/object/public/SUITCASE/VIDEO%20SUITCASE/93421556-a729-4468-b70d-b91742c681e0_4096x3058.png",
  toolkitChat: "https://rvosqmvsgmcuaujkphhr.supabase.co/storage/v1/object/public/SUITCASE/CHATBOT%20SUITCASE/582a0261-c65f-4789-9d29-9d261aea7cca_4096x3058.png"
};

// ========================================
// CONFIG INJECTION
// ========================================
// This reads from SITE_CONFIG and populates the DOM

document.addEventListener('DOMContentLoaded', function() {

  // Check if config is available
  if (typeof SITE_CONFIG === 'undefined') {
    console.warn('SITE_CONFIG not found. Make sure config.js is loaded before app.js');
    return;
  }

  // Inject brand name
  const brandElement = document.querySelector('[data-brand]');
  if (brandElement) {
    brandElement.textContent = SITE_CONFIG.brandName;
  }

  // Inject navigation
  const navContainer = document.querySelector('[data-nav]');
  if (navContainer) {
    const navLinks = SITE_CONFIG.nav.map(item =>
      `<li><a href="${item.href}">${item.label}</a></li>`
    ).join('');
    const mobileCta = `<li class="mobile-nav-cta"><a href="#toolkits" class="btn btn-primary">Browse toolkits</a></li>`;
    navContainer.innerHTML = navLinks + mobileCta;
  }

  // Inject hero section (index.html)
  const heroHeadline = document.querySelector('[data-hero-headline]');
  const heroSubtext = document.querySelector('[data-hero-subtext]');
  const heroPrimaryCta = document.querySelector('[data-hero-primary-cta]');
  const heroSecondaryCta = document.querySelector('[data-hero-secondary-cta]');

  if (heroHeadline) heroHeadline.textContent = SITE_CONFIG.hero.headline;
  if (heroSubtext) heroSubtext.textContent = SITE_CONFIG.hero.subtext;
  if (heroPrimaryCta) {
    heroPrimaryCta.textContent = SITE_CONFIG.hero.primaryCtaLabel;
    heroPrimaryCta.href = SITE_CONFIG.hero.primaryCtaHref;
  }
  if (heroSecondaryCta) {
    heroSecondaryCta.textContent = SITE_CONFIG.hero.secondaryCtaLabel;
    heroSecondaryCta.href = SITE_CONFIG.hero.secondaryCtaHref;
  }

  // Inject toolkit cards
  const toolkitCardsContainer = document.querySelector('[data-toolkit-cards]');
  if (toolkitCardsContainer) {
    toolkitCardsContainer.innerHTML = SITE_CONFIG.toolkits.map(toolkit => `
      <article class="toolkit-card">
        <div class="floating" style="position: relative; margin-bottom: 28px;">
          <div class="media-slot" data-media="toolkit-${toolkit.type}"></div>
          <div class="spotlight spotlight--card"></div>
        </div>
        <h3>${toolkit.title}</h3>
        <p class="muted">${toolkit.description}</p>
        <a class="btn btn-pill" href="${toolkit.ctaHref}">${toolkit.ctaLabel}</a>
      </article>
    `).join('');

    // Render media for toolkit cards
    renderMediaSlot('toolkit-image', MEDIA.toolkitImage, 'card');
    renderMediaSlot('toolkit-video', MEDIA.toolkitVideo, 'card');
    renderMediaSlot('toolkit-chat', MEDIA.toolkitChat, 'card');
  }

  // Inject demo section
  const demoTitle = document.querySelector('[data-demo-title]');
  const demoSubtext = document.querySelector('[data-demo-subtext]');
  const demoCta = document.querySelector('[data-demo-cta]');

  if (demoTitle) demoTitle.textContent = SITE_CONFIG.demo.sectionTitle;

  const resultsGallery = document.querySelector('[data-results-gallery]');
  if (resultsGallery && SITE_CONFIG.userResults) {
    resultsGallery.innerHTML = SITE_CONFIG.userResults.map(item => {
      const isVideo = item.type === 'video';
      return `
      <div class="result-card has-media${isVideo ? ' is-video' : ''}" tabindex="0" data-result-id="${item.id}" data-type="${item.type}">
        ${isVideo ? `
          <video src="${item.url}" muted loop playsinline preload="metadata"></video>
        ` : `
          <img src="${item.url}" alt="${item.label}" loading="lazy" />
        `}
        <span class="result-card-label">${item.label}</span>
      </div>
    `}).join('');

    initGalleryVideoHover();
  }

  // Render media slots
  renderMediaSlot('hero', MEDIA.heroImage, 'hero');
  renderMediaSlot('demo', MEDIA.demoVideoEmbed || MEDIA.demoVideoFile, 'demo');

  // Inject toolkits page content
  const toolkitsPageTitle = document.querySelector('[data-toolkits-title]');
  const toolkitsPageSubtext = document.querySelector('[data-toolkits-subtext]');
  const toolkitsPageCta = document.querySelector('[data-toolkits-cta]');

  if (toolkitsPageTitle) toolkitsPageTitle.textContent = SITE_CONFIG.toolkitsPage.sectionTitle;
  if (toolkitsPageSubtext) toolkitsPageSubtext.textContent = SITE_CONFIG.toolkitsPage.sectionSubtext;
  if (toolkitsPageCta) {
    toolkitsPageCta.textContent = SITE_CONFIG.toolkitsPage.ctaLabel;
    toolkitsPageCta.href = SITE_CONFIG.toolkitsPage.ctaHref;
  }

});

// ========================================
// MEDIA SLOT RENDERING
// ========================================

function renderMediaSlot(slotName, mediaUrl, type) {
  const slot = document.querySelector(`[data-media="${slotName}"]`);
  if (!slot) return;

  // If no media URL, show placeholder
  if (!mediaUrl || mediaUrl.trim() === '') {
    renderPlaceholder(slot, type, slotName);
    return;
  }

  // Determine media type and render accordingly
  if (slotName === 'demo' && isValidUrl(mediaUrl)) {
    // Check if it's a video embed URL (YouTube, Vimeo, etc.)
    if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') ||
        mediaUrl.includes('vimeo.com') || mediaUrl.includes('embed')) {
      renderVideoEmbed(slot, mediaUrl);
    } else if (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.endsWith('.ogg')) {
      renderVideoFile(slot, mediaUrl);
    } else {
      renderPlaceholder(slot, type, slotName);
    }
  } else if (isValidUrl(mediaUrl) || mediaUrl.startsWith('/')) {
    // Assume it's an image
    renderImage(slot, mediaUrl, type);
  } else {
    renderPlaceholder(slot, type, slotName);
  }
}

function renderPlaceholder(slot, type, slotName) {
  const labels = {
    'hero': 'MEDIA SLOT',
    'demo': 'VIDEO SLOT',
    'toolkit-image': 'IMAGE',
    'toolkit-video': 'VIDEO',
    'toolkit-chat': 'CHAT'
  };

  slot.innerHTML = `
    <div class="media-placeholder--${type}">
      <span class="placeholder-label">${labels[slotName] || 'MEDIA'}</span>
    </div>
  `;
}

function renderImage(slot, imageUrl, type) {
  const borderRadius = type === 'hero' ? '32px' : type === 'demo' ? '28px' : '24px';
  const shadow = type === 'card' ? '' : 'box-shadow: 0 24px 70px rgba(0,0,0,0.10), 0 10px 28px rgba(0,0,0,0.06);';
  slot.innerHTML = `
    <img
      src="${imageUrl}"
      alt="Media"
      style="border-radius: ${borderRadius}; ${shadow}"
    />
  `;
}

function renderVideoEmbed(slot, embedUrl) {
  const thumbnailUrl = MEDIA.demoVideoThumbnail || getYouTubeThumbnail(embedUrl);

  if (thumbnailUrl) {
    slot.innerHTML = `
      <div class="video-thumbnail-wrapper" style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 28px; box-shadow: 0 24px 70px rgba(0,0,0,0.10), 0 10px 28px rgba(0,0,0,0.06); cursor: pointer;">
        <img src="${thumbnailUrl}" alt="Video thumbnail" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 28px;" />
        <div class="video-play-button" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px; background: rgba(0, 0, 0, 0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease, background 0.2s ease;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z" fill="white"/>
          </svg>
        </div>
      </div>
    `;

    const wrapper = slot.querySelector('.video-thumbnail-wrapper');
    const playBtn = slot.querySelector('.video-play-button');

    wrapper.addEventListener('mouseenter', () => {
      playBtn.style.transform = 'translate(-50%, -50%) scale(1.1)';
      playBtn.style.background = 'rgba(0, 0, 0, 0.85)';
    });

    wrapper.addEventListener('mouseleave', () => {
      playBtn.style.transform = 'translate(-50%, -50%) scale(1)';
      playBtn.style.background = 'rgba(0, 0, 0, 0.7)';
    });

    wrapper.addEventListener('click', () => {
      const floatingParent = slot.closest('.floating');
      if (floatingParent) {
        floatingParent.classList.remove('floating');
      }

      const autoplayUrl = embedUrl.includes('?') ? embedUrl + '&autoplay=1' : embedUrl + '?autoplay=1';
      slot.innerHTML = `
        <div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 28px; box-shadow: 0 24px 70px rgba(0,0,0,0.10), 0 10px 28px rgba(0,0,0,0.06);">
          <iframe
            src="${autoplayUrl}"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 28px; border: none;"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        </div>
      `;
    });
  } else {
    slot.innerHTML = `
      <div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 28px; box-shadow: 0 24px 70px rgba(0,0,0,0.10), 0 10px 28px rgba(0,0,0,0.06);">
        <iframe
          src="${embedUrl}"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 28px; border: none;"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          loading="lazy">
        </iframe>
      </div>
    `;
  }
}

function getYouTubeThumbnail(embedUrl) {
  const match = embedUrl.match(/youtube\.com\/embed\/([^?&]+)/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
  }
  return null;
}

function renderVideoFile(slot, videoUrl) {
  slot.innerHTML = `
    <video
      controls
      preload="metadata"
      style="width: 100%; border-radius: 28px; box-shadow: 0 24px 70px rgba(0,0,0,0.10), 0 10px 28px rgba(0,0,0,0.06);"
    >
      <source src="${videoUrl}" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  `;

  const video = slot.querySelector('video');
  if (video) {
    video.addEventListener('play', () => {
      const floatingParent = slot.closest('.floating');
      if (floatingParent) {
        floatingParent.classList.remove('floating');
      }
    }, { once: true });
  }
}

// Helper function to validate URL (only allow http/https)
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// ========================================
// SCROLL REVEAL WITH INTERSECTION OBSERVER
// ========================================

document.addEventListener('DOMContentLoaded', function() {

  const revealElements = document.querySelectorAll('.reveal');

  const observerOptions = {
    root: null,
    threshold: 0.15,
    rootMargin: '0px'
  };

  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  revealElements.forEach(element => {
    observer.observe(element);
  });

});

// ========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================

document.addEventListener('DOMContentLoaded', function() {

  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      if (href === '#' || href === '#about' || href === '#contact') {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else if (href.startsWith('#') && href.length > 1) {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

});

// ========================================
// STICKY NAV SCROLL DETECTION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  let lastScroll = 0;
  const scrollThreshold = 50;

  function handleScroll() {
    const currentScroll = window.scrollY;

    if (currentScroll > scrollThreshold) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }

    lastScroll = currentScroll;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

// ========================================
// 3D TILT EFFECT FOR TOOLKIT CARDS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('.toolkit-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', function() {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
});

// ========================================
// MAGNETIC BUTTON EFFECT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const magneticButtons = document.querySelectorAll('.btn-primary, .nav-cta');

  magneticButtons.forEach(button => {
    button.addEventListener('mousemove', function(e) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const moveX = x * 0.1;
      const moveY = y * 0.1;

      button.style.transform = `translate(${moveX}px, ${moveY}px) translateY(-2px) scale(1.02)`;
    });

    button.addEventListener('mouseleave', function() {
      button.style.transform = '';
    });
  });
});

// ========================================
// MOBILE HAMBURGER MENU
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const overlay = document.querySelector('.nav-overlay');

  if (!hamburger || !navLinks) return;

  function openMenu() {
    hamburger.classList.add('is-active');
    hamburger.setAttribute('aria-expanded', 'true');
    navLinks.classList.add('is-open');
    if (overlay) overlay.classList.add('is-visible');
    document.body.classList.add('menu-open');
  }

  function closeMenu() {
    hamburger.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-visible');
    document.body.classList.remove('menu-open');
  }

  function toggleMenu() {
    if (navLinks.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  hamburger.addEventListener('click', toggleMenu);

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  navLinks.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') {
      closeMenu();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
      closeMenu();
    }
  });

  window.addEventListener('resize', function() {
    if (window.innerWidth > 768 && navLinks.classList.contains('is-open')) {
      closeMenu();
    }
  });
});

function initGalleryVideoHover() {
  const videoCards = document.querySelectorAll('.result-card.is-video');

  videoCards.forEach(card => {
    const video = card.querySelector('video');
    if (!video) return;

    card.addEventListener('mouseenter', () => {
      video.play().catch(() => {});
    });

    card.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });

    card.addEventListener('focus', () => {
      video.play().catch(() => {});
    });

    card.addEventListener('blur', () => {
      video.pause();
      video.currentTime = 0;
    });
  });
}
