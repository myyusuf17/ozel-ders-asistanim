(function () {
  "use strict";

  // Şirket e-postası — alan adı alınıp e-posta kurulduğunda burada güncelleyin.
  var CONTACT_EMAIL = "merhaba@ozeldersasistanim.com";

  var STORAGE_KEY = "oda-lang";
  var root = document.documentElement;
  var EN = window.I18N_EN || {};
  var TR = {};
  var TR_ATTR = {};
  var currentLang = "tr";

  // --- i18n -------------------------------------------------------------
  function snapshotTurkish() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!(key in TR)) TR[key] = el.innerHTML;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var parts = pair.split(":");
        var key = parts[1];
        if (!(key in TR_ATTR)) TR_ATTR[key] = el.getAttribute(parts[0]);
      });
    });
  }

  function applyLang(lang) {
    currentLang = lang === "en" ? "en" : "tr";
    var dict = currentLang === "en" ? EN : TR;
    var attrDict = currentLang === "en" ? EN : TR_ATTR;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] != null) {
        if (el.tagName === "TITLE") document.title = dict[key];
        else el.innerHTML = dict[key];
      }
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var parts = pair.split(":");
        if (attrDict[parts[1]] != null) el.setAttribute(parts[0], attrDict[parts[1]]);
      });
    });
    document.querySelectorAll("[data-lang-block]").forEach(function (el) {
      el.hidden = el.getAttribute("data-lang-block") !== currentLang;
    });

    root.lang = currentLang;
    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === currentLang));
    });
    updateMailLinks();
    try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (e) {}
  }

  function initialLang() {
    var fromUrl = new URLSearchParams(location.search).get("lang");
    if (fromUrl === "en" || fromUrl === "tr") return fromUrl;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "tr") return saved;
    } catch (e) {}
    var nav = (navigator.language || "tr").toLowerCase();
    return nav.indexOf("tr") === 0 ? "tr" : "en";
  }

  function updateMailLinks() {
    document.querySelectorAll(".js-mail").forEach(function (a) {
      var subject = currentLang === "en" ? a.dataset.subjectEn : a.dataset.subject;
      a.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject || "");
    });
    document.querySelectorAll(".js-mail-text").forEach(function (a) {
      a.href = "mailto:" + CONTACT_EMAIL;
      a.textContent = CONTACT_EMAIL;
    });
  }

  document.querySelectorAll(".lang-switch button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.dataset.lang);
      var url = new URL(location.href);
      url.searchParams.set("lang", currentLang);
      history.replaceState(null, "", url);
    });
  });

  // --- Mobile menu ------------------------------------------------------
  var toggle = document.querySelector(".menu-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    var setMenu = function (open) {
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  // --- Role tabs (WAI-ARIA tabs pattern) --------------------------------
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab, false); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  // --- Reveal on scroll -------------------------------------------------
  var reveals = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  snapshotTurkish();
  applyLang(initialLang());
})();
