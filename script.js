/* ── Nav: scroll state + mobile menu ── */
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");

window.addEventListener(
  "scroll",
  () => {
    nav.classList.toggle("scrolled", window.scrollY > 10);
  },
  { passive: true },
);

burger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute(
    "aria-label",
    open ? "Close navigation menu" : "Open navigation menu",
  );
});

navLinks.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open navigation menu");
  });
});

/* ── Scroll reveal ── */
const reduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const revealEls = document.querySelectorAll(".reveal");

if (reduced) {
  revealEls.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  revealEls.forEach((el) => io.observe(el));
}

/* ── Terminal typing effect ── */
const terminalBody = document.getElementById("terminalBody");
const lines = [
  {
    html: '<span class="c">{% comment %} Product section — your store {% endcomment %}</span>',
  },
  {
    html: '<span class="k">&lt;section</span> <span class="t">id</span>=<span class="s">"product-hero"</span><span class="k">&gt;</span>',
  },
  {
    html: '&nbsp;&nbsp;<span class="k">{% for</span> variant <span class="k">in</span> product.variants <span class="k">%}</span>',
  },
  {
    html: '&nbsp;&nbsp;&nbsp;&nbsp;<span class="t">{{ variant.title | escape }}</span>',
  },
  {
    html: '&nbsp;&nbsp;&nbsp;&nbsp;<span class="t">{{ variant.price | money }}</span>',
  },
  { html: '&nbsp;&nbsp;<span class="k">{% endfor %}</span>' },
  { html: '<span class="k">&lt;/section&gt;</span>' },
];

function typeTerminal() {
  terminalBody.innerHTML = "";
  if (reduced) {
    terminalBody.innerHTML = lines
      .map((l) => "<div>" + l.html + "</div>")
      .join("");
    return;
  }
  let li = 0;
  function nextLine() {
    if (li >= lines.length) return;
    const div = document.createElement("div");
    div.innerHTML = '<span class="cursor"></span>';
    terminalBody.appendChild(div);
    const full = lines[li].html;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      div.innerHTML = full.slice(0, i) + '<span class="cursor"></span>';
      if (i >= full.length) {
        clearInterval(timer);
        div.innerHTML = full;
        li++;
        setTimeout(nextLine, 200);
      }
    }, 10);
  }
  nextLine();
}
typeTerminal();

/* ── Demo access: copy + toast ── */
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
  document.body.appendChild(el);
  el.focus();
  el.select();
  try {
    document.execCommand("copy");
  } catch (e) {}
  document.body.removeChild(el);
  return Promise.resolve();
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

document.querySelectorAll(".btn--copy").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pass = btn.dataset.password;
    copyText(pass).then(() => {
      const orig = btn.textContent;
      btn.textContent = "Copied!";
      showToast("Password copied!");
      setTimeout(() => {
        btn.textContent = orig;
      }, 2000);
    });
  });
});

document.querySelectorAll(".demo-pass").forEach((el) => {
  el.addEventListener("click", () => {
    copyText(el.textContent.trim()).then(() =>
      showToast("Password copied!"),
    );
  });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      el.click();
    }
  });
});

document.querySelectorAll(".btn--demo-open").forEach((btn) => {
  btn.addEventListener("click", () => {
    const url = btn.dataset.url;
    const pass = btn.dataset.password;
    copyText(pass).then(() => {
      showToast("Password copied — paste it on the next page.");
      setTimeout(() => window.open(url, "_blank", "noopener"), 450);
    });
  });
});

/* ── Project details accordion ── */
document.querySelectorAll(".pd-toggle").forEach((btn) => {
  const content = document.getElementById(
    btn.getAttribute("aria-controls"),
  );
  if (!content) return;

  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";

    if (!expanded) {
      // Open
      btn.setAttribute("aria-expanded", "true");
      content.removeAttribute("aria-hidden");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          content.style.maxHeight = content.scrollHeight + "px";
          content.style.opacity = "1";
        });
      });
    } else {
      // Close
      btn.setAttribute("aria-expanded", "false");
      content.style.maxHeight = "0";
      content.style.opacity = "0";
      setTimeout(() => content.setAttribute("aria-hidden", "true"), 330);
    }
  });
});

/* ── Equalize project-card heights within each row (desktop 2-col grid) ──
     Keeps cards the same height by default, while still letting a single
     card grow on its own when its "Project Details" panel is opened —
     siblings no longer stretch along with it (see .work__grid{align-items:start}). */
(function () {
  const grid = document.querySelector(".work__grid");
  if (!grid) return;
  const mq = window.matchMedia("(min-width:881px)");

  function closedHeight(card) {
    const pd = card.querySelector(".pd-content");
    if (!pd || pd.getAttribute("aria-hidden") === "true")
      return card.offsetHeight;
    // Panel is currently open — temporarily measure the collapsed height.
    const prevTransition = pd.style.transition;
    const prevMaxHeight = pd.style.maxHeight;
    const prevOpacity = pd.style.opacity;
    pd.style.transition = "none";
    pd.style.maxHeight = "0px";
    pd.style.opacity = "0";
    const h = card.offsetHeight;
    pd.style.maxHeight = prevMaxHeight;
    pd.style.opacity = prevOpacity;
    void pd.offsetHeight; // force reflow before restoring the transition
    pd.style.transition = prevTransition;
    return h;
  }

  function equalize() {
    const cards = Array.from(grid.querySelectorAll(":scope > .card"));
    if (!cards.length) return;
    cards.forEach((c) => {
      c.style.minHeight = "";
    });
    if (!mq.matches) return; // single column on mobile — nothing to match
    for (let i = 0; i < cards.length; i += 2) {
      const row = cards.slice(i, i + 2);
      const max = Math.max(...row.map(closedHeight));
      row.forEach((c) => {
        c.style.minHeight = max + "px";
      });
    }
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(equalize, 150);
  });
  window.addEventListener("load", equalize);
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(equalize);
  equalize();
})();

/* ── Project screenshot gallery (reusable component) ──
     Each project card just needs: <div class="gallery" data-gallery data-images="a.webp,b.webp,...">
     No JS edits are needed to add a new project — only the data-images list. */
(function () {
  function svgChevron(direction) {
    const rotation =
      direction === "up" ? "" : ' style="transform:rotate(180deg)"';
    return (
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"' +
      rotation +
      '><path d="M6 15l6-6 6 6"/></svg>'
    );
  }

  class Gallery {
    constructor(root, options) {
      options = options || {};
      this.root = root;
      this.images = (root.dataset.images || "")
        .split(",")
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      this.alt = root.dataset.alt || "Project screenshot";
      this.isLightbox = !!options.isLightbox;
      this.onActivate = options.onActivate || null; // called with current index when a slide is opened
      this.current = 0;
      this.suppressClick = false;
      this._touchStartY = null;

      if (!this.images.length) return;

      this._build();
      this._bind();
      this._render(false);
    }

    _build() {
      const root = this.root;

      this.track = document.createElement("div");
      this.track.className = "gallery__track";
      root.appendChild(this.track);

      this.slides = this.images.map((src, i) => {
        const slide = document.createElement("div");
        slide.className = "gallery__slide";
        slide.dataset.fallbackLabel =
          "Screenshot " + (i + 1) + " — add " + src;

        const img = document.createElement("img");
        img.alt =
          this.alt + " — part " + (i + 1) + " of " + this.images.length;
        img.loading = "lazy";
        img.decoding = "async";
        img.draggable = false;
        img.dataset.src = src;
        img.addEventListener("error", () =>
          slide.classList.add("gallery__slide--broken"),
        );

        slide.appendChild(img);
        this.track.appendChild(slide);
        return { el: slide, img: img, loaded: false };
      });

      if (this.images.length > 1) {
        this.upBtn = document.createElement("button");
        this.upBtn.type = "button";
        this.upBtn.className = "gallery__nav gallery__nav--up";
        this.upBtn.setAttribute("aria-label", "Previous screenshot");
        this.upBtn.innerHTML = svgChevron("up");
        root.appendChild(this.upBtn);

        this.downBtn = document.createElement("button");
        this.downBtn.type = "button";
        this.downBtn.className = "gallery__nav gallery__nav--down";
        this.downBtn.setAttribute("aria-label", "Next screenshot");
        this.downBtn.innerHTML = svgChevron("down");
        root.appendChild(this.downBtn);

        this.dotsWrap = document.createElement("div");
        this.dotsWrap.className = "gallery__dots";
        this.dotsWrap.setAttribute("role", "tablist");
        this.dotsWrap.setAttribute("aria-label", "Screenshot pagination");
        this.dots = this.images.map((_, i) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "gallery__dot";
          dot.setAttribute("role", "tab");
          dot.setAttribute("aria-label", "Go to screenshot " + (i + 1));
          dot.addEventListener("click", (e) => {
            e.stopPropagation();
            this.goTo(i);
          });
          this.dotsWrap.appendChild(dot);
          return dot;
        });
        root.appendChild(this.dotsWrap);
      }
    }

    _bind() {
      const root = this.root;

      if (this.upBtn)
        this.upBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.prev();
        });
      if (this.downBtn)
        this.downBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.next();
        });

      let wheelLock = false;
      root.addEventListener(
        "wheel",
        (e) => {
          if (this.images.length < 2) return;
          e.preventDefault();
          if (wheelLock) return;
          wheelLock = true;
          if (e.deltaY > 0) this.next();
          else this.prev();
          setTimeout(() => {
            wheelLock = false;
          }, 550);
        },
        { passive: false },
      );

      root.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          this.prev();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          this.next();
        }
      });

      root.addEventListener(
        "touchstart",
        (e) => {
          this._touchStartY = e.touches[0].clientY;
        },
        { passive: true },
      );

      root.addEventListener(
        "touchmove",
        (e) => {
          if (this._touchStartY === null) return;
          if (Math.abs(e.touches[0].clientY - this._touchStartY) > 10)
            this.suppressClick = true;
        },
        { passive: true },
      );

      root.addEventListener(
        "touchend",
        (e) => {
          if (this._touchStartY === null) return;
          const dy = e.changedTouches[0].clientY - this._touchStartY;
          if (Math.abs(dy) > 40) {
            if (dy < 0) this.next();
            else this.prev();
          }
          this._touchStartY = null;
        },
        { passive: true },
      );
    }

    _ensureLoaded(i) {
      const slide = this.slides[i];
      if (!slide || slide.loaded) return;
      slide.img.src = slide.img.dataset.src;
      slide.loaded = true;
    }

    _render(animate) {
      this.slides.forEach((slide, i) => {
        slide.el.style.transition = animate === false ? "none" : "";
        slide.el.style.transform =
          "translateY(" + (i - this.current) * 100 + "%)";
      });
      // Lazy-load current slide + immediate neighbours only.
      this._ensureLoaded(this.current);
      this._ensureLoaded(Math.max(0, this.current - 1));
      this._ensureLoaded(
        Math.min(this.images.length - 1, this.current + 1),
      );

      if (this.dots) {
        this.dots.forEach((dot, i) =>
          dot.classList.toggle("is-active", i === this.current),
        );
      }
      if (this.upBtn) this.upBtn.disabled = this.current === 0;
      if (this.downBtn)
        this.downBtn.disabled = this.current === this.images.length - 1;
    }

    goTo(i) {
      if (!this.images.length) return;
      this.current = Math.max(0, Math.min(this.images.length - 1, i));
      this._render(true);
    }

    next() {
      this.goTo(this.current + 1);
    }
    prev() {
      this.goTo(this.current - 1);
    }
  }

  /* ── Init a gallery for every project card ── */
  const cardGalleries = [];
  document.querySelectorAll("[data-gallery]").forEach((root) => {
    const gallery = new Gallery(root, {});
    cardGalleries.push(gallery);
    root.addEventListener("click", () => {
      if (gallery.suppressClick) {
        gallery.suppressClick = false;
        return;
      }
      openLightbox(gallery.images, gallery.current, gallery.alt);
    });
  });

  /* ── Lightbox (single shared instance, reuses the same Gallery component) ── */
  const lightboxEl = document.getElementById("lightbox");
  const lightboxStage = document.getElementById("lightboxStage");
  const lightboxClose = document.getElementById("lightboxClose");
  let lightboxGallery = null;
  let lastFocused = null;

  function openLightbox(images, startIndex, alt) {
    if (!images || !images.length) return;
    lastFocused = document.activeElement;
    lightboxStage.innerHTML = "";

    const galleryRoot = document.createElement("div");
    galleryRoot.className = "gallery gallery--lightbox";
    galleryRoot.dataset.images = images.join(",");
    galleryRoot.dataset.alt = alt || "Project screenshot";
    galleryRoot.tabIndex = 0;
    galleryRoot.setAttribute("role", "group");
    galleryRoot.setAttribute(
      "aria-label",
      "Screenshot viewer — scroll, swipe or use arrow keys to browse",
    );
    lightboxStage.appendChild(galleryRoot);

    lightboxGallery = new Gallery(galleryRoot, { isLightbox: true });
    lightboxGallery.goTo(startIndex);

    lightboxEl.classList.add("is-open");
    lightboxEl.setAttribute("aria-hidden", "false");
    /* --- Scroll lock (cross-browser, incl. iOS Safari) ---
       Setting overflow:hidden on body is ignored by iOS Safari and causes
       a viewport-width repaint when removed. The correct approach is to
       fix the body in place, save/restore the scroll position manually. */
    const _ly = window.scrollY;
    document.body.dataset.lbScrollY = _ly;
    document.body.style.position = "fixed";
    document.body.style.top = "-" + _ly + "px";
    document.body.style.width = "100%";
    document.body.style.overflowY =
      "scroll"; /* prevents layout shift from scrollbar disappearing */
    requestAnimationFrame(() => galleryRoot.focus());
  }

  function closeLightbox() {
    if (!lightboxEl.classList.contains("is-open")) return;
    lightboxEl.classList.remove("is-open");
    lightboxEl.setAttribute("aria-hidden", "true");
    /* --- Restore scroll position --- */
    const _savedLy = parseInt(document.body.dataset.lbScrollY || "0", 10);
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflowY = "";
    delete document.body.dataset.lbScrollY;
    window.scrollTo(0, _savedLy);
    setTimeout(() => {
      lightboxStage.innerHTML = "";
      lightboxGallery = null;
    }, 300);
    if (lastFocused && typeof lastFocused.focus === "function")
      lastFocused.focus();
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxEl.addEventListener("click", (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
})();
