/* HotelOS — Layout shell + reusable components */
(function () {
  const NAV = [
    { id: "dashboard",   label: "Dashboard",   icon: "layout-dashboard", href: "index.html" },
    { id: "reservations",label: "Reservations", icon: "calendar-check",   href: "reservations.html" },
    { id: "front-desk",  label: "Front Desk",  icon: "concierge-bell",   href: "front-desk.html" },
    { id: "rooms",       label: "Rooms",       icon: "bed-double",        href: "rooms.html" },
    { id: "guests",      label: "Guests",      icon: "users",             href: "guests.html" },
    { id: "housekeeping",label: "Housekeeping",icon: "sparkles",          href: "housekeeping.html" },
    { id: "billing",     label: "Billing",     icon: "receipt",           href: "billing.html" },
    { id: "reports",     label: "Reports",     icon: "bar-chart-3",       href: "reports.html" },
    { id: "settings",    label: "Settings",    icon: "settings",          href: "settings.html" },
  ];

  // ---------- Reusable component helpers (exposed on window.UI) ----------
  const money = (n) => "$" + n.toLocaleString("en-US");

  const badgeMap = {
    // reservation
    "Confirmed":   "bg-indigo-50 text-indigo-700 ring-indigo-200",
    "Pending":     "bg-amber-50 text-amber-700 ring-amber-200",
    "Checked-in":  "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Cancelled":   "bg-gray-100 text-gray-500 ring-gray-200",
    // payment / invoice
    "Paid":        "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Partial":     "bg-amber-50 text-amber-700 ring-amber-200",
    "Refunded":    "bg-gray-100 text-gray-600 ring-gray-200",
    "Overdue":     "bg-red-50 text-red-700 ring-red-200",
    // rooms
    "Available":   "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Occupied":    "bg-indigo-50 text-indigo-700 ring-indigo-200",
    "Reserved":    "bg-violet-50 text-violet-700 ring-violet-200",
    "Cleaning":    "bg-amber-50 text-amber-700 ring-amber-200",
    "Maintenance": "bg-red-50 text-red-700 ring-red-200",
    // priority
    "High":        "bg-red-50 text-red-700 ring-red-200",
    "Medium":      "bg-amber-50 text-amber-700 ring-amber-200",
    "Low":         "bg-gray-100 text-gray-600 ring-gray-200",
  };

  function badge(status) {
    const cls = badgeMap[status] || "bg-gray-100 text-gray-600 ring-gray-200";
    return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}">
      <span class="size-1.5 rounded-full bg-current opacity-70"></span>${status}</span>`;
  }
  function dot(status){
    const cls = (badgeMap[status]||"").split(" ").find(c=>c.startsWith("text-"))||"text-gray-400";
    return `<span class="size-2 rounded-full bg-current ${cls}"></span>`;
  }

  function avatar(initials, vip) {
    return `<span class="relative grid size-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">${initials}
      ${vip ? '<span class="absolute -right-0.5 -top-0.5 grid size-3.5 place-items-center rounded-full bg-amber-400 text-white"><i data-lucide="star" class="size-2"></i></span>' : ""}</span>`;
  }

  function kpiCard({ label, value, delta, deltaUp, icon, sub }) {
    const up = deltaUp;
    return `<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div class="flex items-start justify-between">
        <span class="grid size-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><i data-lucide="${icon}" class="size-4.5"></i></span>
        ${delta ? `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${up?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'}">
          <i data-lucide="${up?'trending-up':'trending-down'}" class="size-3"></i>${delta}</span>` : ""}
      </div>
      <p class="mt-4 text-sm text-gray-500">${label}</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight text-gray-900">${value}</p>
      ${sub ? `<p class="mt-1 text-xs text-gray-400">${sub}</p>` : ""}
    </div>`;
  }

  function sectionCard(title, body, action) {
    return `<section class="rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <header class="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
        <h3 class="text-sm font-semibold text-gray-900">${title}</h3>
        ${action || ""}
      </header>
      <div>${body}</div>
    </section>`;
  }

  function emptyState(icon, title, msg) {
    return `<div class="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span class="grid size-12 place-items-center rounded-full bg-gray-50 text-gray-400"><i data-lucide="${icon}" class="size-6"></i></span>
      <p class="mt-1 text-sm font-medium text-gray-900">${title}</p>
      <p class="max-w-xs text-sm text-gray-500">${msg}</p>
    </div>`;
  }

  // Lightweight inline SVG sparkline / bar chart
  function lineChart(data, color = "#4F46E5", h = 120) {
    const w = 520, max = Math.max(...data), min = Math.min(...data);
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 16) - 8;
      return [x, y];
    });
    const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = path + ` L ${w} ${h} L 0 ${h} Z`;
    const id = "g" + Math.random().toString(36).slice(2, 7);
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="h-32 w-full">
      <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#${id})"/>
      <path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  function barChart(data, color = "#4F46E5") {
    const max = Math.max(...data);
    return `<div class="flex h-32 items-end gap-1.5">
      ${data.map((v) => `<div class="flex-1 rounded-t-md transition-all hover:opacity-80" style="height:${(v / max) * 100}%;background:${color};opacity:.85"></div>`).join("")}
    </div>`;
  }

  function donut(segments) { // [{value,color,label}]
    const total = segments.reduce((s, x) => s + x.value, 0);
    let acc = 0; const r = 52, c = 2 * Math.PI * r;
    const rings = segments.map((s) => {
      const len = (s.value / total) * c;
      const el = `<circle r="${r}" cx="70" cy="70" fill="none" stroke="${s.color}" stroke-width="16"
        stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"/>`;
      acc += len; return el;
    }).join("");
    return `<svg viewBox="0 0 140 140" class="size-36">${rings}
      <text x="70" y="66" text-anchor="middle" class="fill-gray-900 text-[18px] font-semibold">${total}</text>
      <text x="70" y="84" text-anchor="middle" class="fill-gray-400 text-[9px]">rooms</text></svg>`;
  }

  window.UI = { money, badge, dot, avatar, kpiCard, sectionCard, emptyState, lineChart, barChart, donut };

  // ---------- Shell ----------
  function sidebar(active) {
    return `<aside id="sidebar" class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-gray-200 bg-white transition-all duration-200 lg:translate-x-0">
      <div class="flex h-16 items-center gap-2.5 px-5">
        <span class="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white"><i data-lucide="hotel" class="size-4.5"></i></span>
        <span class="sb-label text-[15px] font-semibold tracking-tight text-gray-900">HotelOS</span>
      </div>
      <nav class="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        ${NAV.map((n) => `<a href="${n.href}" class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition
          ${n.id === active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}">
          <i data-lucide="${n.icon}" class="size-[18px] ${n.id === active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}"></i>
          <span class="sb-label">${n.label}</span></a>`).join("")}
      </nav>
      <div class="border-t border-gray-100 p-3">
        <div class="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50">
          <span class="grid size-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">AR</span>
          <div class="sb-label min-w-0 flex-1"><p class="truncate text-sm font-medium text-gray-900">Aniruth R.</p><p class="truncate text-xs text-gray-400">Front Office Mgr</p></div>
          <i data-lucide="chevrons-up-down" class="sb-label size-4 text-gray-400"></i>
        </div>
      </div>
    </aside>`;
  }

  function topbar(title) {
    return `<header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <button id="menuBtn" class="grid size-9 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"><i data-lucide="menu" class="size-5"></i></button>
      <button id="collapseBtn" class="hidden size-9 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 lg:grid"><i data-lucide="panel-left" class="size-5"></i></button>
      <h1 class="hidden text-[15px] font-semibold text-gray-900 sm:block">${title}</h1>
      <div class="mx-auto hidden w-full max-w-md items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 md:flex">
        <i data-lucide="search" class="size-4"></i>
        <input placeholder="Search guests, rooms, reservations…" class="w-full bg-transparent text-gray-700 placeholder:text-gray-400 focus:outline-none"/>
        <kbd class="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400">⌘K</kbd>
      </div>
      <div class="ml-auto flex items-center gap-1">
        <button class="relative grid size-9 place-items-center rounded-lg text-gray-500 hover:bg-gray-100">
          <i data-lucide="bell" class="size-5"></i><span class="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white"></span></button>
        <button class="hidden items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex">
          <span class="grid size-5 place-items-center rounded bg-indigo-600 text-[10px] text-white">G</span>Grand Marina<i data-lucide="chevron-down" class="size-4 text-gray-400"></i></button>
        <div class="ml-1 grid size-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">AR</div>
      </div>
    </header>`;
  }

  window.renderLayout = function (active, title, contentHtml) {
    const nav = NAV.find((n) => n.id === active) || { label: title };
    document.body.className = "bg-[#FAFAFA] text-gray-900 antialiased";
    document.body.innerHTML = `
      ${sidebar(active)}
      <div id="overlay" class="fixed inset-0 z-30 hidden bg-gray-900/30 backdrop-blur-sm lg:hidden"></div>
      <div id="main" class="lg:pl-64 transition-all duration-200">
        ${topbar(title || nav.label)}
        <main class="px-4 py-6 sm:px-6 lg:px-8">${contentHtml}</main>
      </div>
      <div id="drawer-root"></div>`;

    // interactions
    const sb = document.getElementById("sidebar");
    const main = document.getElementById("main");
    const overlay = document.getElementById("overlay");
    document.getElementById("menuBtn")?.addEventListener("click", () => {
      sb.classList.toggle("-translate-x-full"); overlay.classList.toggle("hidden");
    });
    overlay?.addEventListener("click", () => { sb.classList.add("-translate-x-full"); overlay.classList.add("hidden"); });
    document.getElementById("collapseBtn")?.addEventListener("click", () => {
      const collapsed = sb.classList.toggle("lg:w-16");
      sb.querySelectorAll(".sb-label").forEach((e) => e.classList.toggle("hidden", collapsed));
      main.classList.toggle("lg:pl-64", !collapsed); main.classList.toggle("lg:pl-16", collapsed);
    });
    if (window.lucide) lucide.createIcons();
  };

  // Generic drawer
  window.openDrawer = function (title, bodyHtml, width = "max-w-md") {
    const root = document.getElementById("drawer-root");
    root.innerHTML = `
      <div class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-gray-900/30 backdrop-blur-sm opacity-0 transition-opacity duration-200" id="dwOverlay"></div>
        <div class="absolute inset-y-0 right-0 flex w-full ${width} translate-x-full flex-col bg-white shadow-2xl transition-transform duration-200" id="dwPanel">
          <header class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 class="text-sm font-semibold text-gray-900">${title}</h3>
            <button id="dwClose" class="grid size-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"><i data-lucide="x" class="size-4.5"></i></button>
          </header>
          <div class="flex-1 overflow-y-auto">${bodyHtml}</div>
        </div>
      </div>`;
    requestAnimationFrame(() => {
      root.querySelector("#dwOverlay").classList.remove("opacity-0");
      root.querySelector("#dwPanel").classList.remove("translate-x-full");
    });
    const close = () => {
      root.querySelector("#dwOverlay").classList.add("opacity-0");
      root.querySelector("#dwPanel").classList.add("translate-x-full");
      setTimeout(() => (root.innerHTML = ""), 200);
    };
    root.querySelector("#dwClose").addEventListener("click", close);
    root.querySelector("#dwOverlay").addEventListener("click", close);
    if (window.lucide) lucide.createIcons();
  };

  // Generic modal
  window.openModal = function (title, bodyHtml) {
    const root = document.getElementById("drawer-root");
    root.innerHTML = `<div class="fixed inset-0 z-50 grid place-items-center p-4">
      <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" id="mdOverlay"></div>
      <div class="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl">
        <header class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 class="text-sm font-semibold text-gray-900">${title}</h3>
          <button id="mdClose" class="grid size-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"><i data-lucide="x" class="size-4.5"></i></button>
        </header>
        <div class="p-5">${bodyHtml}</div>
      </div></div>`;
    const close = () => (root.innerHTML = "");
    root.querySelector("#mdClose").addEventListener("click", close);
    root.querySelector("#mdOverlay").addEventListener("click", close);
    if (window.lucide) lucide.createIcons();
  };
})();
