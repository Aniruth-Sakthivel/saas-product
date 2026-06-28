/* HotelOS marketing site — shared navbar, footer & UI helpers */
(function () {
  const NAV = [
    { label: "Features", href: "features.html" },
    { label: "Pricing", href: "pricing.html" },
    { label: "Customers", href: "index.html#testimonials" },
    { label: "FAQ", href: "faq.html" },
  ];

  function navbar(active) {
    return `<header class="sticky top-0 z-50 border-b border-gray-200/70 bg-white/70 backdrop-blur-xl">
      <nav class="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <a href="index.html" class="flex items-center gap-2">
          <span class="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm"><i data-lucide="hotel" class="size-4.5"></i></span>
          <span class="text-[17px] font-semibold tracking-tight text-gray-900">HotelOS</span>
        </a>
        <div class="ml-2 hidden items-center gap-1 md:flex">
          ${NAV.map(n => `<a href="${n.href}" class="rounded-lg px-3 py-2 text-sm font-medium ${active===n.label?'text-indigo-600':'text-gray-600 hover:text-gray-900'} transition">${n.label}</a>`).join("")}
        </div>
        <div class="ml-auto hidden items-center gap-2 md:flex">
          <a href="contact.html" class="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition">Book Demo</a>
          <a href="signup.html" class="rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95">Start Free Trial</a>
        </div>
        <button id="navToggle" class="ml-auto grid size-9 place-items-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"><i data-lucide="menu" class="size-5"></i></button>
      </nav>
      <div id="mobileNav" class="hidden border-t border-gray-200 bg-white px-5 py-4 md:hidden">
        <div class="flex flex-col gap-1">
          ${NAV.map(n => `<a href="${n.href}" class="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">${n.label}</a>`).join("")}
          <div class="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3">
            <a href="contact.html" class="rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700">Book Demo</a>
            <a href="signup.html" class="rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2.5 text-center text-sm font-semibold text-white">Start Free Trial</a>
          </div>
        </div>
      </div>
    </header>`;
  }

  function footer() {
    const cols = [
      ["Product", [["Features","features.html"],["Pricing","pricing.html"],["Demo","contact.html"],["Changelog","#"]]],
      ["Company", [["About","about.html"],["Customers","index.html#testimonials"],["Careers","#"],["Contact","contact.html"]]],
      ["Resources", [["Documentation","#"],["Help Center","faq.html"],["API","#"],["Status","#"]]],
      ["Legal", [["Privacy","#"],["Terms","#"],["Security","#"],["GDPR","#"]]],
    ];
    return `<footer class="border-t border-gray-200 bg-white">
      <div class="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div class="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div class="col-span-2">
            <a href="index.html" class="flex items-center gap-2">
              <span class="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white"><i data-lucide="hotel" class="size-4.5"></i></span>
              <span class="text-[17px] font-semibold tracking-tight text-gray-900">HotelOS</span></a>
            <p class="mt-4 max-w-xs text-sm text-gray-500">Modern hotel management software for growing hotels, resorts, and boutique stays.</p>
            <div class="mt-5 flex gap-2">
              ${["twitter","linkedin","instagram","github"].map(i=>`<a href="#" class="grid size-9 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"><i data-lucide="${i}" class="size-4"></i></a>`).join("")}
            </div>
          </div>
          ${cols.map(([t,links])=>`<div><h4 class="text-sm font-semibold text-gray-900">${t}</h4>
            <ul class="mt-3 space-y-2.5">${links.map(([l,h])=>`<li><a href="${h}" class="text-sm text-gray-500 transition hover:text-gray-900">${l}</a></li>`).join("")}</ul></div>`).join("")}
        </div>
        <div class="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
          <p class="text-sm text-gray-400">© 2026 HotelOS, Inc. All rights reserved.</p>
          <p class="flex items-center gap-1.5 text-sm text-gray-400"><span class="size-2 rounded-full bg-emerald-500"></span>All systems operational</p>
        </div>
      </div>
    </footer>`;
  }

  // Reusable UI bits
  window.SITE = {
    badge(text, icon) {
      return `<span class="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
        ${icon?`<i data-lucide="${icon}" class="size-3.5"></i>`:""}${text}</span>`;
    },
    sectionHead({ eyebrow, title, sub, center = true }) {
      return `<div class="${center?'mx-auto max-w-2xl text-center':'max-w-2xl'}">
        ${eyebrow?`<p class="text-sm font-semibold text-indigo-600">${eyebrow}</p>`:""}
        <h2 class="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">${title}</h2>
        ${sub?`<p class="mt-4 text-lg leading-relaxed text-gray-500">${sub}</p>`:""}
      </div>`;
    },
  };

  // Inject global animation styles once
  function injectAnimStyles() {
    if (document.getElementById("hos-anim")) return;
    const s = document.createElement("style");
    s.id = "hos-anim";
    s.textContent = `
      @keyframes hos-fade-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
      @keyframes hos-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
      @keyframes hos-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
      @keyframes hos-blob{0%,100%{transform:translate(-50%,0) scale(1)}50%{transform:translate(-50%,20px) scale(1.08)}}
      @keyframes hos-pop{0%{opacity:0;transform:scale(.96)}100%{opacity:1;transform:scale(1)}}
      .reveal{opacity:0}
      .reveal.in{animation:hos-fade-up .6s cubic-bezier(.22,.8,.18,1) both}
      .chart-bar{animation:hos-grow .8s cubic-bezier(.22,.8,.18,1) both}
      .animate-float{animation:hos-float 5s ease-in-out infinite}
      .animate-float-slow{animation:hos-float 7s ease-in-out infinite}
      .animate-blob{animation:hos-blob 9s ease-in-out infinite}
      .hover-lift{transition:transform .25s cubic-bezier(.22,.8,.18,1),box-shadow .25s ease}
      .hover-lift:hover{transform:translateY(-4px)}
      a,button{transition:color .2s ease,background-color .2s ease,opacity .2s ease,box-shadow .2s ease,transform .2s ease}
      [data-chevron]{transition:transform .25s ease}
      @media(prefers-reduced-motion:reduce){.reveal,.reveal.in,.chart-bar,.animate-float,.animate-float-slow,.animate-blob{animation:none!important;opacity:1!important;transform:none!important}}
    `;
    document.head.appendChild(s);
  }

  // Scroll-reveal with per-row stagger
  window.setupReveal = function () {
    const els = document.querySelectorAll("section h1, section h2, section p.text-lg, section .grid > *, main .grid > *, figure, [data-accordion]");
    els.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
        const idx = Math.max(0, sibs.indexOf(el));
        el.style.animationDelay = Math.min(idx, 8) * 70 + "ms";
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { threshold: 0.06, rootMargin: "0px 0px -40px 0px" });
    els.forEach((el) => io.observe(el));
  };

  // Mount shared chrome + init icons + interactions
  window.mountChrome = function (active) {
    injectAnimStyles();
    const nb = document.getElementById("navbar");
    const ft = document.getElementById("footer");
    if (nb) nb.innerHTML = navbar(active);
    if (ft) ft.innerHTML = footer();
    if (window.lucide) lucide.createIcons();
    const toggle = document.getElementById("navToggle");
    toggle?.addEventListener("click", () => document.getElementById("mobileNav").classList.toggle("hidden"));
    // accordion
    document.querySelectorAll("[data-accordion]").forEach((item) => {
      const btn = item.querySelector("button");
      const body = item.querySelector("[data-body]");
      const icon = item.querySelector("[data-chevron]");
      btn.addEventListener("click", () => {
        const open = !body.classList.contains("hidden");
        document.querySelectorAll("[data-accordion] [data-body]").forEach((b) => b.classList.add("hidden"));
        document.querySelectorAll("[data-accordion] [data-chevron]").forEach((c) => c.classList.remove("rotate-180"));
        if (open) return;
        body.classList.remove("hidden");
        icon.classList.add("rotate-180");
      });
    });
    // entrance animations
    window.setupReveal();
  };
})();
