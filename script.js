const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const header = qs("#siteHeader");
const menuButton = qs("#menuButton");
const mobileMenu = qs("#mobileMenu");
const cursor = qs("#cursor");
const previewCard = qs("#previewCard");
const contactForm = qs("#contactForm");
const canvas = qs("#scene");
const main = qs("main");
const footer = qs(".site-footer");

const phone = "971503391025";
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function setHeaderState() {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
}

function toggleMenu(force) {
  const isOpen = typeof force === "boolean" ? force : !mobileMenu.classList.contains("is-open");
  const wasOpen = mobileMenu.classList.contains("is-open");
  mobileMenu.classList.toggle("is-open", isOpen);
  menuButton.classList.toggle("is-open", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("menu-open", isOpen);
  main?.toggleAttribute("inert", isOpen);
  footer?.toggleAttribute("inert", isOpen);

  if (isOpen) {
    qs("a", mobileMenu)?.focus();
  } else if (wasOpen) {
    menuButton?.focus();
  }
}

function initMenu() {
  menuButton?.addEventListener("click", () => toggleMenu());
  qsa(".mobile-menu a").forEach((link) => link.addEventListener("click", () => toggleMenu(false)));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") toggleMenu(false);
    if (event.key !== "Tab" || !mobileMenu?.classList.contains("is-open")) return;

    const focusable = qsa("a, button", mobileMenu);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function initCursor() {
  if (!cursor || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  window.addEventListener("pointermove", (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });

  qsa("a, button, input, textarea, .project-row").forEach((item) => {
    item.addEventListener("pointerenter", () => cursor.classList.add("is-hovering"));
    item.addEventListener("pointerleave", () => cursor.classList.remove("is-hovering"));
  });
}

function initReveal() {
  const threshold = window.innerWidth < 700 ? 0.1 : 0.18;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold, rootMargin: "0px 0px -40px" });

  qsa(".reveal").forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 5, 4) * 60}ms`;
    observer.observe(el);
  });
}

function initCounters() {
  const counters = qsa("[data-count]");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count || 0);
      const start = performance.now();
      const duration = 950;

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.45 });

  counters.forEach((counter) => observer.observe(counter));
}

function initProjectPreview() {
  if (!previewCard || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  qsa(".project-row").forEach((row) => {
    row.addEventListener("pointerenter", () => {
      const number = previewCard.querySelector(".preview-card-number");
      if (number) number.textContent = row.dataset.preview || "00";
      previewCard.classList.add("is-visible");
    });
    row.addEventListener("pointerleave", () => {
      previewCard.classList.remove("is-visible");
    });
  });
}

function initSmoothAnchors() {
  qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = qs(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotionQuery.matches ? "auto" : "smooth", block: "start" });
    });
  });
}

function initContactForm() {
  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = data.get("name") || "";
    const email = data.get("email") || "";
    const message = data.get("message") || "";
    const text = `Hello Hashmin, my name is ${name}. Email: ${email}. Project: ${message}`;
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(text)}`;
    const link = document.createElement("a");
    link.href = whatsappUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.append(link);
    link.click();
    link.remove();
  });
}

function initCanvasScene() {
  if (!canvas || reduceMotionQuery.matches) {
    canvas?.remove();
    return;
  }
  const ctx = canvas.getContext("2d");
  const pointer = { x: 0.5, y: 0.5 };
  const particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationId = 0;
  let resizeId = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles.length = 0;
    const count = width < 700 ? 46 : 72;
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.7,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        hue: Math.random() > 0.58 ? "214,255,54" : Math.random() > 0.5 ? "255,63,110" : "143,163,255"
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(
      width * (0.62 + (pointer.x - 0.5) * 0.08),
      height * (0.42 + (pointer.y - 0.5) * 0.08),
      20,
      width * 0.62,
      height * 0.42,
      Math.max(width, height) * 0.72
    );
    gradient.addColorStop(0, "rgba(214,255,54,0.15)");
    gradient.addColorStop(0.3, "rgba(255,63,110,0.08)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    particles.forEach((particle, index) => {
      particle.x += particle.vx + (pointer.x - 0.5) * 0.08;
      particle.y += particle.vy + Math.sin(time * 0.001 + index) * 0.08;

      if (particle.x < -30) particle.x = width + 30;
      if (particle.x > width + 30) particle.x = -30;
      if (particle.y < -30) particle.y = height + 30;
      if (particle.y > height + 30) particle.y = -30;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particle.hue},0.55)`;
      ctx.fill();

      for (let j = index + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.hypot(dx, dy);
        const connectionDistance = width < 700 ? 80 : 108;
        if (distance < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(244,240,232,${0.08 * (1 - distance / connectionDistance)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    animationId = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeId);
    resizeId = window.setTimeout(resize, 120);
  });
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / width;
    pointer.y = event.clientY / height;
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animationId = requestAnimationFrame(draw);
    }
  });

  resize();
  animationId = requestAnimationFrame(draw);
}

window.addEventListener("scroll", setHeaderState, { passive: true });

document.addEventListener("DOMContentLoaded", () => {
  setHeaderState();
  initMenu();
  initCursor();
  initReveal();
  initCounters();
  initProjectPreview();
  initSmoothAnchors();
  initContactForm();
  initCanvasScene();
});
