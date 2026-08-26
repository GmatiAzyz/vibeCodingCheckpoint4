/* ============================================================
   EXECUTE APPLICATION
   Local-first productivity application
   ============================================================ */

/* ============================================================
   APPLICATION STATE
   ============================================================ */

const EXECUTE = {
  currentView: "dashboard",

  theme: "light",

  sidebarCollapsed: false,

  tasks: [],

  goals: [],

  activities: [],

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
   STORAGE
   ============================================================ */

const STORAGE_KEYS = {
  tasks: "execute_tasks",

  goals: "execute_goals",

  activities: "execute_activities",

  theme: "execute_theme",

  sidebar: "execute_sidebar_collapsed",
};

function saveTasks() {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(EXECUTE.tasks));
}

function saveGoals() {
  localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(EXECUTE.goals));
}

function saveActivities() {
  localStorage.setItem(
    STORAGE_KEYS.activities,
    JSON.stringify(EXECUTE.activities),
  );
}

function loadData() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.tasks);

    const savedGoals = localStorage.getItem(STORAGE_KEYS.goals);

    const savedActivities = localStorage.getItem(STORAGE_KEYS.activities);

    EXECUTE.tasks = savedTasks ? JSON.parse(savedTasks) : [];

    EXECUTE.goals = savedGoals ? JSON.parse(savedGoals) : [];

    EXECUTE.activities = savedActivities ? JSON.parse(savedActivities) : [];
  } catch (error) {
    console.error("EXECUTE: Could not load saved data.", error);

    EXECUTE.tasks = [];
    EXECUTE.goals = [];
    EXECUTE.activities = [];
  }
}

/* ============================================================
   UNIQUE IDS
   ============================================================ */

function createId(prefix) {
  return (
    prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9)
  );
}

/* ============================================================
   HTML ESCAPING
   ============================================================ */

function escapeHTML(value) {
  const div = document.createElement("div");

  div.textContent = String(value ?? "");

  return div.innerHTML;
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

/* Close when clicking overlay */

$$(".modal-overlay").forEach(function (overlay) {
  overlay.addEventListener("click", function (event) {
    if (event.target === this) {
      closeModal(this.id);
    }
  });
});

/* Escape closes modal */

document.addEventListener("keydown", function (event) {
  if (event.key !== "Escape") {
    return;
  }

  $$(".modal-overlay.active").forEach(function (modal) {
    closeModal(modal.id);
  });
});

/* ============================================================
   ACTIVITY SYSTEM
   ============================================================ */

function addActivity(text) {
  const activity = {
    id: createId("activity"),

    text: text,

    timestamp: Date.now(),
  };

  EXECUTE.activities.unshift(activity);

  /*
   * Keep the activity list small.
   */

  EXECUTE.activities = EXECUTE.activities.slice(0, 20);

  saveActivities();

  renderActivities();
}

function formatActivityTime(timestamp) {
  const difference = Date.now() - timestamp;

  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return minutes + (minutes === 1 ? " minute ago" : " minutes ago");
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return hours + (hours === 1 ? " hour ago" : " hours ago");
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "Yesterday";
  }

  return days + " days ago";
}

function renderActivities() {
  const container = $(".activity-scroll");

  if (!container) {
    return;
  }

  /*
   * If there is no activity saved yet,
   * keep the original HTML activity cards.
   */

  if (!EXECUTE.activities.length) {
    return;
  }

  container.innerHTML = "";

  EXECUTE.activities.slice(0, 10).forEach(function (activity) {
    const card = document.createElement("div");

    card.className = "card activity-card";

    card.innerHTML = `

        <div class="activity-icon-box">

          <svg
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <polyline
              points="20 6 9 17 4 12"
            />
          </svg>

        </div>

        <div>

          <div class="activity-text">
            ${escapeHTML(activity.text)}
          </div>

          <div class="activity-time">
            ${formatActivityTime(activity.timestamp)}
          </div>

        </div>

      `;

    container.appendChild(card);
  });
}

/* ============================================================
   TASK DATA
   ============================================================ */

function createTask(title, category, duration, priority) {
  return {
    id: createId("task"),

    title: title,

    category: category || "General",

    duration: duration || "No duration",

    priority: priority || "low",

    completed: false,

    createdAt: Date.now(),

    completedAt: null,
  };
}

/* ============================================================
   IMPORT EXISTING HTML TASKS
   ============================================================ */

function importExistingTasks() {
  if (EXECUTE.tasks.length > 0) {
    return;
  }

  const taskElements = $$(".task-list .task-item");

  if (!taskElements.length) {
    return;
  }

  taskElements.forEach(function (item) {
    const titleElement = item.querySelector(".task-title");

    const metaElement = item.querySelector(".task-meta");

    const priorityElement = item.querySelector(".task-priority");

    const checkbox = item.querySelector(".task-checkbox");

    if (!titleElement) {
      return;
    }

    const title = titleElement.textContent.trim();

    const meta = metaElement ? metaElement.textContent.trim() : "";

    const parts = meta.split("·");

    const category = parts[0] ? parts[0].trim() : "General";

    const duration = parts[1] ? parts[1].trim() : "No duration";

    const priority = priorityElement
      ? priorityElement.textContent.trim().toLowerCase()
      : "low";

    const task = {
      id: createId("task"),

      title: title,

      category: category,

      duration: duration,

      priority: ["high", "medium", "low"].includes(priority) ? priority : "low",

      completed: checkbox
        ? checkbox.checked
        : item.classList.contains("completed"),

      createdAt: Date.now(),

      completedAt: checkbox && checkbox.checked ? Date.now() : null,
    };

    EXECUTE.tasks.push(task);
  });

  saveTasks();
}

/* ============================================================
   TASK RENDERING
   ============================================================ */

function renderTasks() {
  const taskList = $(".task-list");

  if (!taskList) {
    return;
  }

  taskList.innerHTML = "";

  if (!EXECUTE.tasks.length) {
    taskList.innerHTML = `

      <div
        class="empty-state"
        style="min-height:220px"
      >

        <h2>No tasks yet</h2>

        <p>
          Add your first task to get started.
        </p>

      </div>

    `;

    updateDashboard();

    return;
  }

  EXECUTE.tasks.forEach(function (task) {
    const item = document.createElement("div");

    item.className = "task-item" + (task.completed ? " completed" : "");

    item.dataset.taskId = task.id;

    item.innerHTML = `

        <input
          class="task-checkbox"
          type="checkbox"
          ${task.completed ? "checked" : ""}
          aria-label="Complete task"
        >

        <div class="task-content">

          <div class="task-title">
            ${escapeHTML(task.title)}
          </div>

          <div class="task-meta">
            ${escapeHTML(task.category)}
            ·
            ${escapeHTML(task.duration)}
          </div>

        </div>

        <span
          class="task-priority priority-${escapeHTML(task.priority)}"
        >
          ${escapeHTML(task.priority.toUpperCase())}
        </span>

        <button
          type="button"
          class="task-delete"
          data-task-delete="${task.id}"
          aria-label="Delete task"
          title="Delete task"
          style="
            border:0;
            background:transparent;
            color:var(--text-muted);
            font-size:18px;
            padding:6px;
            cursor:pointer;
          "
        >
          ×
        </button>

      `;

    taskList.appendChild(item);
  });

  updateDashboard();
}

/* ============================================================
   TASK EVENTS
   ============================================================ */

function handleTaskChange(event) {
  const checkbox = event.target.closest(".task-checkbox");

  if (!checkbox) {
    return;
  }

  const item = checkbox.closest(".task-item");

  if (!item) {
    return;
  }

  const taskId = item.dataset.taskId;

  const task = EXECUTE.tasks.find(function (currentTask) {
    return currentTask.id === taskId;
  });

  if (!task) {
    return;
  }

  task.completed = checkbox.checked;

  task.completedAt = checkbox.checked ? Date.now() : null;

  if (task.completed) {
    addActivity("Completed '" + task.title + "'");
  }

  saveTasks();

  renderTasks();
}

function deleteTask(taskId) {
  const task = EXECUTE.tasks.find(function (item) {
    return item.id === taskId;
  });

  if (!task) {
    return;
  }

  const confirmed = confirm(`Delete "${task.title}"?`);

  if (!confirmed) {
    return;
  }

  EXECUTE.tasks = EXECUTE.tasks.filter(function (item) {
    return item.id !== taskId;
  });

  saveTasks();

  addActivity("Deleted task '" + task.title + "'");

  renderTasks();
}

$(".task-list")?.addEventListener("change", handleTaskChange);

$(".task-list")?.addEventListener("click", function (event) {
  const deleteButton = event.target.closest("[data-task-delete]");

  if (!deleteButton) {
    return;
  }

  deleteTask(deleteButton.dataset.taskDelete);
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

  const titleInput = $("#task-title-input");

  if (!titleInput) {
    return;
  }

  const title = titleInput.value.trim();

  if (!title) {
    titleInput.focus();

    return;
  }

  const categoryInput = $("#task-category-input");

  const durationInput = $("#task-duration-input");

  const priorityInput = $("#task-priority-input");

  const category = categoryInput ? categoryInput.value.trim() : "General";

  const duration = durationInput ? durationInput.value.trim() : "No duration";

  const priority = priorityInput ? priorityInput.value : "low";

  const task = createTask(title, category, duration, priority);

  EXECUTE.tasks.push(task);

  saveTasks();

  addActivity("Created task '" + title + "'");

  renderTasks();

  closeModal("task-modal");

  taskForm.reset();
});

/* ============================================================
   GOAL DATA
   ============================================================ */

function createGoal(title, description, target) {
  return {
    id: createId("goal"),

    title: title,

    description: description || "No description",

    target: target || "No target",

    progress: 0,

    createdAt: Date.now(),
  };
}

/* ============================================================
   IMPORT EXISTING HTML GOALS
   ============================================================ */

function importExistingGoals() {
  if (EXECUTE.goals.length > 0) {
    return;
  }

  const goalElements = $$(".goal-list .goal-card");

  if (!goalElements.length) {
    return;
  }

  goalElements.forEach(function (card) {
    const titleElement = card.querySelector(".goal-title");

    const descriptionElement = card.querySelector(".goal-description");

    const percentElement = card.querySelector(".goal-percent");

    const footer = card.querySelector(".goal-footer");

    if (!titleElement) {
      return;
    }

    const title = titleElement.textContent.trim();

    const description = descriptionElement
      ? descriptionElement.textContent.trim()
      : "No description";

    const percentText = percentElement
      ? percentElement.textContent.trim()
      : "0";

    const progress = parseInt(percentText.replace("%", ""), 10);

    let target = "No target";

    if (footer) {
      const spans = footer.querySelectorAll("span");

      if (spans.length > 1) {
        target = spans[1].textContent.replace("Target:", "").trim();
      }
    }

    EXECUTE.goals.push({
      id: createId("goal"),

      title: title,

      description: description,

      target: target,

      progress: Number.isFinite(progress)
        ? Math.max(0, Math.min(100, progress))
        : 0,

      createdAt: Date.now(),
    });
  });

  saveGoals();
}

/* ============================================================
   GOAL RENDERING
   ============================================================ */

function renderGoals() {
  const goalList = $(".goal-list");

  if (!goalList) {
    return;
  }

  goalList.innerHTML = "";

  if (!EXECUTE.goals.length) {
    goalList.innerHTML = `

      <div
        class="empty-state"
        style="
          grid-column:1/-1;
          min-height:220px;
        "
      >

        <h2>No goals yet</h2>

        <p>
          Add your first goal to start tracking progress.
        </p>

      </div>

    `;

    return;
  }

  EXECUTE.goals.forEach(function (goal) {
    const card = document.createElement("div");

    card.className = "card goal-card";

    card.dataset.goalId = goal.id;

    const progress = Math.max(0, Math.min(100, Number(goal.progress) || 0));

    card.innerHTML = `

        <div class="goal-header">

          <div>

            <div class="goal-title">
              ${escapeHTML(goal.title)}
            </div>

            <div class="goal-description">
              ${escapeHTML(goal.description)}
            </div>

          </div>

          <div class="goal-percent">
            ${progress}%
          </div>

        </div>

        <div class="goal-progress">

          <div class="progress-track">

            <div
              class="progress-fill"
              style="width:${progress}%"
            ></div>

          </div>

        </div>

        <div class="goal-footer">

          <span>
            ${formatActivityTime(goal.createdAt)}
          </span>

          <span>
            Target: ${escapeHTML(goal.target)}
          </span>

        </div>

        <div
          style="
            display:flex;
            justify-content:flex-end;
            margin-top:12px;
          "
        >

          <button
            type="button"
            data-goal-delete="${goal.id}"
            style="
              border:0;
              background:transparent;
              color:var(--text-muted);
              cursor:pointer;
              font-size:12px;
              padding:4px 0;
            "
          >
            Delete goal
          </button>

        </div>

      `;

    goalList.appendChild(card);
  });
}

/* ============================================================
   GOAL EVENTS
   ============================================================ */

function deleteGoal(goalId) {
  const goal = EXECUTE.goals.find(function (item) {
    return item.id === goalId;
  });

  if (!goal) {
    return;
  }

  const confirmed = confirm(`Delete "${goal.title}"?`);

  if (!confirmed) {
    return;
  }

  EXECUTE.goals = EXECUTE.goals.filter(function (item) {
    return item.id !== goalId;
  });

  saveGoals();

  addActivity("Deleted goal '" + goal.title + "'");

  renderGoals();
}

$(".goal-list")?.addEventListener("click", function (event) {
  const deleteButton = event.target.closest("[data-goal-delete]");

  if (!deleteButton) {
    return;
  }

  deleteGoal(deleteButton.dataset.goalDelete);
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

  const titleInput = $("#goal-title-input");

  if (!titleInput) {
    return;
  }

  const title = titleInput.value.trim();

  if (!title) {
    titleInput.focus();

    return;
  }

  const descriptionInput = $("#goal-description-input");

  const targetInput = $("#goal-target-input");

  const description = descriptionInput
    ? descriptionInput.value.trim()
    : "No description";

  const target = targetInput ? targetInput.value.trim() : "No target";

  const goal = createGoal(title, description, target);

  EXECUTE.goals.push(goal);

  saveGoals();

  addActivity("Created goal '" + title + "'");

  renderGoals();

  closeModal("goal-modal");

  goalForm.reset();
});

/* ============================================================
   DASHBOARD
   ============================================================ */

function updateDashboard() {
  const total = EXECUTE.tasks.length;

  const completed = EXECUTE.tasks.filter(function (task) {
    return task.completed;
  }).length;

  const remaining = total - completed;

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  /*
   * Existing dashboard progress number
   */

  const progressNumber = $(".progress-number");

  if (progressNumber) {
    progressNumber.innerHTML = `

      <strong>
        ${completed}
      </strong>

      / ${total}

    `;
  }

  /*
   * Existing dashboard progress bar
   */

  const dashboardProgress = $(".stats-col .progress-fill");

  if (dashboardProgress) {
    dashboardProgress.style.width = percentage + "%";
  }

  /*
   * Dashboard statistics.
   */

  const statValues = $$(".stats-card .stat-value");

  if (statValues.length >= 1) {
    statValues[0].textContent = completed;
  }

  if (statValues.length >= 2) {
    statValues[1].textContent = EXECUTE.goals.length;
  }

  /*
   * Focus sessions are calculated
   * from completed focus activities.
   */

  const focusSessions = EXECUTE.activities.filter(function (activity) {
    return activity.text.includes("focus session");
  }).length;

  if (statValues.length >= 3) {
    statValues[2].textContent = focusSessions;
  }

  /*
   * Update dashboard task progress
   * without requiring hardcoded values.
   */

  const dashboardTaskText = document.querySelector(
    ".stats-col .progress-header > span:first-child",
  );

  if (dashboardTaskText) {
    dashboardTaskText.textContent = "Tasks";
  }

  /*
   * Prevent unused-variable issues
   */

  void remaining;
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

  localStorage.setItem(STORAGE_KEYS.theme, EXECUTE.theme);

  /*
   * The icons use the .active class.
   */

  const desktopSun = $("#desktop-icon-sun");

  const desktopMoon = $("#desktop-icon-moon");

  const mobileSun = $("#mobile-icon-sun");

  const mobileMoon = $("#mobile-icon-moon");

  if (desktopSun) {
    desktopSun.classList.toggle("active", !dark);
  }

  if (desktopMoon) {
    desktopMoon.classList.toggle("active", dark);
  }

  if (mobileSun) {
    mobileSun.classList.toggle("active", !dark);
  }

  if (mobileMoon) {
    mobileMoon.classList.toggle("active", dark);
  }

  const settingsToggle = $("#settings-theme-toggle");

  if (settingsToggle) {
    settingsToggle.setAttribute("aria-pressed", dark ? "true" : "false");
  }

  const themeMeta = $("#theme-color-meta");

  if (themeMeta) {
    themeMeta.setAttribute("content", dark ? "#0F1115" : "#F8F9FA");
  }
}

function toggleTheme() {
  applyTheme(EXECUTE.theme === "dark" ? "light" : "dark");
}

/* Theme buttons */

$("#desktop-theme-toggle")?.addEventListener("click", toggleTheme);

$("#mobile-theme-toggle")?.addEventListener("click", toggleTheme);

$("#settings-theme-toggle")?.addEventListener("click", toggleTheme);

/* Load saved theme */

const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);

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
    const label = collapseButton.querySelector("span");

    if (EXECUTE.sidebarCollapsed) {
      collapseIcon.innerHTML = `

        <path d="M13 17l5-5-5-5"/>

        <path d="M6 17l5-5-5-5"/>

      `;

      if (label) {
        label.textContent = "Expand";
      }
    } else {
      collapseIcon.innerHTML = `

        <path d="M11 17l-5-5 5-5"/>

        <path d="M18 17l-5-5 5-5"/>

      `;

      if (label) {
        label.textContent = "Collapse";
      }
    }
  }

  localStorage.setItem(
    STORAGE_KEYS.sidebar,
    EXECUTE.sidebarCollapsed ? "true" : "false",
  );
}

function toggleSidebar() {
  setSidebarCollapsed(!EXECUTE.sidebarCollapsed);
}

collapseButton?.addEventListener("click", toggleSidebar);

$("#settings-sidebar-toggle")?.addEventListener("click", toggleSidebar);

const savedSidebar = localStorage.getItem(STORAGE_KEYS.sidebar);

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

/*
 * Refresh relative activity times.
 */

setInterval(renderActivities, 60000);

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

        <rect
          x="6"
          y="5"
          width="4"
          height="14"
        />

        <rect
          x="14"
          y="5"
          width="4"
          height="14"
        />

      </svg>

      Pause Session

    `;
  } else if (EXECUTE.timer.remaining < EXECUTE.timer.duration) {
    button.innerHTML = `

      <svg viewBox="0 0 24 24">

        <polygon
          points="10 8 16 12 10 16 10 8"
        />

      </svg>

      Resume Session

    `;
  } else {
    button.innerHTML = `

      <svg viewBox="0 0 24 24">

        <polygon
          points="10 8 16 12 10 16 10 8"
        />

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

  addActivity("Completed a focus session");

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

loadData();

/*
 * On the first run there is no saved data.
 *
 * Import the tasks/goals that already exist
 * in the HTML so you don't lose your existing
 * example data.
 */

importExistingTasks();

importExistingGoals();

/*
 * Render the actual application data.
 */

renderTasks();

renderGoals();

renderActivities();

updateDashboard();

/*
 * Timer.
 */

renderTimer();

updateFocusButton();

/*
 * Initial page.
 */

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
