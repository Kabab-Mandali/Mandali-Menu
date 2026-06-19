/* =============================================================
   i18n.js — shared language strings + formatting helpers
   Used by both menu.js (listing) and dish.js (detail page).
   ============================================================= */
(function (global) {
  "use strict";

  var dict = {
    en: {
      since: "Since", viewMenu: "View menu",
      call: "Call", whatsapp: "WhatsApp", location: "Location",
      openNow: "Open now", closedNow: "Closed now",
      until: "until", opensAt: "Opens at", openLater: "Opens later today",
      popular: "Popular", chef: "Chef's pick", "new": "New", spicy: "Spicy",
      heritage: "Three generations of charcoal grilling and Persian-Bahraini cooking in the heart of Isa Town.",
      years: "Years of hospitality",
      note: "This is a digital menu for viewing only. Please place your order with our staff.",
      staff: "Staff login", priceFrom: "from",
      /* detail page */
      menu: "Menu", backToMenu: "Back to menu",
      choices: "Choices & extras", chooseOne: "Choose one", chooseAny: "Choose any",
      included: "included", notFound: "Dish not found",
      notFoundBody: "This item may have been removed from the menu.",
      details: "Details"
    },
    ar: {
      since: "منذ", viewMenu: "تصفّح القائمة",
      call: "اتصل", whatsapp: "واتساب", location: "الموقع",
      openNow: "مفتوح الآن", closedNow: "مغلق الآن",
      until: "حتى", opensAt: "يفتح الساعة", openLater: "يفتح لاحقاً اليوم",
      popular: "الأكثر طلباً", chef: "اختيار الشيف", "new": "جديد", spicy: "حار",
      heritage: "ثلاثة أجيال من الشواء على الفحم والمطبخ الفارسي البحريني في قلب مدينة عيسى.",
      years: "عاماً من الضيافة",
      note: "هذه قائمة رقمية للعرض فقط. يُرجى الطلب من موظفينا.",
      staff: "دخول الموظفين", priceFrom: "ابتداءً من",
      /* detail page */
      menu: "القائمة", backToMenu: "العودة إلى القائمة",
      choices: "الخيارات والإضافات", chooseOne: "اختر واحداً", chooseAny: "اختر ما تشاء",
      included: "مشمول", notFound: "الطبق غير موجود",
      notFoundBody: "قد يكون هذا الصنف قد أُزيل من القائمة.",
      details: "التفاصيل"
    }
  };

  var AR_DIGITS = { "0": "٠", "1": "١", "2": "٢", "3": "٣", "4": "٤", "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩" };

  function t(lang, k) { var d = dict[lang] || dict.en; return (d[k] != null) ? d[k] : (dict.en[k] != null ? dict.en[k] : k); }
  function L(lang, obj) { if (!obj) return ""; return (lang === "ar" ? obj.ar : obj.en) || obj.en || obj.ar || ""; }
  function digits(lang, str) {
    if (lang !== "ar") return String(str);
    return String(str).replace(/[0-9]/g, function (d) { return AR_DIGITS[d]; });
  }
  function price(lang, v) {
    var S = global.Store;
    return digits(lang, S ? S.formatPrice(v, lang) : v);
  }
  function fmtTime(lang, t24) {
    var p = String(t24).split(":"); var h = +p[0], m = p[1] || "00";
    if (lang === "ar") return digits(lang, ("0" + h).slice(-2) + ":" + m);
    var ap = h >= 12 && h < 24 ? "PM" : "AM"; var h12 = h % 12; if (h12 === 0) h12 = 12;
    if (h === 24 || h === 0) { h12 = 12; ap = "AM"; }
    return h12 + (m === "00" ? "" : ":" + m) + " " + ap;
  }
  function tagIcon(lb) {
    if (lb === "popular") return '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/></svg>';
    if (lb === "spicy") return '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 3c0 3 2 4 2 7 5 0 8 3 8 8 0 1-1 2-3 2-7 0-12-5-12-12 0-2 1-3 2-3 2 0 3 1 3-2z"/></svg>';
    if (lb === "chef") return '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M7 21h10v-2H7zM17 8a5 5 0 0 0-10 0 4 4 0 0 0 1 7h8a4 4 0 0 0 1-7z"/></svg>';
    return "";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  global.MandaliI18n = {
    dict: dict, t: t, L: L, digits: digits, price: price,
    fmtTime: fmtTime, tagIcon: tagIcon, esc: esc
  };
})(typeof window !== "undefined" ? window : this);
