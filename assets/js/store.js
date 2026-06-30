/* =============================================================
   store.js — shared data layer for customer site + admin panel

   CUSTOMER pages (index.html, dish.html): always read straight
   from the published seed (seed.js). Nothing about the menu is
   saved on the customer's device, so every visit shows exactly
   what is currently published.

   ADMIN page (admin.html): keeps a working copy in localStorage
   so the owner can edit and then publish a new seed.js to GitHub.
   Admin mode is on when window.MANDALI_ADMIN === true (set in
   admin.html) or when the page is admin.html.
   ============================================================= */
(function (global) {
  "use strict";

  var KEY = "mandali_menu_v3";
  var LANG_KEY = "mandali_lang";
  var subscribers = [];
  var state = null;

  // Admin mode = editing device. Everyone else is a read-only customer.
  var ADMIN = !!global.MANDALI_ADMIN ||
    /admin(\.html?)?$/i.test((global.location && global.location.pathname) || "");

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function load() {
    var seed = global.MANDALI_SEED || {};

    // Customer: always the live seed, no cache, no version check.
    if (!ADMIN) {
      // Clean up any stale menu cached by older versions of the site.
      try { localStorage.removeItem(KEY); } catch (e) { }
      return clone(seed);
    }

    // Admin: restore the in-progress draft if there is one, else the seed.
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.restaurant && parsed.categories) return parsed;
      }
    } catch (e) { }
    return clone(seed);
  }

  function persist() {
    // Customer devices never store the menu.
    if (!ADMIN) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { }
  }

  function notify() {
    subscribers.forEach(function (fn) {
      try { fn(state); } catch (e) {}
    });
  }

  function ensure() { if (!state) state = load(); return state; }

  function uid(prefix) {
    return (prefix || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function priceValue(value) {
    if (Array.isArray(value)) return Number(value[0] || 0);
    return Number(value || 0);
  }

  var Store = {
    /* ----- lifecycle ----- */
    get: function () { return ensure(); },
    set: function (next) { state = next; persist(); notify(); },
    save: function () { persist(); notify(); },
    subscribe: function (fn) {
      subscribers.push(fn);
      return function () {
        subscribers = subscribers.filter(function (f) { return f !== fn; });
      };
    },
    reset: function () { state = clone(global.MANDALI_SEED); persist(); notify(); },
    uid: uid,
    clone: clone,

    /* ----- language -----
       Admin keeps the choice in localStorage. Customers store nothing:
       the language lives only in the page URL (?lang=ar|en), so it
       carries across pages during a visit but is never saved. */
    getLang: function () {
      if (ADMIN) {
        try { return localStorage.getItem(LANG_KEY) || "en"; }
        catch (e) { return "en"; }
      }
      try {
        var v = new URLSearchParams(global.location.search).get("lang");
        return (v === "ar" || v === "en") ? v : "en";
      } catch (e) { return "en"; }
    },
    setLang: function (l) {
      if (ADMIN) {
        try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
        return;
      }
      try {
        var url = new URL(global.location.href);
        url.searchParams.set("lang", l);
        global.history.replaceState(null, "", url.toString());
      } catch (e) {}
    },

    /* ----- read helpers ----- */
    restaurant: function () { return ensure().restaurant; },
    categories: function () {
      return ensure().categories.slice().sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });
    },
    dishes: function () { return ensure().dishes.filter(Boolean); },
    visibleDishes: function () {
      return ensure().dishes.filter(function (d) { return d && !d.hidden; });
    },
    dishesByCategory: function (catId, includeHidden) {
      return ensure().dishes.filter(function (d) {
        return d && d.categoryId === catId && (includeHidden || !d.hidden);
      });
    },
    optionGroups: function () { return ensure().optionGroups; },
    optionGroup: function (id) {
      return ensure().optionGroups.filter(function (g) { return g.id === id; })[0];
    },

    /* ----- price helpers ----- */
    formatPrice: function (value, lang) {
      var cur = ensure().restaurant.currency || { en: "BD", ar: "د.ب", decimals: 3 };
      var decimals = Number(cur.decimals || 0);

      if (Array.isArray(value)) {
        var parts = value.map(function (v) {
          return Number(v || 0).toFixed(decimals);
        });
        return lang === "ar"
          ? (parts.join("/") + " " + cur.ar)
          : (cur.en + " " + parts.join("/"));
      }

      var n = Number(value || 0).toFixed(decimals);
      return lang === "ar" ? (n + " " + cur.ar) : (cur.en + " " + n);
    },

    priceValue: function (value) {
      return priceValue(value);
    },

    /* ----- open / closed status ----- */
    openStatus: function (now) {
      now = now || new Date();
      var mins = now.getHours() * 60 + now.getMinutes();
      var hrs = ensure().restaurant.hours || [];

      for (var i = 0; i < hrs.length; i++) {
        var o = toMins(hrs[i].open), c = toMins(hrs[i].close);
        if (c <= o) c = 24 * 60;
        if (mins >= o && mins < c) {
          return { open: true, until: hrs[i].close, period: hrs[i].label };
        }
      }

      for (var j = 0; j < hrs.length; j++) {
        if (mins < toMins(hrs[j].open)) {
          return { open: false, next: hrs[j].open, period: hrs[j].label };
        }
      }

      return { open: false, next: hrs.length ? hrs[0].open : null };
    }
  };

  function toMins(t) {
    var p = String(t).split(":");
    return (+p[0]) * 60 + (+(p[1] || 0));
  }

  global.Store = Store;
})(window);