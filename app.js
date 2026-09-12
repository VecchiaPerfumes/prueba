/* ═══════════════════════════════════════════════════════════════════
   VECCHIA PERFUMES — app.js
   Motor único: estado, carrito, favoritos, buscador, filtros y UI.
   Sin dependencias externas.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Configuración ────────────────────────────────────────────────
  var CFG = {
    whatsapp: '582735527411',
    currency: 'USD',
    symbol: '$',
    brandName: 'VECCHIA PERFUMES',
    keys: { cart: 'vecchia.cart.v2', wish: 'vecchia.wishlist.v2' },
    legacy: { cart: 'vecchia_cart', wish: 'vecchia_wishlist' }
  };

  var PRODUCTS = window.VECCHIA_PRODUCTS || [];
  var BY_ID = {};
  PRODUCTS.forEach(function (p) { BY_ID[p.id] = p; });

  // ── Utilidades ───────────────────────────────────────────────────
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] === null || attrs[k] === undefined) continue;
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Dinero en céntimos enteros: evita por completo los errores de coma
     flotante (0.1 + 0.2). Toda la aritmética del carrito usa enteros. */
  function toCents(v) { return Math.round(Number(v || 0) * 100); }
  function money(cents) {
    var n = (Number(cents || 0) / 100);
    var s = n.toFixed(n % 1 === 0 ? 0 : 2);
    return CFG.symbol + s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function norm(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function debounce(fn, ms) {
    var t; return function () {
      var a = arguments, c = this;
      clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 180);
    };
  }

  function waLink(text) {
    return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(text);
  }

  // ── Almacenamiento resistente a fallos ───────────────────────────
  var mem = {};
  var Store = {
    read: function (k, fallback) {
      try {
        var raw = localStorage.getItem(k);
        return raw ? JSON.parse(raw) : (mem[k] !== undefined ? mem[k] : fallback);
      } catch (e) { return mem[k] !== undefined ? mem[k] : fallback; }
    },
    write: function (k, v) {
      mem[k] = v;
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ }
    }
  };

  // ── Estado ───────────────────────────────────────────────────────
  var State = {
    cart: [],   // [{id, qty}]
    wish: []    // [id]
  };

  function sanitizeCart(raw) {
    if (!Array.isArray(raw)) return [];
    var seen = {}, out = [];
    raw.forEach(function (it) {
      var id = it && (it.id || it.productId);
      if (!id || !BY_ID[id]) return;              // descarta productos inexistentes
      var q = Math.max(1, Math.min(99, parseInt(it.qty || it.quantity || 1, 10) || 1));
      if (seen[id]) { seen[id].qty = Math.min(99, seen[id].qty + q); return; }  // fusiona duplicados
      seen[id] = { id: id, qty: q };
      out.push(seen[id]);
    });
    return out;
  }

  function sanitizeWish(raw) {
    if (!Array.isArray(raw)) return [];
    var out = [];
    raw.forEach(function (it) {
      var id = typeof it === 'string' ? it : (it && it.id);
      if (id && BY_ID[id] && out.indexOf(id) === -1) out.push(id);
    });
    return out;
  }

  function migrateLegacy() {
    // Recupera carrito/favoritos de la versión anterior del sitio
    ['cart', 'wish'].forEach(function (which) {
      if (localStorage.getItem(CFG.keys[which])) return;
      var old = Store.read(CFG.legacy[which], null);
      if (!Array.isArray(old) || !old.length) return;
      var mapped = old.map(function (o) {
        var name = norm(o && (o.name || o.nombre) || '');
        var hit = PRODUCTS.filter(function (p) {
          var pn = norm(p.name);
          return pn === name || pn.indexOf(name) === 0 || name.indexOf(pn) === 0;
        })[0];
        return hit ? (which === 'cart' ? { id: hit.id, qty: 1 } : hit.id) : null;
      }).filter(Boolean);
      if (mapped.length) Store.write(CFG.keys[which], mapped);
    });
  }

  function loadState() {
    migrateLegacy();
    State.cart = sanitizeCart(Store.read(CFG.keys.cart, []));
    State.wish = sanitizeWish(Store.read(CFG.keys.wish, []));
  }
  function saveCart() { Store.write(CFG.keys.cart, State.cart); emit(); }
  function saveWish() { Store.write(CFG.keys.wish, State.wish); emit(); }
  function emit() { document.dispatchEvent(new CustomEvent('vecchia:change')); }

  // ── Carrito ──────────────────────────────────────────────────────
  var Cart = {
    line: function (id) {
      for (var i = 0; i < State.cart.length; i++) if (State.cart[i].id === id) return State.cart[i];
      return null;
    },
    qtyOf: function (id) { var l = Cart.line(id); return l ? l.qty : 0; },
    count: function () {
      return State.cart.reduce(function (n, l) { return n + l.qty; }, 0);
    },
    subtotalCents: function () {
      return State.cart.reduce(function (sum, l) {
        var p = BY_ID[l.id];
        return sum + (p ? toCents(p.price) * l.qty : 0);
      }, 0);
    },
    totalCents: function () { return Cart.subtotalCents(); },  // sin recargos definidos
    add: function (id, qty) {
      var p = BY_ID[id];
      if (!p) return false;
      if (p.soldOut) { Toast.show('Sin stock — consúltanos por WhatsApp'); return false; }
      qty = Math.max(1, parseInt(qty || 1, 10) || 1);
      var l = Cart.line(id);
      if (l) l.qty = Math.min(99, l.qty + qty);
      else State.cart.push({ id: id, qty: Math.min(99, qty) });
      saveCart();
      Toast.show('Añadido al pedido · ' + p.name, 'check');
      return true;
    },
    setQty: function (id, qty) {
      qty = parseInt(qty, 10);
      if (isNaN(qty) || qty < 1) return Cart.remove(id);
      var l = Cart.line(id);
      if (l) { l.qty = Math.min(99, qty); saveCart(); }
    },
    remove: function (id) {
      State.cart = State.cart.filter(function (l) { return l.id !== id; });
      saveCart();
    },
    clear: function () { State.cart = []; saveCart(); },
    detailed: function () {
      return State.cart.map(function (l) {
        var p = BY_ID[l.id];
        return { product: p, qty: l.qty, lineCents: toCents(p.price) * l.qty };
      }).filter(function (x) { return x.product; });
    }
  };


  /* ═══════════════════════════════════════════════════════════════
     TASA USD → Bs
     Conserva la integración original (api.exchangerate.host) y le añade
     una fuente venezolana, caché con fecha y override manual.
     Regla de oro: si no hay una tasa válida NO se muestra nada en Bs.
     Nunca se pinta NaN, undefined, 0 ni "Tasa no configurada".
     ═══════════════════════════════════════════════════════════════ */
  var Rate = {
    KEY: 'vecchia.rate.v1',

    /* ── AJUSTE MANUAL ──────────────────────────────────────────────
       Escribe aquí la tasa (por ejemplo 234.56) y mandará sobre las APIs.
       Déjalo en null para que el sitio la busque solo.                */
    manual: null,

    /* Fuentes en orden. La primera que devuelva un número válido gana. */
    sources: [
      { url: 'https://ve.dolarapi.com/v1/dolares/oficial',
        pick: function (d) { return d && (d.promedio || d.valor); }, name: 'BCV' },
      { url: 'https://api.exchangerate.host/latest?base=USD&symbols=VES',
        pick: function (d) { return d && d.rates && d.rates.VES; }, name: 'exchangerate.host' },
      { url: 'https://api.exchangerate.host/convert?from=USD&to=VES',
        pick: function (d) { return d && d.result; }, name: 'exchangerate.host' }
    ],

    state: null,

    valid: function (n) {
      n = Number(n);
      // Descarta NaN, Infinity, cero, negativos y valores absurdos
      return isFinite(n) && n > 0 && n < 1e7 ? n : null;
    },

    load: function () {
      var m = Rate.valid(Rate.manual);
      if (m) { Rate.state = { value: m, updatedAt: null, source: 'manual' }; return; }
      var c = Store.read(Rate.KEY, null);
      if (c && Rate.valid(c.value)) Rate.state = c;
    },

    set: function (value, source) {
      var v = Rate.valid(value);
      if (!v) return false;
      Rate.state = { value: v, updatedAt: new Date().toISOString(), source: source || 'auto' };
      Store.write(Rate.KEY, Rate.state);
      document.dispatchEvent(new CustomEvent('vecchia:rate'));
      return true;
    },

    /* Consulta las fuentes en segundo plano. Si todas fallan no pasa nada:
       se sigue usando la última tasa buena guardada. */
    refresh: function () {
      if (Rate.valid(Rate.manual)) return;          // manual manda: no consultar
      if (!window.fetch) return;
      var i = 0;
      (function next() {
        if (i >= Rate.sources.length) return;
        var src = Rate.sources[i++];
        var ctl = window.AbortController ? new AbortController() : null;
        var to = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
        fetch(src.url, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
          .then(function (r) { return r.ok ? r.json() : Promise.reject(0); })
          .then(function (d) {
            clearTimeout(to);
            if (!Rate.set(src.pick(d), src.name)) next();
          })
          .catch(function () { clearTimeout(to); next(); });
      })();
    },

    value: function () { return Rate.state ? Rate.state.value : null; },

    /* Bs con formato venezolano. Devuelve '' si no hay tasa: quien llama
       simplemente no pinta la línea. */
    bs: function (cents) {
      var r = Rate.value();
      if (!r || !isFinite(cents)) return '';
      var n = (Number(cents) / 100) * r;
      if (!isFinite(n) || n <= 0) return '';
      try {
        return 'Bs ' + n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } catch (e) {
        return 'Bs ' + n.toFixed(2);
      }
    },

    /* «Tasa actualizada el 9/9/2026» — solo si la conocemos */
    stamp: function () {
      if (!Rate.state) return '';
      if (Rate.state.source === 'manual') return 'Tasa configurada por la tienda';
      if (!Rate.state.updatedAt) return '';
      try {
        return 'Tasa actualizada el ' +
          new Date(Rate.state.updatedAt).toLocaleDateString('es-VE',
            { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) { return ''; }
    }
  };

  // ── Favoritos ────────────────────────────────────────────────────
  var Wish = {
    has: function (id) { return State.wish.indexOf(id) !== -1; },
    count: function () { return State.wish.length; },
    toggle: function (id) {
      var p = BY_ID[id]; if (!p) return false;
      var i = State.wish.indexOf(id);
      if (i === -1) { State.wish.push(id); Toast.show('Guardado en favoritos', 'heart'); }
      else { State.wish.splice(i, 1); Toast.show('Quitado de favoritos'); }
      saveWish();
      return Wish.has(id);
    },
    remove: function (id) {
      State.wish = State.wish.filter(function (x) { return x !== id; });
      saveWish();
    },
    products: function () {
      return State.wish.map(function (id) { return BY_ID[id]; }).filter(Boolean);
    }
  };

  /* Marcas presentes en el catálogo, con su número de fragancias.
     Se calcula de los datos: no hay una lista que mantener a mano. */
  var BRANDS = (function () {
    var count = {};
    PRODUCTS.forEach(function (p) {
      if (p.brand) count[p.brand] = (count[p.brand] || 0) + 1;
    });
    return Object.keys(count).map(function (b) {
      return { name: b, n: count[b] };
    }).sort(function (a, b) {
      return b.n - a.n || a.name.localeCompare(b.name, 'es');
    });
  })();

  // ── Búsqueda y filtros ───────────────────────────────────────────
  function haystack(p) {
    if (p._hay) return p._hay;
    p._hay = norm([p.name, p.brand, p.familyLabel, p.genderLabel, p.desc,
      (p.tags || []).join(' '),
      p.notes ? [p.notes.top, p.notes.heart, p.notes.base, p.notes.familia].join(' ') : ''
    ].join(' '));
    return p._hay;
  }

  function search(q, list) {
    var terms = norm(q).split(/\s+/).filter(Boolean);
    var pool = list || PRODUCTS;
    if (!terms.length) return pool.slice();
    return pool.filter(function (p) {
      var h = haystack(p);
      return terms.every(function (t) { return h.indexOf(t) !== -1; });
    });
  }

  var SORTS = {
    relevancia: function (a, b) {
      // Disponibles primero, luego destacados, luego alfabético
      if (a.soldOut !== b.soldOut) return a.soldOut ? 1 : -1;
      var s = (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
      if (s) return s;
      var n = (b.nuevo ? 1 : 0) - (a.nuevo ? 1 : 0);
      if (n) return n;
      return a.name.localeCompare(b.name, 'es');
    },
    'precio-asc':  function (a, b) { return (a.price || 0) - (b.price || 0); },
    'precio-desc': function (a, b) { return (b.price || 0) - (a.price || 0); },
    vendidos: function (a, b) {
      var s = (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
      return s || SORTS.relevancia(a, b);
    },
    nuevos: function (a, b) {
      var s = (b.nuevo ? 1 : 0) - (a.nuevo ? 1 : 0);
      return s || SORTS.relevancia(a, b);
    },
    az: function (a, b) { return a.name.localeCompare(b.name, 'es'); }
  };

  var FILTERS = {
    todos:    function () { return true; },
    hombre:   function (p) { return p.genders.indexOf('hombre') !== -1; },
    mujer:    function (p) { return p.genders.indexOf('mujer') !== -1; },
    unisex:   function (p) { return p.genders.indexOf('unisex') !== -1; },
    sets:     function (p) { return p.genders.indexOf('sets') !== -1; },
    arabes:   function (p) { return p.family === 'arabes'; },
    designer: function (p) { return p.family === 'designer'; },
    vendidos: function (p) { return !!p.bestseller; },
    nuevos:   function (p) { return !!p.nuevo; },
    stock:    function (p) { return !p.soldOut; }
  };

  // ── Iconos ───────────────────────────────────────────────────────
  var ICON = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20.5 20.5 16.6 16.6"/></svg>',
    heart:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5S3.8 15.4 3.8 9.9A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 8.2 2.5c0 5.5-8.2 10.6-8.2 10.6Z"/></svg>',
    bag:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7.5h15l-1.2 12a1.8 1.8 0 0 1-1.8 1.6H7.5a1.8 1.8 0 0 1-1.8-1.6Z"/><path d="M8.8 7.5V6a3.2 3.2 0 0 1 6.4 0v1.5"/></svg>',
    close:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    check:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    wa:     '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a9.9 9.9 0 0 0-8.5 15l-1.3 4.8 4.9-1.3A9.9 9.9 0 1 0 12 2Zm5.8 14.1c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.5-1.2-2.9s.7-2 1-2.3c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.2.4-.2.6-.1l2 .9c.2.1.4.2.4.3.1.2.1.6-.1 1.3Z"/></svg>',
    ship:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5.5c0 4.3-3 8-7 9.5-4-1.5-7-5.2-7-9.5V6z"/><path d="m9 12 2 2 4-4"/></svg>'
  };

  // ── Avisos (toast) ───────────────────────────────────────────────
  var Toast = {
    host: null,
    show: function (msg, icon) {
      if (!Toast.host) {
        Toast.host = el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
        document.body.appendChild(Toast.host);
      }
      var t = el('div', { class: 'toast' },
        (icon && ICON[icon] ? ICON[icon] : '') + '<span>' + esc(msg) + '</span>');
      Toast.host.appendChild(t);
      setTimeout(function () {
        t.classList.add('is-out');
        setTimeout(function () { t.remove(); }, 340);
      }, 2600);
    }
  };

  // ── Enfoque atrapado en paneles ──────────────────────────────────
  var lastFocus = null;
  function trap(container, onEsc) {
    function key(e) {
      if (e.key === 'Escape') { onEsc(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', container)
        .filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.__trap = key;
    document.addEventListener('keydown', key);
  }
  function untrap(container) {
    if (container.__trap) document.removeEventListener('keydown', container.__trap);
  }

  // ── Cabecera y pie (fuente única, sin duplicar marcado) ──────────
  var NAV = [
    { href: 'index.html',              label: 'Inicio' },
    { href: 'catalogo.html',           label: 'Catálogo' },
    { href: 'catalogo.html?f=hombre',  label: 'Hombre' },
    { href: 'catalogo.html?f=mujer',   label: 'Mujer' },
    { href: 'catalogo.html?f=unisex',  label: 'Unisex' },
    { href: 'contacto.html',           label: 'Contacto' }
  ];

  /* El menú de las tres barras muestra el sitio completo, no solo el
     menú reducido de escritorio. */
  /* El menú de las tres barras, agrupado: no es una lista plana de diez
     enlaces iguales, sino secciones con jerarquía. */
  var MOBILE_MENU = [
    { group: null, items: [
      { href: 'index.html',    label: 'Inicio' },
      { href: 'catalogo.html', label: 'Catálogo' }
    ]},
    { group: 'Colecciones', items: [
      { href: 'catalogo.html?f=hombre', label: 'Hombre' },
      { href: 'catalogo.html?f=mujer',  label: 'Mujer' },
      { href: 'catalogo.html?f=unisex', label: 'Unisex' },
      { href: 'catalogo.html?f=sets',   label: 'Gift Sets' },
      { href: 'catalogo.html?f=arabes', label: 'Árabes' }
    ]},
    { group: 'Más', items: [
      { href: 'quiz.html',      label: '¿Qué perfume soy?' },
      { href: 'favoritos.html', label: 'Favoritos', badge: 'wish' },
      { href: 'contacto.html',  label: 'Contacto' }
    ]}
  ];

  function currentPage() {
    return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  /* Un enlace está activo si coincide el archivo y, cuando lo lleva, el filtro */
  function isCurrent(href) {
    var here = currentPage();
    var file = href.split('?')[0].toLowerCase();
    if (file !== here) return false;
    var want = (href.split('?')[1] || '');
    var have = location.search.replace(/^\?/, '');
    if (!want) return !have || here !== 'catalogo.html';
    return have === want;
  }

  function buildHeader() {
    var links = NAV.map(function (n) {
      var cur = isCurrent(n.href) ? ' aria-current="page"' : '';
      return '<a href="' + n.href + '"' + cur + '>' + esc(n.label) + '</a>';
    }).join('');

    var header = el('header', { class: 'header' }, '' +
      '<div class="header__inner">' +
        '<button class="burger" id="v-burger" aria-expanded="false" aria-controls="v-mobilenav" aria-label="Abrir menú">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
        '<a class="brand" href="index.html">VECCHIA</a>' +
        '<nav class="nav" aria-label="Principal">' + links + '</nav>' +
        '<div class="header__actions">' +
          '<button class="icon-btn" id="v-search" aria-label="Buscar perfumes">' + ICON.search + '</button>' +
          '<a class="icon-btn" href="favoritos.html" aria-label="Ver favoritos">' + ICON.heart +
            '<span class="badge" id="v-wish-badge" aria-hidden="true">0</span></a>' +
          '<button class="icon-btn" id="v-cart" aria-label="Abrir pedido">' + ICON.bag +
            '<span class="badge" id="v-cart-badge" aria-hidden="true">0</span></button>' +
        '</div>' +
      '</div>' +
      '');

    // Detrás del enlace «saltar al contenido», para que siga siendo el primer tab
    var skip = document.querySelector('.skip-link');
    if (skip && skip.nextSibling) document.body.insertBefore(header, skip.nextSibling);
    else document.body.insertBefore(header, document.body.firstChild);

    /* Hermano de la cabecera, no hijo: si va dentro, el backdrop-filter
       del header lo hace su bloque contenedor y el menú queda sin altura. */
    var mobileNav = el('nav', {
      class: 'mobile-nav', id: 'v-mobilenav', 'aria-label': 'Menú'
    }, '' +
        '<div class="mobile-nav__inner">' +
          '<button class="mobile-nav__search" data-open-search>' +
            ICON.search + '<span>Buscar fragancia o marca</span>' +
          '</button>' +
          MOBILE_MENU.map(function (sec) {
            return (sec.group ? '<p class="mobile-nav__label">' + esc(sec.group) + '</p>' : '') +
              '<ul class="mobile-nav__list' + (sec.group ? ' is-sub' : '') + '">' +
              sec.items.map(function (it) {
                return '<li><a href="' + it.href + '">' + esc(it.label) +
                  (it.badge === 'wish' ? '<span class="mobile-nav__n" data-mn-wish></span>' : '') +
                  '</a></li>';
              }).join('') + '</ul>';
          }).join('') +
          '<p class="mobile-nav__label">Marcas</p>' +
          '<div class="mobile-nav__brands">' +
            BRANDS.slice(0, 8).map(function (b) {
              return '<a class="chip" href="catalogo.html?m=' + encodeURIComponent(b.name) + '">' +
                esc(b.name) + ' <span>' + b.n + '</span></a>';
            }).join('') +
            '<a class="chip" href="catalogo.html">Ver todas</a>' +
          '</div>' +
        '</div>' +
        '<div class="mobile-nav__foot">' +
          '<a class="btn btn--block" href="' + waLink('Hola VECCHIA, quiero información.') + '" ' +
            'target="_blank" rel="noopener">Escribir por WhatsApp</a>' +
        '</div>' +
      '');

    document.body.appendChild(mobileNav);

    var burger = $('#v-burger'), mnav = mobileNav;
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
      mnav.classList.toggle('is-open', !open);
      document.body.classList.toggle('is-locked', !open);
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        burger.setAttribute('aria-expanded', 'false');
        mnav.classList.remove('is-open');
        document.body.classList.remove('is-locked');
      }
    });
    $('#v-search').addEventListener('click', function () { Search.open(); });
    $('#v-cart').addEventListener('click', function () { Drawer.open('cart'); });
  }

  function buildFooter() {
    var year = new Date().getFullYear();
    var f = el('footer', { class: 'footer' }, '' +
      '<div class="wrap">' +
        '<div class="footer__grid">' +
          '<div>' +
            '<p class="footer__brand">VECCHIA</p>' +
            '<p class="footer__note">Perfumes. Fragancias originales seleccionadas ' +
            'una a una, en Barinas, Venezuela.</p>' +
          '</div>' +
          '<div><h3>Tienda</h3><ul>' +
            '<li><a href="index.html">Inicio</a></li>' +
            '<li><a href="catalogo.html">Catálogo</a></li>' +
            '<li><a href="catalogo.html?f=hombre">Hombre</a></li>' +
            '<li><a href="catalogo.html?f=mujer">Mujer</a></li>' +
            '<li><a href="catalogo.html?f=unisex">Unisex</a></li>' +
            '<li><a href="contacto.html">Contacto</a></li>' +
          '</ul></div>' +
          '<div><h3>Ayuda</h3><ul>' +
            '<li><a href="quiz.html">¿Qué perfume soy?</a></li>' +
            '<li><a href="favoritos.html">Mis favoritos</a></li>' +
            '<li><a href="catalogo.html?f=sets">Gift sets</a></li>' +
          '</ul></div>' +
          '<div><h3>Contacto</h3><ul>' +
            '<li><a href="' + waLink('Hola VECCHIA, tengo una consulta.') + '" target="_blank" rel="noopener">WhatsApp +58 273 552 7411</a></li>' +
            '<li><a href="https://instagram.com/vecchiaperfumes" target="_blank" rel="noopener">Instagram @vecchiaperfumes</a></li>' +
            '<li><span class="footer__place">Barinas · Venezuela</span></li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="footer__bottom">' +
          '<span>© ' + year + ' ' + CFG.brandName + '</span>' +
          '<span id="v-rate-stamp"></span>' +
        '</div>' +
      '</div>');
    document.body.appendChild(f);

    var wa = el('a', {
      class: 'wa', href: waLink('Hola VECCHIA, quiero información.'),
      target: '_blank', rel: 'noopener', 'aria-label': 'Escribir por WhatsApp'
    }, ICON.wa);
    document.body.appendChild(wa);
  }

  // ── Panel lateral: pedido y favoritos ────────────────────────────
  var Drawer = {
    node: null, backdrop: null, tab: 'cart',
    build: function () {
      Drawer.backdrop = el('div', { class: 'backdrop', id: 'v-backdrop' });
      Drawer.node = el('aside', {
        class: 'drawer', id: 'v-drawer', role: 'dialog', 'aria-modal': 'true',
        'aria-label': 'Pedido y favoritos'
      }, '' +
        '<div class="drawer__head">' +
          '<h2 class="drawer__title" id="v-drawer-title">Tu pedido</h2>' +
          '<button class="drawer__close" id="v-drawer-close" aria-label="Cerrar">' + ICON.close + '</button>' +
        '</div>' +
        '<div class="drawer__tabs" role="tablist">' +
          '<button class="drawer__tab" id="v-tab-cart" role="tab" aria-selected="true" aria-controls="v-drawer-body">Pedido</button>' +
          '<button class="drawer__tab" id="v-tab-wish" role="tab" aria-selected="false" aria-controls="v-drawer-body">Favoritos</button>' +
        '</div>' +
        '<div class="drawer__body" id="v-drawer-body" role="tabpanel"></div>' +
        '<div class="drawer__foot" id="v-drawer-foot"></div>');

      document.body.appendChild(Drawer.backdrop);
      document.body.appendChild(Drawer.node);

      Drawer.backdrop.addEventListener('click', Drawer.close);
      $('#v-drawer-close').addEventListener('click', Drawer.close);
      $('#v-tab-cart').addEventListener('click', function () { Drawer.open('cart'); });
      $('#v-tab-wish').addEventListener('click', function () { Drawer.open('wish'); });

      Drawer.node.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b) return;
        var id = b.getAttribute('data-id'), act = b.getAttribute('data-act');
        if (act === 'inc') Cart.setQty(id, Cart.qtyOf(id) + 1);
        else if (act === 'dec') Cart.setQty(id, Cart.qtyOf(id) - 1);
        else if (act === 'del') {
          var line = b.closest('.line');
          if (line) {
            line.classList.add('is-removing');
            setTimeout(function () { Cart.remove(id); }, 200);
          } else Cart.remove(id);
        }
        else if (act === 'unwish') Wish.remove(id);
        else if (act === 'towish-cart') { Cart.add(id, 1); }
      });
    },
    open: function (tab) {
      lastFocus = document.activeElement;
      Drawer.tab = tab || 'cart';
      Drawer.render();
      Drawer.node.classList.add('is-open');
      Drawer.backdrop.classList.add('is-open');
      document.body.classList.add('is-locked');
      trap(Drawer.node, Drawer.close);
      setTimeout(function () { $('#v-drawer-close').focus(); }, 60);
    },
    close: function () {
      Drawer.node.classList.remove('is-open');
      Drawer.backdrop.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      untrap(Drawer.node);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    },
    render: function () {
      if (!Drawer.node) return;
      var isCart = Drawer.tab === 'cart';
      $('#v-tab-cart').setAttribute('aria-selected', String(isCart));
      $('#v-tab-wish').setAttribute('aria-selected', String(!isCart));
      $('#v-drawer-title').textContent = isCart ? 'Tu pedido' : 'Favoritos';
      var body = $('#v-drawer-body'), foot = $('#v-drawer-foot');

      if (isCart) {
        var lines = Cart.detailed();
        if (!lines.length) {
          body.innerHTML = '<div class="state">' +
            '<p class="state__title">Tu pedido está vacío</p>' +
            '<p class="state__text">Explora el catálogo y añade las fragancias que te gusten.</p>' +
            '<a class="btn" href="catalogo.html">Ver catálogo</a></div>';
          foot.innerHTML = '';
          return;
        }
        body.innerHTML = lines.map(function (l) {
          var p = l.product;
          return '<div class="line" data-line="' + esc(p.id) + '">' +
            '<div class="' + mediaClass(p, 'line__img') + '">' + imgTag(p, 'lazy') + '</div>' +
            '<div>' +
              (p.brand ? '<p class="line__brand">' + esc(p.brand) + '</p>' : '') +
              '<a class="line__name link-underline" href="producto.html?id=' + esc(p.id) + '">' + esc(p.name) + '</a>' +
              '<div class="line__row">' +
                '<span class="qty">' +
                  '<button data-act="dec" data-id="' + esc(p.id) + '" aria-label="Quitar una unidad de ' + esc(p.name) + '">−</button>' +
                  '<output aria-label="Cantidad">' + l.qty + '</output>' +
                  '<button data-act="inc" data-id="' + esc(p.id) + '" aria-label="Añadir una unidad de ' + esc(p.name) + '"' +
                    (l.qty >= 99 ? ' disabled' : '') + '>+</button>' +
                '</span>' +
                '<span class="line__price">' + money(l.lineCents) + '</span>' +
              '</div>' +
              '<button class="line__remove" data-act="del" data-id="' + esc(p.id) + '">Eliminar</button>' +
            '</div></div>';
        }).join('');

        var sub = Cart.subtotalCents();
        foot.innerHTML =
          '<div class="totals">' +
            '<div class="t-sub"><span>Subtotal (' + Cart.count() + ' art.)</span><span>' + money(sub) + '</span></div>' +
            '<div class="t-sub"><span>Envío</span><span>Se coordina por WhatsApp</span></div>' +
            '<div class="t-total"><span>Total</span><span>' + money(Cart.totalCents()) + '</span></div>' +
            (Rate.bs(Cart.totalCents())
              ? '<div class="t-sub t-bs"><span></span><span>' + esc(Rate.bs(Cart.totalCents())) + '</span></div>' : '') +
          '</div>' +
          '<a class="btn btn--block" href="checkout.html">Finalizar pedido</a>' +
          '<a class="btn btn--ghost btn--block" href="catalogo.html">Seguir viendo</a>';
      } else {
        var favs = Wish.products();
        if (!favs.length) {
          body.innerHTML = '<div class="state">' +
            '<p class="state__title">Aún no tienes favoritos</p>' +
            '<p class="state__text">Pulsa el corazón de cualquier fragancia para guardarla aquí.</p>' +
            '<a class="btn" href="catalogo.html">Explorar</a></div>';
          foot.innerHTML = '';
          return;
        }
        body.innerHTML = favs.map(function (p) {
          return '<div class="line">' +
            '<div class="' + mediaClass(p, 'line__img') + '">' + imgTag(p, 'lazy') + '</div>' +
            '<div>' +
              (p.brand ? '<p class="line__brand">' + esc(p.brand) + '</p>' : '') +
              '<a class="line__name link-underline" href="producto.html?id=' + esc(p.id) + '">' + esc(p.name) + '</a>' +
              '<div class="line__row"><span class="line__price">' + money(toCents(p.price)) + '</span></div>' +
              (p.soldOut ? '<p class="meta" style="margin-top:.5rem">Sin stock</p>'
                : '<button class="line__remove" data-act="towish-cart" data-id="' + esc(p.id) + '" style="margin-right:1rem">Añadir al pedido</button>') +
              '<button class="line__remove" data-act="unwish" data-id="' + esc(p.id) + '">Quitar</button>' +
            '</div></div>';
        }).join('');
        foot.innerHTML = '<a class="btn btn--block" href="favoritos.html">Ver todos los favoritos</a>';
      }
    }
  };

  // ── Buscador global ──────────────────────────────────────────────
  var Search = {
    node: null,
    build: function () {
      Search.node = el('div', {
        class: 'search-overlay search', id: 'v-searchoverlay',
        role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Buscar perfumes'
      }, '' +
        '<div class="wrap" style="width:100%;max-width:900px;margin-inline:auto">' +
          '<div class="search__bar">' +
            '<label class="sr-only" for="v-searchinput">Buscar perfumes</label>' +
            '<input id="v-searchinput" type="search" placeholder="Buscar por nombre, marca o nota…" autocomplete="off" spellcheck="false">' +
            '<button class="search__close" id="v-searchclose" aria-label="Cerrar buscador">' + ICON.close + '</button>' +
          '</div>' +
          '<div class="search__results" id="v-searchresults" aria-live="polite"></div>' +
        '</div>');
      document.body.appendChild(Search.node);

      var input = $('#v-searchinput');
      $('#v-searchclose').addEventListener('click', Search.close);
      input.addEventListener('input', debounce(function () { Search.run(input.value); }, 140));
      Search.node.addEventListener('click', function (e) {
        var c = e.target.closest('[data-suggest]');
        if (c) { input.value = c.getAttribute('data-suggest'); Search.run(input.value); input.focus(); }
      });
    },
    open: function () {
      lastFocus = document.activeElement;
      Search.node.classList.add('is-open');
      document.body.classList.add('is-locked');
      trap(Search.node, Search.close);
      var i = $('#v-searchinput');
      setTimeout(function () { i.focus(); }, 60);
      Search.run(i.value);
    },
    close: function () {
      Search.node.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      untrap(Search.node);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    },
    run: function (q) {
      var box = $('#v-searchresults');
      if (!q || !q.trim()) {
        box.innerHTML = '<p class="meta" style="color:var(--paper-45);padding:.75rem 0">Sugerencias</p>' +
          '<div class="state__suggest" style="justify-content:flex-start">' +
          BRANDS.slice(0, 7).map(function (b) {
            return '<button class="chip" data-suggest="' + esc(b.name) + '">' +
              esc(b.name) + '</button>';
          }).join('') +
          ['Árabes', 'Dulce', 'Fresco'].map(function (s) {
            return '<button class="chip" data-suggest="' + s + '">' + s + '</button>';
          }).join('') +
          '</div>';
        return;
      }
      var res = search(q).sort(SORTS.relevancia).slice(0, 24);
      if (!res.length) {
        box.innerHTML = '<div class="state">' +
          '<p class="state__title">No encontramos lo que buscas</p>' +
          '<p class="state__text">Prueba con otro término, o escríbenos y te ayudamos a localizarlo.</p>' +
          '<div class="state__suggest">' +
          BRANDS.slice(0, 5).map(function (b) {
            return '<button class="chip" data-suggest="' + esc(b.name) + '">' +
              esc(b.name) + '</button>';
          }).join('') +
          '<a class="btn btn--onDark" href="' + waLink('Hola VECCHIA, busco: ' + q) + '" target="_blank" rel="noopener">Preguntar por WhatsApp</a>' +
          '</div></div>';
        return;
      }
      box.innerHTML = '<p class="meta" style="color:var(--paper-45);padding:.75rem 0">' +
        res.length + (res.length === 1 ? ' resultado' : ' resultados') + '</p>' +
        res.map(function (p) {
          return '<a class="result" href="producto.html?id=' + esc(p.id) + '">' +
            '<span class="' + mediaClass(p, 'result__img') + '">' + imgTag(p, 'lazy') + '</span>' +
            '<span><span class="result__brand">' + esc(p.brand || p.familyLabel) + '</span>' +
            '<span class="result__name" style="display:block">' + esc(p.name) + '</span></span>' +
            '<span class="result__price">' + (p.soldOut ? 'Sin stock' : money(toCents(p.price))) + '</span>' +
          '</a>';
        }).join('');
    }
  };

  // ── Tarjetas ─────────────────────────────────────────────────────
  function imgTag(p, loading) {
    if (!p.image) return '<span class="card__media--empty meta">Sin imagen</span>';
    /* data-fallback: si la foto de fondo blanco no existiera en el servidor,
       el navegador repone la versión de fondo oscuro en vez de dejar un hueco.
       Se intenta una sola vez por imagen. */
    return '<img src="' + esc(p.image) + '" alt="' + esc(p.alt || p.name) + '"' +
      (p.imageDark ? ' data-fallback="' + esc(p.imageDark) + '"' : '') +
      (loading ? ' loading="' + loading + '"' : '') + ' decoding="async">';
  }

  /* Clase de baldosa: las fotos con fondo oscuro incrustado se muestran
     a sangre sobre negro; el resto se funde en crema. */
  function mediaClass(p, base) {
    return base + (p.dark ? ' is-dark' : '');
  }

  function cardHTML(p, opts) {
    opts = opts || {};
    var flags = [];
    if (p.soldOut) flags.push('<span class="flag flag--out">Agotado</span>');
    if (p.bestseller) flags.push('<span class="flag">Más vendido</span>');
    if (p.nuevo) flags.push('<span class="flag">Nuevo</span>');
    var fav = Wish.has(p.id);

    return '<article class="card reveal" data-id="' + esc(p.id) + '">' +
      '<a class="' + mediaClass(p, 'card__media') + '" href="producto.html?id=' + esc(p.id) + '" ' +
         'aria-label="Ver ' + esc(p.name) + '">' +
        (flags.length ? '<span class="card__flags">' + flags.join('') + '</span>' : '') +
        imgTag(p, opts.eager ? null : 'lazy') +
      '</a>' +
      '<button class="fav" data-fav="' + esc(p.id) + '" aria-pressed="' + fav + '" ' +
        'aria-label="' + (fav ? 'Quitar de favoritos' : 'Guardar en favoritos') + ': ' + esc(p.name) + '">' +
        ICON.heart + '</button>' +
      '<div class="card__body">' +
        (p.brand ? '<p class="card__brand">' + esc(p.brand) + '</p>' : '') +
        '<h3 class="card__name"><a href="producto.html?id=' + esc(p.id) + '">' + esc(p.name) + '</a></h3>' +
        '<p class="card__cat">' + esc(p.familyLabel + (p.genderLabel ? ' · ' + p.genderLabel : '')) + '</p>' +
        '<p class="card__price"' + (p.price ? ' data-cents="' + toCents(p.price) + '"' : '') + '>' +
          (p.price ? money(toCents(p.price)) : 'Consultar') +
          (p.price && Rate.bs(toCents(p.price))
            ? '<span class="card__bs">' + esc(Rate.bs(toCents(p.price))) + '</span>' : '') + '</p>' +
        '<p class="card__stock' + (p.soldOut ? ' is-out' : '') + '">' +
          (p.soldOut ? 'Agotado' : 'Disponible') + '</p>' +
        '<div class="card__actions">' +
          (p.soldOut
            ? '<a class="btn btn--ghost" href="' + waLink('Hola VECCHIA, ¿tienen stock de ' + p.name + '?') + '" target="_blank" rel="noopener">Consultar stock</a>'
            : '<button class="btn" data-add="' + esc(p.id) + '">Añadir al pedido</button>') +
        '</div>' +
      '</div></article>';
  }

  function renderGrid(node, list, opts) {
    if (!node) return;
    if (!list.length) {
      node.innerHTML = '';
      return;
    }
    node.innerHTML = list.map(function (p, i) {
      return cardHTML(p, { eager: i < 4 });
    }).join('');
    paintBs(node);
    observeReveals(node);
  }

  // ── Aparición al hacer scroll ────────────────────────────────────
  var io = null;
  function observeReveals(root) {
    var nodes = $$('.reveal', root || document);
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    }
    nodes.forEach(function (n) { if (!n.classList.contains('is-in')) io.observe(n); });
  }

  // ── Delegación global de clics ───────────────────────────────────
  /* Un único manejador para los errores de imagen de todo el sitio.
     Va en fase de captura porque el evento error de <img> no burbujea. */
  function wireImageFallback() {
    document.addEventListener('error', function (e) {
      var img = e.target;
      if (!img || img.tagName !== 'IMG' || img.dataset.tried) return;
      img.dataset.tried = '1';
      var box = img.closest('.card__media,.pdp__media,.line__img,.result__img');
      var alt = img.getAttribute('data-fallback');
      if (alt) {
        if (box) box.classList.add('is-dark');   // la de respaldo es la oscura
        img.src = alt;
        return;
      }
      if (box) box.classList.add('is-broken');
      img.remove();
    }, true);
  }

  function wireGlobalActions() {
    document.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]');
      if (add) {
        e.preventDefault();
        var qtyNode = add.closest('[data-qty-scope]');
        var q = qtyNode ? parseInt($('output', qtyNode).textContent, 10) || 1 : 1;
        if (Cart.add(add.getAttribute('data-add'), q)) {
          var badge = $('#v-cart-badge');
          if (badge) { badge.classList.add('pulse'); setTimeout(function () { badge.classList.remove('pulse'); }, 460); }
        }
        return;
      }
      var fav = e.target.closest('[data-fav]');
      if (fav) {
        e.preventDefault();
        var on = Wish.toggle(fav.getAttribute('data-fav'));
        fav.classList.add('bump');
        setTimeout(function () { fav.classList.remove('bump'); }, 430);
        return;
      }
      var openCart = e.target.closest('[data-open-cart]');
      if (openCart) { e.preventDefault(); Drawer.open('cart'); return; }
      var openSearch = e.target.closest('[data-open-search]');
      if (openSearch) { e.preventDefault(); Search.open(); }
    });

    // Atajo de teclado: "/" abre el buscador
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault(); Search.open();
      }
    });
  }

  // ── Sincronización de la interfaz ────────────────────────────────
  /* La tasa suele llegar después de pintar el catálogo: en vez de volver a
     renderizar las 116 tarjetas, solo se inserta o actualiza su línea en Bs. */
  function paintBs(root) {
    $$('.card__price[data-cents]', root || document).forEach(function (node) {
      var cents = parseInt(node.getAttribute('data-cents'), 10);
      var txt = Rate.bs(cents);
      var span = node.querySelector('.card__bs');
      if (!txt) { if (span) span.remove(); return; }
      if (!span) {
        span = el('span', { class: 'card__bs' });
        node.appendChild(span);
      }
      span.textContent = txt;
    });
  }

  function syncUI() {
    var cb = $('#v-cart-badge'), wb = $('#v-wish-badge');
    var c = Cart.count(), w = Wish.count();
    if (cb) { cb.textContent = c; cb.classList.toggle('is-on', c > 0); }
    if (wb) { wb.textContent = w; wb.classList.toggle('is-on', w > 0); }

    var mnWish = $('[data-mn-wish]');
    if (mnWish) mnWish.textContent = w > 0 ? w : '';

    $$('[data-fav]').forEach(function (b) {
      var on = Wish.has(b.getAttribute('data-fav'));
      b.setAttribute('aria-pressed', String(on));
    });

    var stamp = $('#v-rate-stamp');
    if (stamp) stamp.textContent = Rate.stamp();
    paintBs();

    if (Drawer.node && Drawer.node.classList.contains('is-open')) Drawer.render();
    document.dispatchEvent(new CustomEvent('vecchia:ui'));
  }

  // ── Arranque ─────────────────────────────────────────────────────
  function init() {
    loadState();
    Rate.load();
    buildHeader();
    Drawer.build();
    Search.build();
    buildFooter();
    wireImageFallback();
    wireGlobalActions();
    syncUI();
    observeReveals(document);

    document.addEventListener('vecchia:change', syncUI);
    // Sincroniza entre pestañas abiertas
    window.addEventListener('storage', function (e) {
      if (e.key === CFG.keys.cart || e.key === CFG.keys.wish) { loadState(); syncUI(); }
    });
    Rate.refresh();
    document.addEventListener('vecchia:rate', syncUI);
    document.dispatchEvent(new CustomEvent('vecchia:ready'));
  }

  // ── API pública para las páginas ─────────────────────────────────
  window.Vecchia = {
    cfg: CFG, products: PRODUCTS, byId: BY_ID,
    Cart: Cart, Wish: Wish, Drawer: Drawer, Search: Search, Toast: Toast,
    search: search, SORTS: SORTS, FILTERS: FILTERS, BRANDS: BRANDS,
    money: money, toCents: toCents, esc: esc, el: el, $: $, $$: $$,
    Rate: Rate, paintBs: paintBs,
    waLink: waLink, cardHTML: cardHTML, renderGrid: renderGrid,
    imgTag: imgTag, mediaClass: mediaClass,
    observeReveals: observeReveals, ICON: ICON, norm: norm
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
