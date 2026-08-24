/* ============================================================
               EXECUTE APPLICATION STATE
               ============================================================ */

const EXECUTE = {
  currentView: "dashboard",

  theme: "light",

  sidebarCollapsed: false,

  timer: {
    duration: 25 * 60,

    remaining: 25 * 60,

    running: false,

    interval: null,
  },
};

/* ============================================================
               DOM HELPERS
               ============================================================ */

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

/* ============================================================
   MODALS
   ============================================================ */

function openModal(modalId) {
  const modal = document.getElementById(modalId);

  if (!modal) {
    return;
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);

  if (!modal) {
    return;
  }

  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

/* Close buttons */

$$("[data-close-modal]").forEach(function (button) {
  button.addEventListener("click", function () {
    closeModal(this.dataset.closeModal);
  });
});

/* Close when clicking the dark overlay */

$$(".modal-overlay").forEach(function (overlay) {
  overlay.addEventListener("click", function (event) {
    if (event.target === this) {
      closeModal(this.id);
    }
  });
});

/* Close with Escape */

document.addEventListener("keydown", function (event) {
  if (event.key !== "Escape") {
    return;
  }

  $$(".modal-overlay.active").forEach(function (modal) {
    closeModal(modal.id);
  });
});

/* ============================================================
   ADD TASK
   ============================================================ */

const addTaskButton = $("#add-task-btn");
const taskForm = $("#task-form");

addTaskButton?.addEventListener("click", function () {
  taskForm?.reset();

  openModal("task-modal");

  setTimeout(function () {
    $("#task-title-input")?.focus();
  }, 50);
});

taskForm?.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = $("#task-title-input").value.trim();

  const category = $("#task-category-input").value.trim() || "General";

  const duration = $("#task-duration-input").value.trim() || "No duration";

  const priority = $("#task-priority-input").value;

  if (!title) {
    return;
  }

  const task = document.createElement("div");

  task.className = "task-item";

  task.innerHTML = `
      <input
        class="task-checkbox"
        type="checkbox"
      >

      <div class="task-content">

        <div class="task-title">
          ${escapeHTML(title)}
        </div>

        <div class="task-meta">
          ${escapeHTML(category)} · ${escapeHTML(duration)}
        </div>

      </div>

      <span class="task-priority priority-${priority}">
        ${priority.toUpperCase()}
      </span>
    `;

  const taskList = document.querySelector(".task-list");

  if (taskList) {
    taskList.appendChild(task);

    const checkbox = task.querySelector(".task-checkbox");

    checkbox?.addEventListener("change", function () {
      task.classList.toggle("completed", this.checked);
    });
  }

  closeModal("task-modal");
});

/* ============================================================
   ADD GOAL
   ============================================================ */

const addGoalButton = $("#add-goal-btn");
const goalForm = $("#goal-form");

addGoalButton?.addEventListener("click", function () {
  goalForm?.reset();

  openModal("goal-modal");

  setTimeout(function () {
    $("#goal-title-input")?.focus();
  }, 50);
});

goalForm?.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = $("#goal-title-input").value.trim();

  const description =
    $("#goal-description-input").value.trim() || "No description";

  const target = $("#goal-target-input").value.trim() || "No target";

  if (!title) {
    return;
  }

  const goal = document.createElement("div");

  goal.className = "card goal-card";

  goal.innerHTML = `
      <div class="goal-header">

        <div>

          <div class="goal-title">
            ${escapeHTML(title)}
          </div>

          <div class="goal-description">
            ${escapeHTML(description)}
          </div>

        </div>

        <div class="goal-percent">
          0%
        </div>

      </div>

      <div class="goal-progress">

        <div class="progress-track">

          <div
            class="progress-fill"
            style="width:0%"
          ></div>

        </div>

      </div>

      <div class="goal-footer">

        <span>
          Just created
        </span>

        <span>
          Target: ${escapeHTML(target)}
        </span>

      </div>
    `;

  const goalList = document.querySelector(".goal-list");

  if (goalList) {
    goalList.appendChild(goal);
  }

  closeModal("goal-modal");
});

/* ============================================================
   HTML ESCAPING
   ============================================================ */

function escapeHTML(value) {
  const div = document.createElement("div");

  div.textContent = value;

  return div.innerHTML;
}

/* ============================================================
               NAVIGATION
               ============================================================ */

function showSection(targetId) {
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  EXECUTE.currentView = targetId;

  $$(".view").forEach(function (view) {
    view.classList.toggle("active", view.id === targetId);
  });

  $$(".nav-item[data-target]").forEach(function (item) {
    item.classList.toggle("active", item.dataset.target === targetId);
  });

  $$(".tab-item[data-target]").forEach(function (item) {
    item.classList.toggle("active", item.dataset.target === targetId);
  });

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });
}

/* Navigation listeners */

$$("[data-target]").forEach(function (button) {
  button.addEventListener("click", function () {
    showSection(this.dataset.target);
  });
});

/* ============================================================
               THEME
               ============================================================ */

function applyTheme(theme) {
  const dark = theme === "dark";

  EXECUTE.theme = dark ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", EXECUTE.theme);

  localStorage.setItem("execute_theme", EXECUTE.theme);

  /* Desktop icons */

  const desktopSun = $("#desktop-icon-sun");

  const desktopMoon = $("#desktop-icon-moon");

  if (desktopSun) {
    desktopSun.classList.toggle("active", !dark);
  }

  if (desktopMoon) {
    desktopMoon.classList.toggle("active", dark);
  }

  /* Mobile icons */

  const mobileSun = $("#mobile-icon-sun");

  const mobileMoon = $("#mobile-icon-moon");

  if (mobileSun) {
    mobileSun.classList.toggle("active", !dark);
  }

  if (mobileMoon) {
    mobileMoon.classList.toggle("active", dark);
  }

  /* Settings switch */

  const settingsToggle = $("#settings-theme-toggle");

  if (settingsToggle) {
    settingsToggle.setAttribute("aria-pressed", dark ? "true" : "false");
  }

  /* Browser theme color */

  const themeMeta = $("#theme-color-meta");

  if (themeMeta) {
    themeMeta.setAttribute("content", dark ? "#0F1115" : "#F8F9FA");
  }
}

function toggleTheme() {
  applyTheme(EXECUTE.theme === "dark" ? "light" : "dark");
}

/* Theme buttons */

const desktopThemeToggle = $("#desktop-theme-toggle");

const mobileThemeToggle = $("#mobile-theme-toggle");

const settingsThemeToggle = $("#settings-theme-toggle");

desktopThemeToggle?.addEventListener("click", toggleTheme);

mobileThemeToggle?.addEventListener("click", toggleTheme);

settingsThemeToggle?.addEventListener("click", toggleTheme);

/* Load saved theme */

const savedTheme = localStorage.getItem("execute_theme");

applyTheme(savedTheme === "dark" ? "dark" : "light");

/* ============================================================
               SIDEBAR
               ============================================================ */

const sidebar = $("#sidebar");

const main = $("#main");

const collapseButton = $("#collapse-toggle");

const collapseIcon = $("#collapse-icon");

function setSidebarCollapsed(collapsed) {
  EXECUTE.sidebarCollapsed = Boolean(collapsed);

  if (!sidebar || !main) {
    return;
  }

  sidebar.classList.toggle("collapsed", EXECUTE.sidebarCollapsed);

  main.classList.toggle("collapsed", EXECUTE.sidebarCollapsed);

  if (collapseIcon && collapseButton) {
    if (EXECUTE.sidebarCollapsed) {
      collapseIcon.innerHTML = `
        <path d="M13 17l5-5-5-5"/>
        <path d="M6 17l5-5-5-5"/>
      `;

      const label = collapseButton.querySelector("span");

      if (label) {
        label.textContent = "Expand";
      }
    } else {
      collapseIcon.innerHTML = `
        <path d="M11 17l-5-5 5-5"/>
        <path d="M18 17l-5-5 5-5"/>
      `;

      const label = collapseButton.querySelector("span");

      if (label) {
        label.textContent = "Collapse";
      }
    }
  }

  localStorage.setItem(
    "execute_sidebar_collapsed",
    EXECUTE.sidebarCollapsed ? "true" : "false",
  );
}

function toggleSidebar() {
  setSidebarCollapsed(!EXECUTE.sidebarCollapsed);
}

collapseButton?.addEventListener("click", toggleSidebar);

$("#settings-sidebar-toggle")?.addEventListener("click", toggleSidebar);

const savedSidebar = localStorage.getItem("execute_sidebar_collapsed");

if (savedSidebar === "true") {
  EXECUTE.sidebarCollapsed = true;
}

/* ============================================================
               DATE
               ============================================================ */

function updateDates() {
  const date = new Date();

  const formatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  ["current", "tasks", "goals", "focus", "progress", "settings"].forEach(
    function (id) {
      const element = document.getElementById(id + "-date");

      if (element) {
        element.textContent = formatted;
      }
    },
  );

  const hour = date.getHours();

  let greeting = "Good evening.";

  if (hour < 12) {
    greeting = "Good morning.";
  } else if (hour < 18) {
    greeting = "Good afternoon.";
  }

  const greetingElement = $("#greeting");

  if (greetingElement) {
    greetingElement.textContent = greeting;
  }
}

updateDates();

/* ============================================================
               TASK INTERACTIONS
               ============================================================ */

$$(".task-checkbox").forEach(function (checkbox) {
  checkbox.addEventListener("change", function () {
    const item = this.closest(".task-item");

    if (!item) {
      return;
    }

    item.classList.toggle("completed", this.checked);
  });
});

/* ============================================================
               FOCUS TIMER
               ============================================================ */

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);

  const secs = seconds % 60;

  return String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

function renderTimer() {
  const formatted = formatTime(EXECUTE.timer.remaining);

  const mainTimer = $("#focus-timer");

  const dashboardTimer = $("#dashboard-timer");

  if (mainTimer) {
    mainTimer.textContent = formatted;
  }

  if (dashboardTimer) {
    dashboardTimer.textContent = formatted;
  }
}

function updateFocusButton() {
  const button = $("#focus-start");

  if (!button) {
    return;
  }

  if (EXECUTE.timer.running) {
    button.innerHTML = `
      <svg viewBox="0 0 24 24">
        <rect x="6" y="5" width="4" height="14"/>
        <rect x="14" y="5" width="4" height="14"/>
      </svg>
      Pause Session
    `;
  } else if (EXECUTE.timer.remaining < EXECUTE.timer.duration) {
    button.innerHTML = `
      <svg viewBox="0 0 24 24">
        <polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
      Resume Session
    `;
  } else {
    button.innerHTML = `
      <svg viewBox="0 0 24 24">
        <polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
      Start Session
    `;
  }
}

function toggleFocusTimer() {
  if (EXECUTE.timer.running) {
    pauseFocusTimer();
  } else {
    startFocusTimer();
  }
}

function startFocusTimer() {
  if (EXECUTE.timer.running) {
    return;
  }

  EXECUTE.timer.running = true;

  updateFocusButton();

  EXECUTE.timer.interval = setInterval(function () {
    if (EXECUTE.timer.remaining <= 0) {
      finishFocusTimer();

      return;
    }

    EXECUTE.timer.remaining--;

    renderTimer();
  }, 1000);
}

function pauseFocusTimer() {
  EXECUTE.timer.running = false;

  clearInterval(EXECUTE.timer.interval);

  EXECUTE.timer.interval = null;

  updateFocusButton();
}

function finishFocusTimer() {
  clearInterval(EXECUTE.timer.interval);

  EXECUTE.timer.interval = null;

  EXECUTE.timer.running = false;

  EXECUTE.timer.remaining = EXECUTE.timer.duration;

  renderTimer();

  updateFocusButton();
}

/* Focus button */

$("#focus-start")?.addEventListener("click", toggleFocusTimer);

/* Dashboard focus button */

$("#dashboard-start-focus")?.addEventListener("click", function () {
  showSection("focus");
});

/* ============================================================
               INITIALIZATION
               ============================================================ */

renderTimer();

updateFocusButton();

showSection(EXECUTE.currentView);

/* ============================================================
               RESPONSIVE STATE
               ============================================================ */

function handleResponsiveState() {
  if (!sidebar || !main) {
    return;
  }

  if (window.innerWidth <= 700) {
    sidebar.classList.remove("collapsed");

    main.classList.remove("collapsed");
  } else {
    setSidebarCollapsed(EXECUTE.sidebarCollapsed);
  }
}

window.addEventListener("resize", handleResponsiveState);

handleResponsiveState();

/* ============================================================
               PREVENT TIMER LEAK
               ============================================================ */

window.addEventListener("beforeunload", function () {
  clearInterval(EXECUTE.timer.interval);
});
