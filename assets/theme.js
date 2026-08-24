(() => {
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const paletteButtons = [...document.querySelectorAll("[data-theme-palette]")];
  const modeButton = document.querySelector("[data-theme-mode]");
  const systemMode = window.matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const currentPalette = () => root.dataset.palette || "yellow";
  const currentMode = () => root.dataset.mode || (systemMode.matches ? "dark" : "light");

  const syncControls = () => {
    const palette = currentPalette();
    const mode = currentMode();

    paletteButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themePalette === palette));
    });

    modeButton.querySelector("span").textContent = mode === "dark" ? "☾" : "☼";
    modeButton.setAttribute("aria-label", `Switch to ${mode === "dark" ? "light" : "dark"} mode`);
    modeButton.title = `Switch to ${mode === "dark" ? "light" : "dark"} mode`;

    if (themeColor) {
      themeColor.content = getComputedStyle(root).getPropertyValue("--paper").trim();
    }
  };

  const save = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {}
  };

  const changeTheme = (update, trigger) => {
    const bounds = trigger.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    if (!document.startViewTransition || reducedMotion.matches) {
      update();
      syncControls();
      return;
    }

    const transition = document.startViewTransition(() => {
      update();
      syncControls();
    });

    transition.ready.then(() => {
      root.animate(
        {
          clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: 520,
          easing: "cubic-bezier(.2, .75, .25, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  paletteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const palette = button.dataset.themePalette;
      if (palette === currentPalette()) return;

      changeTheme(() => {
        root.dataset.palette = palette;
        save("site-palette", palette);
      }, button);
    });
  });

  modeButton.addEventListener("click", () => {
    changeTheme(() => {
      const mode = currentMode() === "dark" ? "light" : "dark";
      root.dataset.mode = mode;
      save("site-mode", mode);
    }, modeButton);
  });

  systemMode.addEventListener("change", () => {
    if (!root.dataset.mode) syncControls();
  });

  syncControls();
})();
