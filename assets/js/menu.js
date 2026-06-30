/* =============================================================
   menu.js — renders the customer menu listing from the Store.
   Each dish is a tappable row that opens dish.html for the full
   photo + options. Shared strings/format live in i18n.js.
   ============================================================= */
(function () {
  "use strict";
  var S = window.Store;
  var I = window.MandaliI18n;
  var lang = S.getLang();

  /* lang-bound helpers */
  function t(k) { return I.t(lang, k); }
  function L(o) { return I.L(lang, o); }
  function digits(s) { return I.digits(lang, s); }
  function price(v) { return I.price(lang, v); }
  function fmtTime(x) { return I.fmtTime(lang, x); }
  function esc(s) { return I.esc(s); }

  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- render ---------------- */
  function render() {
    var html = document.documentElement;
    html.lang = lang; html.dir = lang === "ar" ? "rtl" : "ltr";
    var r = S.restaurant();

    $("bar-name").firstChild.nodeValue = L(r.name);
    $("bar-sub").textContent = L(r.sub);
    $("lang-en").setAttribute("aria-pressed", lang === "en");
    $("lang-ar").setAttribute("aria-pressed", lang === "ar");

    $("hero-est").textContent = t("since") + " " + digits(r.established);
    $("hero-title").textContent = L(r.name);
    $("hero-sub").textContent = L(r.sub);
    $("hero-tagline").textContent = L(r.tagline);
    $("hero-scroll-label").textContent = t("viewMenu");

    renderStatus(r);

    $("act-call").href = "tel:" + r.phone;
    $("act-call-label").textContent = t("call");
    $("act-wa").href = "https://wa.me/" + r.whatsapp;
    $("act-wa-label").textContent = t("whatsapp");
    $("act-map").href = r.mapsUrl;
    $("act-map-label").textContent = t("location");
    $("addr").textContent = L(r.address);

    renderMenu();

    var yrs = new Date().getFullYear() - r.established;
    $("her-num").textContent = digits(Math.floor(yrs / 10) * 10) + "+";
    $("her-text").textContent = t("heritage");

    $("foot-name").textContent = L(r.name);
    $("foot-ig").href = r.instagram;
    $("foot-wa").href = "https://wa.me/" + r.whatsapp;
    $("foot-map").href = r.mapsUrl;
    $("foot-meta").innerHTML = L(r.address) + "<br>" + digits(r.phone);
    $("foot-note").textContent = t("note");
    $("foot-admin").textContent = t("staff");

    injectStructuredData(r);
    setupReveal();
    setupScrollSpy();
  }

  function renderStatus(r) {
    var st = S.openStatus();
    var el = $("status");
    el.className = "status " + (st.open ? "status--open" : "status--closed");
    var main = st.open ? t("openNow") : t("closedNow");
    var note = "";
    if (st.open && st.until) note = t("until") + " " + fmtTime(st.until);
    else if (!st.open && st.next) note = t("opensAt") + " " + fmtTime(st.next);
    el.innerHTML = '<span class="status__dot"></span><span>' + main + '</span>' +
      (note ? '<span class="status__note">· ' + note + '</span>' : '');

    var hrs = (r.hours || []).map(function (h) {
      return '<span><b>' + L(h.label) + '</b> ' + fmtTime(h.open) + ' – ' + fmtTime(h.close) + '</span>';
    }).join("");
    $("hours").innerHTML = hrs;
  }

  function renderMenu() {
    var cats = S.categories();
    var nav = $("catnav"); nav.innerHTML = "";
    var menu = $("menu"); menu.innerHTML = "";

    cats.forEach(function (cat) {
      var dishes = S.dishesByCategory(cat.id, false);
      if (!dishes.length) return;

      var chip = document.createElement("a");
      chip.className = "chip"; chip.href = "#sec-" + cat.id;
      chip.dataset.cat = cat.id; chip.textContent = L(cat.name);
      nav.appendChild(chip);

      var sec = document.createElement("section");
      sec.className = "section reveal"; sec.id = "sec-" + cat.id;
      sec.innerHTML = '<div class="section__head"><h2 class="section__title">' +
        esc(L(cat.name)) + '</h2><span class="section__rule"></span></div>';
      var list = document.createElement("div");
      list.className = "dishlist";
      dishes.forEach(function (d) { list.appendChild(dishRow(d)); });
      sec.appendChild(list);
      menu.appendChild(sec);
    });
  }

  /* a tappable row that links to the dish detail page */
  function dishRow(d) {
    var el = document.createElement("a");
    el.className = "dish";
    el.href = "dish.html?id=" + encodeURIComponent(d.id) + "&lang=" + lang;

    var media = d.image
      ? '<span class="dish__media"><img loading="lazy" src="' + esc(d.image) + '" alt="' + esc(L(d.name)) + '"></span>'
      : '<span class="dish__media dish__media--ph girih">' + leafIcon() + '</span>';

    var labels = (d.labels || []).map(function (lb) {
      return '<span class="tag tag--' + lb + '">' + I.tagIcon(lb) + esc(t(lb)) + '</span>';
    }).join("");

    var hasOpts = (d.optionGroupIds || []).length > 0;

    el.innerHTML =
      media +
      '<span class="dish__body">' +
        '<span class="dish__top">' +
          '<span class="dish__name">' + esc(L(d.name)) + '</span>' +
          '<span class="dish__price">' + price(d.price) + '</span>' +
        '</span>' +
        (L(d.desc) ? '<span class="dish__desc">' + esc(L(d.desc)) + '</span>' : '') +
        (labels ? '<span class="labels">' + labels + '</span>' : '') +
        (hasOpts ? '<span class="dish__more">' + esc(t("choices")) + ' ' + chevron() + '</span>'
                 : '<span class="dish__more dish__more--plain">' + esc(t("details")) + ' ' + chevron() + '</span>') +
      '</span>';
    return el;
  }

  function chevron() {
    return '<svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>';
  }
  function leafIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 11h18M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M6 11v8M18 11v8M9 5V3M15 5V3"/></svg>';
  }

  /* ---------------- scroll-spy ---------------- */
  var spy;
  function setupScrollSpy() {
    if (spy) spy.disconnect();
    var chips = {};
    document.querySelectorAll(".chip").forEach(function (c) { chips[c.dataset.cat] = c; });
    var sections = Array.prototype.slice.call(document.querySelectorAll(".section"));
    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var id = e.target.id.replace("sec-", "");
          Object.keys(chips).forEach(function (k) { chips[k].setAttribute("aria-current", k === id); });
          var active = chips[id];
          if (active && active.parentNode) {
            active.parentNode.scrollTo({ left: active.offsetLeft - 60, behavior: "smooth" });
          }
        }
      });
    }, { rootMargin: "-110px 0px -65% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------------- reveal on scroll ---------------- */
  var revObs;
  function setupReveal() {
    if (revObs) revObs.disconnect();
    revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); revObs.unobserve(e.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach(function (el) { revObs.observe(el); });
  }

  /* ---------------- SEO structured data ---------------- */
  function injectStructuredData(r) {
    var data = {
      "@context": "https://schema.org", "@type": "Restaurant",
      "name": L(r.name) + " — " + L(r.sub),
      "servesCuisine": ["Persian", "Bahraini", "Grill", "Middle Eastern"],
      "telephone": r.phone, "image": location.origin + "/assets/img/hero.jpg",
      "address": { "@type": "PostalAddress", "addressLocality": "Isa Town", "addressCountry": "BH", "streetAddress": L(r.address) },
      "openingHours": (r.hours || []).map(function (h) { return "Mo-Su " + h.open + "-" + h.close; }),
      "hasMenu": location.href, "foundingDate": String(r.established)
    };
    $("ld-json").textContent = JSON.stringify(data);
  }

  /* ---------------- language toggle ---------------- */
  function setLang(l) { lang = l; S.setLang(l); render(); window.scrollTo({ top: 0, behavior: "auto" }); }
  $("lang-en").addEventListener("click", function () { if (lang !== "en") setLang("en"); });
  $("lang-ar").addEventListener("click", function () { if (lang !== "ar") setLang("ar"); });

  setInterval(function () { renderStatus(S.restaurant()); }, 60000);

  render();
})();
