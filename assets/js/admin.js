/* =============================================================
   admin.js — Mandali staff dashboard
   Note: this is a client-side editor. The password gate is a
   light convenience lock, not real security. For true protection
   keep /admin.html behind your host's access control or a backend
   (see README).
   ============================================================= */
(function () {
  "use strict";
  var S = window.Store;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- auth ---------------- */
  var PW_KEY = "mandali_admin_pwhash";
  var SESSION = "mandali_admin_session";
  var DEFAULT_PW = "mandali2024";

  function hash(str) { // small non-crypto hash — adequate for a soft gate only
    var h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return "h" + h.toString(36);
  }
  function storedHash() {
    try { var v = localStorage.getItem(PW_KEY); if (v) return v; } catch (e) {}
    return hash(DEFAULT_PW);
  }
  function setPassword(pw) { try { localStorage.setItem(PW_KEY, hash(pw)); } catch (e) {} }

  function isLoggedIn() { try { return sessionStorage.getItem(SESSION) === "1"; } catch (e) { return false; } }
  function login(pw) {
    if (hash(pw) === storedHash()) { try { sessionStorage.setItem(SESSION, "1"); } catch (e) {} return true; }
    return false;
  }
  function logout() { try { sessionStorage.removeItem(SESSION); } catch (e) {} location.reload(); }

  $("login-btn").addEventListener("click", doLogin);
  $("pw").addEventListener("keydown", function (e) { if (e.key === "Enter") doLogin(); });
  function doLogin() {
    if (login($("pw").value)) showApp();
    else { $("login-err").textContent = "Incorrect password. Try again."; $("pw").value = ""; }
  }
  $("logout").addEventListener("click", logout);

  function showApp() {
    $("login").style.display = "none";
    $("shell").style.display = "block";
    route("menu");
  }

  /* ---------------- helpers ---------------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function attr(s) { return esc(s).replace(/'/g, "&#39;"); }
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("is-show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("is-show"); }, 2000);
  }
  function nameOf(o) { var d = S.get(); return (o && o.name) ? (o.name.en || o.name.ar || "") : ""; }
  function bothNames(o) {
    if (!o || !o.name) return "";
    var ar = o.name.ar ? " · " + o.name.ar : "";
    return esc(o.name.en || "") + esc(ar);
  }
  var LABELS = [
    { id: "popular", en: "Popular" }, { id: "chef", en: "Chef's pick" },
    { id: "new", en: "New" }, { id: "spicy", en: "Spicy" }
  ];

  /* ---------------- modal ---------------- */
  function openModal(title, bodyHtml, footHtml) {
    $("modal-sheet").innerHTML =
      '<div class="modal__head"><h2>' + esc(title) + '</h2>' +
      '<button class="modal__close" id="modal-x" aria-label="Close">&times;</button></div>' +
      '<div id="modal-body">' + bodyHtml + '</div>' +
      (footHtml ? '<div class="modal__foot">' + footHtml + '</div>' : '');
    $("modal").classList.add("is-open");
    $("modal-x").addEventListener("click", closeModal);
  }
  function closeModal() { $("modal").classList.remove("is-open"); $("modal-sheet").innerHTML = ""; }
  $("modal").addEventListener("click", function (e) { if (e.target === $("modal")) closeModal(); });

  /* ---------------- router ---------------- */
  var current = "menu";
  function route(view) {
    current = view;
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
      t.classList.toggle("is-active", t.dataset.view === view);
    });
    if (view === "menu") renderMenuView();
    else if (view === "options") renderOptionsView();
    else if (view === "info") renderInfoView();
    else if (view === "backup") renderBackupView();
  }
  document.getElementById("tabs").addEventListener("click", function (e) {
    var tab = e.target.closest(".tab"); if (tab) route(tab.dataset.view);
  });
  function refresh() { route(current); }

  /* =========================================================
     MENU VIEW (categories + dishes)
     ========================================================= */
  function renderMenuView() {
    var cats = S.categories();
    var html =
      '<div class="view__head"><h1>Menu</h1>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="btn btn--ghost btn--sm" id="add-cat">+ Category</button>' +
        '<button class="btn btn--sm" id="add-dish">+ Dish</button>' +
      '</div></div>' +
      '<div class="hint">Tap a dish to edit it. Use the eye icon to hide a dish from customers without deleting it. Reorder categories with the arrows.</div>';

    if (!cats.length) html += '<div class="empty">No categories yet. Add one to get started.</div>';

    cats.forEach(function (cat, idx) {
      var dishes = S.dishesByCategory(cat.id, true);
      html += '<div class="subhead" style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
        '<span>' + esc(nameOf(cat)) + ' · ' + esc(cat.name.ar || "") + '</span>' +
        '<span style="display:flex;gap:5px">' +
          iconBtn("up", "Move up", "cat-up", cat.id, idx === 0) +
          iconBtn("down", "Move down", "cat-down", cat.id, idx === cats.length - 1) +
          iconBtn("edit", "Edit", "cat-edit", cat.id) +
          iconBtn("trash", "Delete", "cat-del", cat.id) +
        '</span></div>';
      if (!dishes.length) html += '<div class="muted" style="padding:4px 2px 10px">No dishes in this category.</div>';
      dishes.forEach(function (d) { html += dishRow(d); });
    });

    $("view").innerHTML = html;

    $("add-cat").onclick = function () { editCategory(null); };
    $("add-dish").onclick = function () { editDish(null); };
    bind("cat-up", function (id) { moveCategory(id, -1); });
    bind("cat-down", function (id) { moveCategory(id, 1); });
    bind("cat-edit", function (id) { editCategory(id); });
    bind("cat-del", function (id) { deleteCategory(id); });
    bind("dish-edit", function (id) { editDish(id); });
    bind("dish-del", function (id) { deleteDish(id); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-toggle-dish]"), function (el) {
      el.addEventListener("change", function () { toggleDish(el.getAttribute("data-toggle-dish")); });
    });
  }

  function dishRow(d) {
    var thumb = d.image
      ? '<img class="list-item__thumb" src="' + attr(d.image) + '" alt="">'
      : '<div class="list-item__thumb list-item__thumb--ph"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 11h18M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M6 11v8M18 11v8"/></svg></div>';
    var pills = (d.labels || []).map(function (l) { return '<span class="pill pill--' + l + '">' + esc(labelName(l)) + '</span>'; }).join("");
    if (d.hidden) pills = '<span class="pill pill--hidden">Hidden</span>' + pills;
    return '<div class="list-item' + (d.hidden ? ' is-hidden' : '') + '">' +
      thumb +
      '<div class="list-item__body">' +
        '<div class="list-item__title">' + esc(nameOf(d)) +
          ' <span class="pill pill--price">' + esc(S.formatPrice(d.price, "en")) + '</span> ' + pills + '</div>' +
        '<div class="list-item__sub">' + esc((d.name.ar || "") + (d.desc && d.desc.en ? " — " + d.desc.en : "")) + '</div>' +
      '</div>' +
      '<div class="list-item__actions">' +
        '<label class="switch" title="Show / hide"><input type="checkbox" data-toggle-dish="' + d.id + '" ' + (d.hidden ? "" : "checked") + '><span></span></label>' +
        iconBtn("edit", "Edit", "dish-edit", d.id) +
        iconBtn("trash", "Delete", "dish-del", d.id) +
      '</div></div>';
  }
  function labelName(id) { for (var i = 0; i < LABELS.length; i++) if (LABELS[i].id === id) return LABELS[i].en; return id; }

  /* ---- category CRUD ---- */
  function editCategory(id) {
    var state = S.get();
    var cat = id ? state.categories.filter(function (c) { return c.id === id; })[0] : { name: { en: "", ar: "" } };
    openModal(id ? "Edit category" : "Add category",
      field("English name", '<input type="text" id="c-en" value="' + attr(cat.name.en) + '">') +
      field("Arabic name", '<input type="text" id="c-ar" dir="rtl" value="' + attr(cat.name.ar) + '">'),
      '<button class="btn btn--ghost" id="c-cancel">Cancel</button><button class="btn" id="c-save">Save</button>'
    );
    $("c-cancel").onclick = closeModal;
    $("c-save").onclick = function () {
      var en = $("c-en").value.trim(), ar = $("c-ar").value.trim();
      if (!en && !ar) { toast("Enter a category name"); return; }
      if (id) { cat.name = { en: en, ar: ar }; }
      else {
        var maxOrder = state.categories.reduce(function (m, c) { return Math.max(m, c.order || 0); }, 0);
        state.categories.push({ id: S.uid("cat"), order: maxOrder + 1, name: { en: en, ar: ar } });
      }
      S.save(); closeModal(); toast(id ? "Category updated" : "Category added"); refresh();
    };
  }
  function moveCategory(id, dir) {
    var cats = S.categories();
    var i = cats.findIndex(function (c) { return c.id === id; });
    var j = i + dir; if (j < 0 || j >= cats.length) return;
    var a = cats[i].order, b = cats[j].order;
    cats[i].order = b; cats[j].order = a;
    S.save(); refresh();
  }
  function deleteCategory(id) {
    var state = S.get();
    var count = state.dishes.filter(function (d) { return d.categoryId === id; }).length;
    confirmModal("Delete category?",
      count ? ("This category has " + count + " dish(es). Deleting it will also delete those dishes.") : "This cannot be undone.",
      function () {
        state.categories = state.categories.filter(function (c) { return c.id !== id; });
        state.dishes = state.dishes.filter(function (d) { return d.categoryId !== id; });
        S.save(); closeModal(); toast("Category deleted"); refresh();
      });
  }

  /* ---- dish CRUD ---- */
  function editDish(dishId) {
  var state = S.get();
  var cats = S.categories();
  var groups = state.optionGroups;
  var d = dishId ? state.dishes.filter(function (x) { return x.id === dishId; })[0]
                 : { name: { en: "", ar: "" }, desc: { en: "", ar: "" }, price: 0, image: "",
                     categoryId: cats[0] ? cats[0].id : "", labels: [], optionGroupIds: [], hidden: false };

  var catOpts = cats.map(function (c) {
    return '<option value="' + c.id + '"' + (c.id === d.categoryId ? " selected" : "") + '>' + esc(nameOf(c)) + '</option>';
  }).join("");

  var labelChecks = LABELS.map(function (l) {
    return '<label><input type="checkbox" class="d-label" value="' + l.id + '"' +
      ((d.labels || []).indexOf(l.id) > -1 ? " checked" : "") + '> ' + esc(l.en) + '</label>';
  }).join("");

  var groupChecks = groups.length ? groups.map(function (g) {
    return '<label><input type="checkbox" class="d-group" value="' + g.id + '"' +
      ((d.optionGroupIds || []).indexOf(g.id) > -1 ? " checked" : "") + '> ' + esc(nameOf(g)) + '</label>';
  }).join("") : '<span class="muted">No option groups yet — create them in the Option groups tab.</span>';

  var preview = d.image
    ? '<img class="imgup__preview" id="d-prev" src="' + attr(d.image) + '">'
    : '<div class="imgup__preview" id="d-prev" style="display:grid;place-items:center;color:#94815f">No image</div>';

  var price1Val = Array.isArray(d.price) ? d.price[0] : (Number(d.price) || 0);
  var price2Val = Array.isArray(d.price) ? (d.price[1] || 0) : 0;
  var currencyLabel = S.restaurant().currency.en;

  openModal(dishId ? "Edit dish" : "Add dish",
    field("Category", '<select id="d-cat">' + catOpts + '</select>') +
    '<div class="row2">' +
      field("English name", '<input type="text" id="d-en" value="' + attr(d.name.en) + '">') +
      field("Arabic name", '<input type="text" id="d-ar" dir="rtl" value="' + attr(d.name.ar) + '">') +
    '</div>' +
    field("English description", '<textarea id="d-den">' + esc(d.desc ? d.desc.en : "") + '</textarea>') +
    field("Arabic description", '<textarea id="d-dar" dir="rtl">' + esc(d.desc ? d.desc.ar : "") + '</textarea>') +
    field('Price 1 (' + esc(currencyLabel) + ')',
      '<input type="number" step="0.001" min="0" id="d-price1" value="' + price1Val + '">') +
    field('Price 2 (optional — leave 0 for single price)',
      '<input type="number" step="0.001" min="0" id="d-price2" value="' + price2Val + '">') +
    '<span style="display:block;font-size:.78rem;font-weight:600;color:#6a5640;margin-bottom:5px">Photo</span>' +
    '<div class="imgup">' + preview +
      '<div class="imgup__btns">' +
        '<button class="btn btn--ghost btn--sm" id="d-imgbtn">Upload image</button>' +
        '<button class="btn btn--danger btn--sm" id="d-imgclear">Remove</button>' +
        '<input type="file" id="d-imgfile" accept="image/*" hidden>' +
      '</div></div>' +
    '<span class="subhead" style="margin-top:6px">Labels</span><div class="checks">' + labelChecks + '</div>' +
    '<span class="subhead">Option groups</span><div class="checks">' + groupChecks + '</div>' +
    '<label class="field" style="margin-top:16px;display:flex;align-items:center;gap:10px"><span style="margin:0">Show on menu</span>' +
      '<label class="switch"><input type="checkbox" id="d-visible" ' + (d.hidden ? "" : "checked") + '><span></span></label></label>',
    '<button class="btn btn--ghost" id="d-cancel">Cancel</button><button class="btn" id="d-save">Save dish</button>'
  );

  var imgData = d.image || "";
  $("d-imgbtn").onclick = function () { $("d-imgfile").click(); };
  $("d-imgfile").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return;
    downscale(f, 800, function (dataUrl) {
      imgData = dataUrl;
      $("d-prev").outerHTML = '<img class="imgup__preview" id="d-prev" src="' + dataUrl + '">';
    });
  });
  $("d-imgclear").onclick = function () {
    imgData = "";
    $("d-prev").outerHTML = '<div class="imgup__preview" id="d-prev" style="display:grid;place-items:center;color:#94815f">No image</div>';
  };
  $("d-cancel").onclick = closeModal;

  $("d-save").onclick = function () {
    var en = $("d-en").value.trim(), ar = $("d-ar").value.trim();
    if (!en && !ar) { toast("Enter a dish name"); return; }

    var p1 = parseFloat($("d-price1").value) || 0;
    var p2 = parseFloat($("d-price2").value) || 0;

    var labels = Array.prototype.map.call(document.querySelectorAll(".d-label:checked"), function (c) { return c.value; });
    var ogids  = Array.prototype.map.call(document.querySelectorAll(".d-group:checked"), function (c) { return c.value; });

    var obj = {
      categoryId: $("d-cat").value,
      name: { en: en, ar: ar },
      desc: { en: $("d-den").value.trim(), ar: $("d-dar").value.trim() },
      price: p2 > 0 ? [p1, p2] : p1,
      image: imgData,
      labels: labels,
      optionGroupIds: ogids,
      hidden: !$("d-visible").checked
    };

    if (dishId) { Object.assign(d, obj); }
    else { obj.id = S.uid("d"); state.dishes.push(obj); }

    S.save();
    closeModal();
    toast(dishId ? "Dish updated" : "Dish added");
    refresh();
  };
}
  function toggleDish(id) {
    var d = S.dishes().filter(function (x) { return x.id === id; })[0];
    if (d) { d.hidden = !d.hidden; S.save(); toast(d.hidden ? "Dish hidden" : "Dish shown"); refresh(); }
  }
  function deleteDish(id) {
    var d = S.dishes().filter(function (x) { return x.id === id; })[0];
    confirmModal("Delete dish?", '"' + nameOf(d) + '" will be removed. This cannot be undone.', function () {
      var state = S.get(); state.dishes = state.dishes.filter(function (x) { return x.id !== id; });
      S.save(); closeModal(); toast("Dish deleted"); refresh();
    });
  }

  /* =========================================================
     OPTION GROUPS VIEW
     ========================================================= */
  function renderOptionsView() {
    var groups = S.optionGroups();
    var html =
      '<div class="view__head"><h1>Option groups</h1>' +
      '<button class="btn btn--sm" id="add-group">+ Group</button></div>' +
      '<div class="hint">Build reusable choices like <b>Portion</b>, <b>Choice of side</b> or <b>Add-ons</b>, then attach them to any dish. Customers see these as information — they don\'t place orders here.</div>';
    if (!groups.length) html += '<div class="empty">No option groups yet.</div>';
    groups.forEach(function (g) {
      var type = (g.required ? "Required" : "Optional") + " · " + (g.multi ? "Multiple choice" : "Single choice");
      html += '<div class="list-item">' +
        '<div class="list-item__body">' +
          '<div class="list-item__title">' + esc(nameOf(g)) + ' <span class="muted">(' + (g.options || []).length + ')</span></div>' +
          '<div class="list-item__sub">' + type + ' — ' + esc((g.options || []).map(function (o) { return o.name.en; }).join(", ")) + '</div>' +
        '</div>' +
        '<div class="list-item__actions">' + iconBtn("edit", "Edit", "g-edit", g.id) + iconBtn("trash", "Delete", "g-del", g.id) + '</div>' +
      '</div>';
    });
    $("view").innerHTML = html;
    $("add-group").onclick = function () { editGroup(null); };
    bind("g-edit", function (id) { editGroup(id); });
    bind("g-del", function (id) { deleteGroup(id); });
  }

  function editGroup(id) {
    var state = S.get();
    var g = id ? state.optionGroups.filter(function (x) { return x.id === id; })[0]
               : { name: { en: "", ar: "" }, required: false, multi: false, options: [] };
    var working = S.clone(g);

    function rowsHtml() {
      return working.options.map(function (o, i) {
        return '<div class="optrow" data-i="' + i + '">' +
          '<input type="text" class="o-en" placeholder="Option (EN)" value="' + attr(o.name.en) + '">' +
          '<input type="text" class="o-ar" dir="rtl" placeholder="(AR)" value="' + attr(o.name.ar) + '">' +
          '<input type="number" step="0.001" min="0" class="o-price optrow__price" placeholder="+0" value="' + Number(o.price || 0) + '">' +
          '<button class="iconbtn iconbtn--danger optrow__del" data-del="' + i + '" title="Remove">&times;</button>' +
        '</div>';
      }).join("");
    }

    openModal(id ? "Edit option group" : "Add option group",
      '<div class="row2">' +
        field("English name", '<input type="text" id="g-en" value="' + attr(g.name.en) + '">') +
        field("Arabic name", '<input type="text" id="g-ar" dir="rtl" value="' + attr(g.name.ar) + '">') +
      '</div>' +
      '<div class="checks" style="margin-bottom:16px">' +
        '<label><input type="checkbox" id="g-required" ' + (g.required ? "checked" : "") + '> Required</label>' +
        '<label><input type="checkbox" id="g-multi" ' + (g.multi ? "checked" : "") + '> Allow multiple</label>' +
      '</div>' +
      '<span class="subhead">Options <span class="muted" style="text-transform:none;letter-spacing:0">(price is the add-on amount, leave 0 if none)</span></span>' +
      '<div id="g-rows">' + rowsHtml() + '</div>' +
      '<button class="btn btn--ghost btn--sm" id="g-addopt" style="margin-top:4px">+ Add option</button>',
      '<button class="btn btn--ghost" id="g-cancel">Cancel</button><button class="btn" id="g-save">Save group</button>'
    );

    function syncFromInputs() {
      Array.prototype.forEach.call(document.querySelectorAll("#g-rows .optrow"), function (row) {
        var i = +row.dataset.i;
        working.options[i] = {
          id: working.options[i].id || S.uid("o"),
          name: { en: row.querySelector(".o-en").value.trim(), ar: row.querySelector(".o-ar").value.trim() },
          price: parseFloat(row.querySelector(".o-price").value) || 0
        };
      });
    }
    function redrawRows() { $("g-rows").innerHTML = rowsHtml(); wireRows(); }
    function wireRows() {
      Array.prototype.forEach.call(document.querySelectorAll("[data-del]"), function (b) {
        b.onclick = function () { syncFromInputs(); working.options.splice(+b.dataset.del, 1); redrawRows(); };
      });
    }
    wireRows();
    $("g-addopt").onclick = function () { syncFromInputs(); working.options.push({ id: S.uid("o"), name: { en: "", ar: "" }, price: 0 }); redrawRows(); };
    $("g-cancel").onclick = closeModal;
    $("g-save").onclick = function () {
      syncFromInputs();
      var en = $("g-en").value.trim(), ar = $("g-ar").value.trim();
      if (!en && !ar) { toast("Enter a group name"); return; }
      var opts = working.options.filter(function (o) { return o.name.en || o.name.ar; });
      if (!opts.length) { toast("Add at least one option"); return; }
      var payload = { name: { en: en, ar: ar }, required: $("g-required").checked, multi: $("g-multi").checked, options: opts };
      if (id) { Object.assign(g, payload); }
      else { payload.id = S.uid("og"); state.optionGroups.push(payload); }
      S.save(); closeModal(); toast(id ? "Group updated" : "Group added"); refresh();
    };
  }

  function deleteGroup(id) {
    var state = S.get();
    var used = state.dishes.filter(function (d) { return (d.optionGroupIds || []).indexOf(id) > -1; }).length;
    confirmModal("Delete option group?",
      used ? ("Used by " + used + " dish(es). It will be detached from them.") : "This cannot be undone.",
      function () {
        state.optionGroups = state.optionGroups.filter(function (g) { return g.id !== id; });
        state.dishes.forEach(function (d) {
          d.optionGroupIds = (d.optionGroupIds || []).filter(function (gid) { return gid !== id; });
        });
        S.save(); closeModal(); toast("Group deleted"); refresh();
      });
  }

  /* =========================================================
     RESTAURANT INFO VIEW
     ========================================================= */
  function renderInfoView() {
    var r = S.restaurant();
    var hoursHtml = (r.hours || []).map(function (h, i) {
      return '<div class="card" data-hi="' + i + '">' +
        '<div class="row2">' +
          field("Label (EN)", '<input type="text" class="h-len" value="' + attr(h.label.en) + '">') +
          field("Label (AR)", '<input type="text" class="h-lar" dir="rtl" value="' + attr(h.label.ar) + '">') +
        '</div><div class="row2">' +
          field("Opens", '<input type="time" class="h-open" value="' + attr(h.open) + '">') +
          field("Closes", '<input type="time" class="h-close" value="' + attr(h.close) + '">') +
        '</div>' +
        '<button class="btn btn--danger btn--sm" data-hdel="' + i + '">Remove period</button></div>';
    }).join("");

    $("view").innerHTML =
      '<div class="view__head"><h1>Restaurant info</h1><button class="btn" id="info-save">Save changes</button></div>' +
      '<div class="card">' +
        '<div class="row2">' +
          field("Name (EN)", '<input type="text" id="r-nen" value="' + attr(r.name.en) + '">') +
          field("Name (AR)", '<input type="text" id="r-nar" dir="rtl" value="' + attr(r.name.ar) + '">') +
        '</div><div class="row2">' +
          field("Subtitle (EN)", '<input type="text" id="r-sen" value="' + attr(r.sub.en) + '">') +
          field("Subtitle (AR)", '<input type="text" id="r-sar" dir="rtl" value="' + attr(r.sub.ar) + '">') +
        '</div>' +
        field("Tagline (EN)", '<textarea id="r-ten">' + esc(r.tagline.en) + '</textarea>') +
        field("Tagline (AR)", '<textarea id="r-tar" dir="rtl">' + esc(r.tagline.ar) + '</textarea>') +
        field("Established (year)", '<input type="number" id="r-est" value="' + Number(r.established) + '">') +
      '</div>' +
      '<div class="subhead">Contact</div><div class="card">' +
        field("Phone (with country code, e.g. +97317223466)", '<input type="tel" id="r-phone" value="' + attr(r.phone) + '">') +
        field("WhatsApp number (digits only, e.g. 97317223466)", '<input type="text" id="r-wa" value="' + attr(r.whatsapp) + '">') +
        field("Instagram URL", '<input type="url" id="r-ig" value="' + attr(r.instagram) + '">') +
        field("Google Maps URL", '<input type="url" id="r-map" value="' + attr(r.mapsUrl) + '">') +
        field("Address (EN)", '<textarea id="r-aen">' + esc(r.address.en) + '</textarea>') +
        field("Address (AR)", '<textarea id="r-aar" dir="rtl">' + esc(r.address.ar) + '</textarea>') +
      '</div>' +
      '<div class="subhead">Currency</div><div class="card"><div class="row2">' +
        field("Symbol (EN)", '<input type="text" id="r-cen" value="' + attr(r.currency.en) + '">') +
        field("Symbol (AR)", '<input type="text" id="r-car" dir="rtl" value="' + attr(r.currency.ar) + '">') +
      '</div>' + field("Decimal places", '<input type="number" id="r-cdec" min="0" max="3" value="' + Number(r.currency.decimals) + '">') + '</div>' +
      '<div class="subhead" style="display:flex;justify-content:space-between;align-items:center">Business hours <button class="btn btn--ghost btn--sm" id="add-period">+ Period</button></div>' +
      '<div id="hours-wrap">' + hoursHtml + '</div>';

    $("add-period").onclick = function () {
      var r2 = S.restaurant();
      collectInfo(r2); // keep current edits
      r2.hours.push({ label: { en: "", ar: "" }, open: "09:00", close: "17:00" });
      S.save(); renderInfoView();
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-hdel]"), function (b) {
      b.onclick = function () {
        var r2 = S.restaurant(); collectInfo(r2);
        r2.hours.splice(+b.dataset.hdel, 1); S.save(); renderInfoView();
      };
    });
    $("info-save").onclick = function () {
      var r2 = S.restaurant(); collectInfo(r2); S.save(); toast("Information saved"); renderInfoView();
    };
  }

  function collectInfo(r) {
    r.name = { en: val("r-nen"), ar: val("r-nar") };
    r.sub = { en: val("r-sen"), ar: val("r-sar") };
    r.tagline = { en: val("r-ten"), ar: val("r-tar") };
    r.established = parseInt(val("r-est"), 10) || r.established;
    r.phone = val("r-phone"); r.whatsapp = val("r-wa").replace(/[^0-9]/g, "");
    r.instagram = val("r-ig"); r.mapsUrl = val("r-map");
    r.address = { en: val("r-aen"), ar: val("r-aar") };
    r.currency = { en: val("r-cen"), ar: val("r-car"), decimals: Math.max(0, Math.min(3, parseInt(val("r-cdec"), 10) || 0)) };
    var hrs = [];
    Array.prototype.forEach.call(document.querySelectorAll("#hours-wrap .card"), function (card) {
      hrs.push({
        label: { en: card.querySelector(".h-len").value.trim(), ar: card.querySelector(".h-lar").value.trim() },
        open: card.querySelector(".h-open").value || "00:00",
        close: card.querySelector(".h-close").value || "00:00"
      });
    });
    if (hrs.length) r.hours = hrs;
  }
  function val(id) { var el = $(id); return el ? el.value.trim() : ""; }

  /* =========================================================
     BACKUP & PUBLISH VIEW
     ========================================================= */
  function renderBackupView() {
    $("view").innerHTML =
      '<div class="view__head"><h1>Backup &amp; publish</h1></div>' +
      '<div class="hint">Your menu edits are saved on <b>this device</b>. To show changes to all customers, download the data file and replace <b>assets/js/seed.js</b> in your site, then redeploy. (See README for a no-redeploy backend option.)</div>' +
      '<div class="card"><div class="subhead" style="margin-top:0">Publish to customers</div>' +
        '<p class="muted">Download the current menu as the published data file.</p>' +
        '<button class="btn btn--gold btn--block" id="bk-publish">Download data file (seed.js)</button></div>' +
      '<div class="card"><div class="subhead" style="margin-top:0">Backup</div>' +
        '<button class="btn btn--ghost btn--block" id="bk-export" style="margin-bottom:10px">Export menu (JSON)</button>' +
        '<button class="btn btn--ghost btn--block" id="bk-import">Import menu (JSON)</button>' +
        '<input type="file" id="bk-file" accept="application/json,.json" hidden></div>' +
      '<div class="card"><div class="subhead" style="margin-top:0">Admin password</div>' +
        field("New password", '<input type="password" id="bk-pw1" placeholder="New password">') +
        field("Confirm password", '<input type="password" id="bk-pw2" placeholder="Repeat password">') +
        '<button class="btn btn--block" id="bk-pwsave">Update password</button></div>' +
      '<div class="card"><div class="subhead" style="margin-top:0">Danger zone</div>' +
        '<p class="muted">Reset the menu to the original published version. Your edits on this device will be lost.</p>' +
        '<button class="btn btn--danger btn--block" id="bk-reset">Reset to default menu</button></div>';

    $("bk-publish").onclick = publishFile;
    $("bk-export").onclick = exportJson;
    $("bk-import").onclick = function () { $("bk-file").click(); };
    $("bk-file").addEventListener("change", importJson);
    $("bk-pwsave").onclick = function () {
      var a = $("bk-pw1").value, b = $("bk-pw2").value;
      if (a.length < 4) { toast("Use at least 4 characters"); return; }
      if (a !== b) { toast("Passwords don't match"); return; }
      setPassword(a); $("bk-pw1").value = ""; $("bk-pw2").value = ""; toast("Password updated");
    };
    $("bk-reset").onclick = function () {
      confirmModal("Reset menu?", "This restores the original published menu and discards edits on this device.", function () {
        S.reset(); closeModal(); toast("Menu reset"); route("menu");
      });
    };
  }

  function download(filename, text, type) {
    var blob = new Blob([text], { type: type || "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function exportJson() {
    download("mandali-menu-backup.json", JSON.stringify(S.get(), null, 2), "application/json");
    toast("Backup downloaded");
  }
  function publishFile() {
    // Export the current menu as seed.js. No version — the site always
    // reads this file directly, so whatever you publish is what shows.
    var data = S.get();
    delete data.version;
    S.save();
    var header = "/* Mandali published menu — generated by the admin panel on " +
      new Date().toLocaleString() + " */\n";
    download("seed.js", header + "window.MANDALI_SEED = " + JSON.stringify(data, null, 2) + ";\n", "application/javascript");
    toast("Published — replace assets/js/seed.js, then redeploy");
  }
  function importJson(e) {
    var f = e.target.files[0]; if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data.restaurant || !data.categories || !data.dishes) throw new Error("bad");
        S.set(data); toast("Menu imported"); route("menu");
      } catch (err) { toast("That file isn't a valid menu backup"); }
    };
    reader.readAsText(f);
    e.target.value = "";
  }

  /* =========================================================
     shared UI bits
     ========================================================= */
  function field(label, control) {
    return '<label class="field"><span>' + esc(label) + '</span>' + control + '</label>';
  }
  function iconBtn(kind, title, action, id, disabled) {
    var paths = {
      up: '<path d="M18 15l-6-6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
      edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
      trash: '<path d="M3 6h18M8 6V4h8v2m-1 0v14H9V6"/>'
    };
    return '<button class="iconbtn' + (kind === "trash" ? " iconbtn--danger" : "") + '" data-action="' + action +
      '" data-id="' + id + '" title="' + attr(title) + '"' + (disabled ? " disabled" : "") + '>' +
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + paths[kind] + '</svg></button>';
  }
  function bind(action, fn) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-action="' + action + '"]'), function (el) {
      el.addEventListener("click", function () { fn(el.dataset.id); });
    });
  }
  function confirmModal(title, msg, onYes) {
    openModal(title, '<p class="muted">' + esc(msg) + '</p>',
      '<button class="btn btn--ghost" id="cf-no">Cancel</button><button class="btn btn--danger" id="cf-yes">Delete</button>');
    $("cf-no").onclick = closeModal; $("cf-yes").onclick = onYes;
  }

  /* downscale an uploaded image to keep localStorage small */
  function downscale(file, maxDim, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height, scale = Math.min(1, maxDim / Math.max(w, h));
        var cw = Math.round(w * scale), ch = Math.round(h * scale);
        var c = document.createElement("canvas"); c.width = cw; c.height = ch;
        c.getContext("2d").drawImage(img, 0, 0, cw, ch);
        try { cb(c.toDataURL("image/jpeg", 0.82)); }
        catch (e) { cb(reader.result); }
      };
      img.onerror = function () { cb(reader.result); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------------- boot ---------------- */
  if (isLoggedIn()) showApp();
  else $("pw").focus();
})();
