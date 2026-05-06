(() => {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function getHeaderOffset() {
    const header = document.querySelector(".siteHeader");
    if (!header) return 0;
    const rect = header.getBoundingClientRect();
    return Math.ceil(rect.height);
  }

  function smoothScrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;

    const offset = getHeaderOffset() + 12;
    const top = window.scrollY + el.getBoundingClientRect().top - offset;

    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  // Smooth scrolling for internal links
  document.addEventListener("click", (e) => {
    const a = e.target instanceof Element ? e.target.closest("a[data-scroll]") : null;
    if (!a) return;

    const href = a.getAttribute("href") || "";
    if (href === "#" || a.getAttribute("aria-disabled") === "true") {
      e.preventDefault();
      return;
    }
    if (!href.startsWith("#")) return;

    const id = href.slice(1);
    if (!id) return;

    e.preventDefault();
    smoothScrollToId(id);
  });

  // Active nav state for sections
  const sectionIds = ["home", "about", "works"];
  const navLinks = Array.from(document.querySelectorAll(".nav .navLink[data-scroll]")).filter((a) => {
    const href = a.getAttribute("href") || "";
    return sectionIds.some((id) => href === `#${id}`);
  });

  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter((el) => el instanceof HTMLElement);

  if ("IntersectionObserver" in window && sections.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((x) => x.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (!visible?.target?.id) return;

        for (const link of navLinks) {
          const isCurrent = link.getAttribute("href") === `#${visible.target.id}`;
          if (isCurrent) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        }
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5],
      }
    );

    for (const s of sections) obs.observe(s);
  }

  // Works spotlight effect
  const grid = document.querySelector(".worksGrid");
  if (!grid) return;

  let activeCard = null;

  function setSpot(x, y) {
    document.body.style.setProperty("--spot-x", `${Math.round(x)}px`);
    document.body.style.setProperty("--spot-y", `${Math.round(y)}px`);
  }

  function activate(card, x, y) {
    if (!(card instanceof HTMLElement)) return;

    if (activeCard && activeCard !== card) activeCard.classList.remove("isSpotlit");
    activeCard = card;
    activeCard.classList.add("isSpotlit");

    document.body.classList.add("spotlightOn");

    if (typeof x === "number" && typeof y === "number") {
      setSpot(x, y);
      return;
    }

    const r = card.getBoundingClientRect();
    setSpot(r.left + r.width / 2, r.top + r.height / 2);
  }

  function deactivate() {
    document.body.classList.remove("spotlightOn");
    if (activeCard) activeCard.classList.remove("isSpotlit");
    activeCard = null;
  }

  // Mobile View: tap to spotlight
  const isCoarsePointer =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches;

  if (isCoarsePointer) {
    grid.addEventListener("pointerdown", (e) => {
      // Don't block scroll; just toggle spotlight.
      const target = e.target instanceof Element ? e.target : null;
      const card = target ? target.closest(".workCard") : null;
      if (!(card instanceof HTMLElement)) return;

      // Tap the same card to close.
      if (activeCard === card && document.body.classList.contains("spotlightOn")) {
        deactivate();
        return;
      }

      activate(card);
    });

    // Tap outside works grid to close spotlight
    document.addEventListener("pointerdown", (e) => {
      if (!document.body.classList.contains("spotlightOn")) return;
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      if (target.closest(".worksGrid")) return;
      deactivate();
    });

    // Hide spotlight if user starts scrolling.
    window.addEventListener(
      "scroll",
      () => {
        if (document.body.classList.contains("spotlightOn")) deactivate();
      },
      { passive: true }
    );
  }

  grid.addEventListener("mousemove", (e) => {
    const card = e.target instanceof Element ? e.target.closest(".workCard") : null;
    if (!card) return;
    activate(card, e.clientX, e.clientY);
  });

  grid.addEventListener("mouseleave", () => {
    deactivate();
  });

  grid.addEventListener("focusin", (e) => {
    const card = e.target instanceof Element ? e.target.closest(".workCard") : null;
    if (!card) return;
    activate(card);
  });

  grid.addEventListener("focusout", (e) => {
    const next = e.relatedTarget instanceof Element ? e.relatedTarget : null;
    if (next && grid.contains(next) && next.closest(".workCard")) return;
    deactivate();
  });
})();

(() => {
  // Contact form + modal (only on contact page)
  const form = document.getElementById("contactForm");
  const modal = document.getElementById("contactModal");
  if (!(form instanceof HTMLFormElement) || !(modal instanceof HTMLElement)) return;

  const titleEl = document.getElementById("contactModalTitle");
  const descEl = document.getElementById("contactModalDesc");
  const statusEl = form.querySelector(".formStatus");
  const submitBtn = form.querySelector('button[type="submit"]');
  const inputs = Array.from(form.querySelectorAll("input, textarea")).filter(
    (el) => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
  );

  let lastFocused = null;

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }

  function setSending(isSending) {
    form.classList.toggle("isSending", isSending);
    if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = isSending;
  }

  function validate() {
    let ok = true;
    for (const el of inputs) {
      const isValid = el.checkValidity();
      el.setAttribute("aria-invalid", String(!isValid));
      if (!isValid && ok) {
        ok = false;
        el.focus();
      }
    }
    return ok;
  }

  function getFocusable(container) {
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el instanceof HTMLElement && !el.hasAttribute("disabled") && el.offsetParent !== null);
  }

  function openModal({ title, desc }) {
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;

    modal.classList.add("isOpen");
    modal.setAttribute("aria-hidden", "false");

    const focusables = getFocusable(modal);
    (focusables[0] || modal).focus?.();
  }

  function closeModal() {
    modal.classList.remove("isOpen");
    modal.setAttribute("aria-hidden", "true");
    if (lastFocused) lastFocused.focus();
    lastFocused = null;
  }

  modal.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    if (target.closest("[data-modal-close]")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("isOpen")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      const focusables = getFocusable(modal);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  form.addEventListener("input", (e) => {
    const el = e.target instanceof Element ? e.target : null;
    if (!el) return;
    if (el.matches("input, textarea")) el.removeAttribute("aria-invalid");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    if (!validate()) {
      setStatus("Please check the highlighted fields.");
      return;
    }

    setSending(true);
    setStatus("Sending…");

    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });

      if (res.ok) {
        form.reset();
        setStatus("");
        openModal({
          title: "Message sent",
          desc: "Thanks — I’ll get back to you soon.",
        });
      } else {
        openModal({
          title: "Something went wrong",
          desc: "Your message didn’t send. Please try again in a moment.",
        });
      }
    } catch {
      openModal({
        title: "Network error",
        desc: "You appear to be offline. Please check your connection and try again.",
      });
    } finally {
      setSending(false);
    }
  });
})();
