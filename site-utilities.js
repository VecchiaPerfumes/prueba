/* ────────────────────────────────────────────────────────────────────── */
/* VECCHIA PERFUMES - UTILITY FUNCTIONS                                  */
/* Comprehensive JavaScript utilities for common functionality           */
/* ────────────────────────────────────────────────────────────────────── */

// ────────────────────────────────────────────────────────────────────
// STORAGE UTILITIES
// ────────────────────────────────────────────────────────────────────

const StorageUtils = {
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  },

  load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  }
};

// ────────────────────────────────────────────────────────────────────
// DOM UTILITIES
// ────────────────────────────────────────────────────────────────────

const DOM = {
  id(id) {
    return document.getElementById(id);
  },

  query(selector, element = document) {
    return element.querySelector(selector);
  },

  queryAll(selector, element = document) {
    return Array.from(element.querySelectorAll(selector));
  },

  create(tag, className = '', innerHTML = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
  },

  addClass(element, className) {
    element && element.classList.add(className);
  },

  removeClass(element, className) {
    element && element.classList.remove(className);
  },

  toggleClass(element, className) {
    element && element.classList.toggle(className);
  },

  hasClass(element, className) {
    return element && element.classList.contains(className);
  },

  setAttr(element, attr, value) {
    element && element.setAttribute(attr, value);
  },

  getAttr(element, attr) {
    return element ? element.getAttribute(attr) : null;
  },

  setText(element, text) {
    if (element) element.textContent = text;
  },

  getText(element) {
    return element ? element.textContent : '';
  }
};

// ────────────────────────────────────────────────────────────────────
// EVENT UTILITIES
// ────────────────────────────────────────────────────────────────────

const Events = {
  on(element, event, callback) {
    element && element.addEventListener(event, callback);
  },

  onAll(selector, event, callback) {
    DOM.queryAll(selector).forEach(el => this.on(el, event, callback));
  },

  off(element, event, callback) {
    element && element.removeEventListener(event, callback);
  },

  trigger(element, eventName, detail = null) {
    element && element.dispatchEvent(new CustomEvent(eventName, { detail }));
  },

  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        func.apply(this, args);
        lastCall = now;
      }
    };
  }
};

// ────────────────────────────────────────────────────────────────────
// ANIMATION UTILITIES
// ────────────────────────────────────────────────────────────────────

const Animations = {
  fadeIn(element, duration = 300) {
    if (!element) return;
    element.style.opacity = '0';
    element.style.display = 'block';
    setTimeout(() => {
      element.style.transition = `opacity ${duration}ms ease`;
      element.style.opacity = '1';
    }, 10);
  },

  fadeOut(element, duration = 300) {
    if (!element) return;
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';
    setTimeout(() => {
      element.style.display = 'none';
    }, duration);
  },

  slideUp(element, duration = 400) {
    if (!element) return;
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    setTimeout(() => {
      element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, 10);
  },

  scrollTo(element, offset = 0) {
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
};

// ────────────────────────────────────────────────────────────────────
// STRING UTILITIES
// ────────────────────────────────────────────────────────────────────

const Strings = {
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  toTitleCase(str) {
    return str.replace(/\w\S*/g, txt => this.capitalize(txt));
  },

  slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  },

  fuzzyMatch(str, pattern) {
    const patternChars = pattern.split('');
    let strIndex = 0;
    let patternIndex = 0;

    while (strIndex < str.length && patternIndex < patternChars.length) {
      if (str[strIndex].toLowerCase() === patternChars[patternIndex].toLowerCase()) {
        patternIndex++;
      }
      strIndex++;
    }
    return patternIndex === patternChars.length;
  }
};

// ────────────────────────────────────────────────────────────────────
// ARRAY UTILITIES
// ────────────────────────────────────────────────────────────────────

const Arrays = {
  remove(array, item) {
    const index = array.indexOf(item);
    if (index > -1) array.splice(index, 1);
    return array;
  },

  toggle(array, item) {
    const index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    } else {
      array.push(item);
    }
    return array;
  },

  random(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
};

// ────────────────────────────────────────────────────────────────────
// NAVBAR UTILITIES
// ────────────────────────────────────────────────────────────────────

const NavbarUtils = {
  initScrollDetection() {
    const nav = DOM.query('nav');
    if (!nav) return;

    window.addEventListener('scroll', Events.throttle(() => {
      if (window.scrollY > 50) {
        DOM.addClass(nav, 'scrolled');
      } else {
        DOM.removeClass(nav, 'scrolled');
      }
    }, 100));
  },

  toggleDrawer() {
    const drawer = DOM.id('drawer');
    const backdrop = DOM.id('drawerBackdrop');
    if (drawer && backdrop) {
      DOM.toggleClass(drawer, 'open');
      DOM.toggleClass(backdrop, 'open');
      if (DOM.hasClass(drawer, 'open')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  },

  closeDrawer() {
    const drawer = DOM.id('drawer');
    const backdrop = DOM.id('drawerBackdrop');
    if (drawer && backdrop) {
      DOM.removeClass(drawer, 'open');
      DOM.removeClass(backdrop, 'open');
      document.body.style.overflow = '';
    }
  }
};

// ────────────────────────────────────────────────────────────────────
// CART & WISHLIST UTILITIES
// ────────────────────────────────────────────────────────────────────

const CartUtils = {
  getCart() {
    return StorageUtils.load('vecchia_cart', []);
  },

  getWishlist() {
    return StorageUtils.load('vecchia_wishlist', []);
  },

  addToCart(product) {
    const cart = this.getCart();
    const exists = cart.find(item => item.id === product.id);

    if (exists) {
      exists.quantity = (exists.quantity || 1) + 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    StorageUtils.save('vecchia_cart', cart);
    Events.trigger(document, 'cart:updated', { cart });
    return cart;
  },

  removeFromCart(productId) {
    const cart = this.getCart();
    const updatedCart = cart.filter(item => item.id !== productId);
    StorageUtils.save('vecchia_cart', updatedCart);
    Events.trigger(document, 'cart:updated', { cart: updatedCart });
    return updatedCart;
  },

  addToWishlist(product) {
    const wishlist = this.getWishlist();
    const exists = wishlist.find(item => item.id === product.id);

    if (!exists) {
      wishlist.push(product);
    }

    StorageUtils.save('vecchia_wishlist', wishlist);
    Events.trigger(document, 'wishlist:updated', { wishlist });
    return wishlist;
  },

  removeFromWishlist(productId) {
    const wishlist = this.getWishlist();
    const updatedWishlist = wishlist.filter(item => item.id !== productId);
    StorageUtils.save('vecchia_wishlist', updatedWishlist);
    Events.trigger(document, 'wishlist:updated', { wishlist: updatedWishlist });
    return updatedWishlist;
  },

  toggleWishlist(product) {
    const wishlist = this.getWishlist();
    const exists = wishlist.find(item => item.id === product.id);

    if (exists) {
      return this.removeFromWishlist(product.id);
    } else {
      return this.addToWishlist(product);
    }
  },

  updateCartBadge() {
    const cart = this.getCart();
    const badge = DOM.id('cartBadge');
    if (badge) {
      const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      DOM.setText(badge, count.toString());
      if (count > 0) {
        DOM.addClass(badge, 'show');
      } else {
        DOM.removeClass(badge, 'show');
      }
    }
  },

  updateWishlistBadge() {
    const wishlist = this.getWishlist();
    const badge = DOM.id('wishlistBadge');
    if (badge) {
      DOM.setText(badge, wishlist.length.toString());
      if (wishlist.length > 0) {
        DOM.addClass(badge, 'show');
      } else {
        DOM.removeClass(badge, 'show');
      }
    }
  },

  getCartTotal() {
    const cart = this.getCart();
    return cart.reduce((total, item) => {
      const price = parseFloat(item.precio || item.price || 0);
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  }
};

// ────────────────────────────────────────────────────────────────────
// NOTIFICATION/TOAST UTILITIES
// ────────────────────────────────────────────────────────────────────

const Toast = {
  show(message, type = 'info', duration = 3000) {
    const toast = DOM.create('div', 'toast toast-' + type, message);
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      max-width: 400px;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      Animations.fadeOut(toast, 300);
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  },

  error(message, duration = 3000) {
    this.show(message, 'error', duration);
  },

  warning(message, duration = 3000) {
    this.show(message, 'warning', duration);
  }
};

// ────────────────────────────────────────────────────────────────────
// SCROLL OBSERVER UTILITIES
// ────────────────────────────────────────────────────────────────────

const ScrollUtils = {
  observeVisibility(element, callback, options = {}) {
    const defaultOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
      ...options
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    }, defaultOptions);

    if (element) {
      observer.observe(element);
    }

    return observer;
  },

  observeMultiple(selector, callback, options = {}) {
    const elements = DOM.queryAll(selector);
    return elements.map(el => this.observeVisibility(el, callback, options));
  }
};

// ────────────────────────────────────────────────────────────────────
// FORM UTILITIES
// ────────────────────────────────────────────────────────────────────

const FormUtils = {
  getData(form) {
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  },

  clear(form) {
    form && form.reset();
  },

  validate(form, rules = {}) {
    const data = this.getData(form);
    const errors = {};

    for (const [field, value] of Object.entries(data)) {
      if (rules[field]) {
        if (rules[field].required && !value) {
          errors[field] = 'Este campo es requerido';
        }
        if (rules[field].email && value && !value.includes('@')) {
          errors[field] = 'Email inválido';
        }
        if (rules[field].minLength && value.length < rules[field].minLength) {
          errors[field] = `Mínimo ${rules[field].minLength} caracteres`;
        }
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }
};

// ────────────────────────────────────────────────────────────────────
// API WRAPPER
// ────────────────────────────────────────────────────────────────────

const API = {
  fetch(url, options = {}) {
    return fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .catch(error => {
        console.error('API Error:', error);
        throw error;
      });
  },

  get(url, options = {}) {
    return this.fetch(url, { method: 'GET', ...options });
  },

  post(url, data, options = {}) {
    return this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  },

  put(url, data, options = {}) {
    return this.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  },

  delete(url, options = {}) {
    return this.fetch(url, { method: 'DELETE', ...options });
  }
};

// ────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ────────────────────────────────────────────────────────────────────

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navbar scroll detection
  NavbarUtils.initScrollDetection();

  // Initialize cart and wishlist badges
  CartUtils.updateCartBadge();
  CartUtils.updateWishlistBadge();

  // Listen for cart/wishlist updates
  document.addEventListener('cart:updated', () => {
    CartUtils.updateCartBadge();
  });

  document.addEventListener('wishlist:updated', () => {
    CartUtils.updateWishlistBadge();
  });

  // Setup menu button
  const menuBtn = DOM.id('menuBtn');
  const closeMenu = DOM.id('closeMenu');
  const menuOverlay = DOM.id('menuOverlay');

  if (menuBtn && closeMenu) {
    Events.on(menuBtn, 'click', () => {
      const sideMenu = DOM.id('sideMenu');
      if (sideMenu) {
        DOM.toggleClass(sideMenu, 'open');
        DOM.toggleClass(menuOverlay, 'open');
        document.body.style.overflow = DOM.hasClass(sideMenu, 'open') ? 'hidden' : '';
      }
    });

    Events.on(closeMenu, 'click', () => {
      const sideMenu = DOM.id('sideMenu');
      if (sideMenu) {
        DOM.removeClass(sideMenu, 'open');
        DOM.removeClass(menuOverlay, 'open');
        document.body.style.overflow = '';
      }
    });

    if (menuOverlay) {
      Events.on(menuOverlay, 'click', () => {
        const sideMenu = DOM.id('sideMenu');
        if (sideMenu) {
          DOM.removeClass(sideMenu, 'open');
          DOM.removeClass(menuOverlay, 'open');
          document.body.style.overflow = '';
        }
      });
    }
  }

  // Setup scroll-to-top button
  const topBtn = DOM.id('topBtn');
  if (topBtn) {
    window.addEventListener('scroll', Events.throttle(() => {
      if (window.scrollY > 300) {
        DOM.addClass(topBtn, 'show');
      } else {
        DOM.removeClass(topBtn, 'show');
      }
    }, 100));

    Events.on(topBtn, 'click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Setup drawer
  const cartOpen = DOM.id('cartOpen');
  const wishlistOpen = DOM.id('wishlistOpen');
  const drawerClose = DOM.id('drawerClose');
  const drawerBackdrop = DOM.id('drawerBackdrop');

  if (cartOpen) {
    Events.on(cartOpen, 'click', () => {
      NavbarUtils.toggleDrawer();
      const tabCart = DOM.id('tabCart');
      if (tabCart) tabCart.click();
    });
  }

  if (wishlistOpen) {
    Events.on(wishlistOpen, 'click', () => {
      NavbarUtils.toggleDrawer();
      const tabWishlist = DOM.id('tabWishlist');
      if (tabWishlist) tabWishlist.click();
    });
  }

  if (drawerClose) {
    Events.on(drawerClose, 'click', NavbarUtils.closeDrawer);
  }

  if (drawerBackdrop) {
    Events.on(drawerBackdrop, 'click', NavbarUtils.closeDrawer);
  }

  // Close menu when clicking menu links
  const sideMenuLinks = DOM.queryAll('#sideMenu a');
  sideMenuLinks.forEach(link => {
    Events.on(link, 'click', () => {
      const sideMenu = DOM.id('sideMenu');
      if (sideMenu) {
        DOM.removeClass(sideMenu, 'open');
        DOM.removeClass(menuOverlay, 'open');
        document.body.style.overflow = '';
      }
    });
  });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    StorageUtils,
    DOM,
    Events,
    Animations,
    Strings,
    Arrays,
    NavbarUtils,
    CartUtils,
    Toast,
    ScrollUtils,
    FormUtils,
    API
  };
}
