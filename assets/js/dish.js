/* =============================================================
   dish.js — renders a single dish detail page.
   Reads ?id= from the URL, looks the dish up in the Store,
   and shows a large photo with clearly laid-out options.
   ============================================================= */
(function () {
  "use strict";
  var S = window.Store;
  var I = window.MandaliI18n;
  var lang = S.getLang();

  function t(k) { return I.t(lang, k); }
  function L(o) { return I.L(lang, o); }
  function digits(s) { return I.digits(lang, s); }
  function price(v) { return I.price(lang, v); }
  function esc(s) { return I.esc(s); }

  var $ = function (id) { return document.getElementById(id); };

  function param(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  }

  function findDish(id) {
    var all = S.dishes();
    for (var i = 0; i < all.length; i++) { if (all[i].id === id) return all[i]; }
    return null;
  }

  function categoryOf(catId) {
    var cats = S.categories();
    for (var i = 0; i < cats.length; i++) { if (cats[i].id === catId) return cats[i]; }
    return null;
  }

  function render() {
    var html = document.documentElement;
    html.lang = lang; html.dir = lang === "ar" ? "rtl" : "ltr";

    var r = S.restaurant();
    $("bar-name").firstChild.nodeValue = L(r.name);
    $("bar-sub").textContent = L(r.sub);
    $("back-label").textContent = t("menu");
    $("lang-en").setAttribute("aria-pressed", lang === "en");
    $("lang-ar").setAttribute("aria-pressed", lang === "ar");

    var id = param("id");
    var d = id ? findDish(id) : null;
    var root = $("dish");

    if (!d || d.hidden) {
      document.title = t("notFound") + " — " + L(r.name);
      root.innerHTML =
        '<div class="dpage wrap dpage--empty">' +
          '<h1 class="dtitle">' + esc(t("notFound")) + '</h1>' +
          '<p class="dmuted">' + esc(t("notFoundBody")) + '</p>' +
          '<a class="btn-line" href="index.html?lang=' + lang + '">' + esc(t("backToMenu")) + '</a>' +
        '</div>';
      return;
    }

    var cat = categoryOf(d.categoryId);
    document.title = L(d.name) + " — " + L(r.name);

    var hero = d.image
      ? '<div class="dhero"><img src="' + esc(d.image) + '" alt="' + esc(L(d.name)) + '"></div>'
      : '<div class="dhero dhero--ph girih">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 11h18M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M6 11v8M18 11v8M9 5V3M15 5V3"/></svg></div>';

    var labels = (d.labels || []).map(function (lb) {
      return '<span class="tag tag--' + lb + '">' + I.tagIcon(lb) + esc(t(lb)) + '</span>';
    }).join("");

    var groups = (d.optionGroupIds || []).map(function (gid) {
      var g = S.optionGroup(gid); if (!g) return "";
      var hint = g.multi ? t("chooseAny") : t("chooseOne");
      var rows = (g.options || []).map(function (o) {
        var right = (o.price && o.price > 0)
          ? '<span class="orow__plus">+' + price(o.price) + '</span>'
          : '<span class="orow__free">' + esc(t("included")) + '</span>';
        return '<li class="orow"><span class="orow__name">' + esc(L(o.name)) + '</span>' + right + '</li>';
      }).join("");
      return '<section class="optgroup">' +
        '<div class="optgroup__head"><h3>' + esc(L(g.name)) + '</h3>' +
        '<span class="optgroup__hint">' + esc(hint) + '</span></div>' +
        '<ul class="optgroup__list">' + rows + '</ul></section>';
    }).join("");

    root.innerHTML =
      hero +
      '<div class="dpage wrap">' +
        (cat ? '<a class="deyebrow" href="index.html?lang=' + lang + '#sec-' + esc(cat.id) + '">' + esc(L(cat.name)) + '</a>' : '') +
        '<div class="dhead">' +
          '<h1 class="dtitle">' + esc(L(d.name)) + '</h1>' +
          '<span class="dprice">' + price(d.price) + '</span>' +
        '</div>' +
        (labels ? '<div class="labels labels--lg">' + labels + '</div>' : '') +
        (L(d.desc) ? '<p class="ddesc">' + esc(L(d.desc)) + '</p>' : '') +
        (groups ? '<div class="dsection-title"><span>' + esc(t("choices")) + '</span></div>' + groups : '') +
        '<p class="dnote">' + esc(t("note")) + '</p>' +
        '<a class="btn-line" href="index.html?lang=' + lang + '">' + esc(t("backToMenu")) + '</a>' +
      '</div>';
  }

  /* back button: return to previous scroll position when possible */
  $("back").addEventListener("click", function () {
    if (history.length > 1 && document.referrer) { history.back(); }
    else { location.href = "index.html?lang=" + lang; }
  });

  function setLang(l) { lang = l; S.setLang(l); render(); }
  $("lang-en").addEventListener("click", function () { if (lang !== "en") setLang("en"); });
  $("lang-ar").addEventListener("click", function () { if (lang !== "ar") setLang("ar"); });

  render();
})();
