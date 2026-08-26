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

    normalizeTasks();
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

function createTask(title, category, duration, priority, goalId) {
  return {
    id: createId("task"),

    title: title,

    category: category || "General",

    duration: duration || "No duration",

    priority: priority || "low",

    completed: false,

    createdAt: Date.now(),

    completedAt: null,

    goalId: goalId || null,
  };
}

function getGoalById(goalId) {
  if (!goalId) {
    return null;
  }

  return (
    EXECUTE.goals.find(function (goal) {
      return goal.id === goalId;
    }) || null
  );
}

function getTasksForGoal(goalId) {
  if (!goalId) {
    return [];
  }

  return EXECUTE.tasks.filter(function (task) {
    return task.goalId === goalId;
  });
}

function calculateGoalProgress(goalId) {
  const linkedTasks = getTasksForGoal(goalId);

  const total = linkedTasks.length;

  if (total === 0) {
    return {
      progress: 0,
      completed: 0,
      total: 0,
    };
  }

  const completed = linkedTasks.filter(function (task) {
    return task.completed;
  }).length;

  const progress = Math.min(100, Math.round((completed / total) * 100));

  return {
    progress: progress,
    completed: completed,
    total: total,
  };
}

function syncAllGoalProgress() {
  EXECUTE.goals.forEach(function (goal) {
    goal.progress = calculateGoalProgress(goal.id).progress;
  });

  saveGoals();
}

function normalizeTasks() {
  EXECUTE.tasks.forEach(function (task) {
    if (task.goalId === undefined) {
      task.goalId = null;
    }

    if (task.goalId && !getGoalById(task.goalId)) {
      task.goalId = null;
    }
  });
}

function populateTaskGoalSelect() {
  const select = $("#task-goal-input");

  if (!select) {
    return;
  }

  select.innerHTML = `

    <option value="">
      No Goal
    </option>

  `;

  EXECUTE.goals.forEach(function (goal) {
    const option = document.createElement("option");

    option.value = goal.id;
    option.textContent = goal.title;

    select.appendChild(option);
  });
}

function onTasksChanged() {
  syncAllGoalProgress();
  renderTasks();
  renderGoals();
  updateFocusCard();
}

/* ============================================================
   CURRENT FOCUS SELECTION
   ============================================================ */

function getCurrentFocusTask() {
  const incompleteTasks = EXECUTE.tasks.filter(function (task) {
    return !task.completed;
  });

  if (incompleteTasks.length === 0) {
    return null;
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  incompleteTasks.sort(function (a, b) {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return a.createdAt - b.createdAt;
  });

  return incompleteTasks[0];
}

function updateFocusCard() {
  const task = getCurrentFocusTask();

  const dashboardGoalLabel = $("#dashboard .focus-goal-label");
  const dashboardTitle = $("#dashboard .focus-title");
  const dashboardSubtitle = $("#dashboard .focus-subtitle");
  const dashboardStartButton = $("#dashboard-start-focus");

  const focusPageTitle = $(".focus-page-title");
  const focusPageSubtitle = $(".focus-page-subtitle");

  if (!task) {
    if (dashboardGoalLabel) {
      dashboardGoalLabel.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        No tasks ready to execute
      `;
    }

    if (dashboardTitle) {
      dashboardTitle.textContent = "";
    }

    if (dashboardSubtitle) {
      dashboardSubtitle.textContent = "";
    }

    if (focusPageTitle) {
      focusPageTitle.textContent = "No tasks ready to execute";
    }

    if (focusPageSubtitle) {
      focusPageSubtitle.textContent = "";
    }

    return;
  }

  const goal = getGoalById(task.goalId);

  if (dashboardGoalLabel) {
    if (goal) {
      dashboardGoalLabel.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        Goal: ${escapeHTML(goal.title)}
      `;
    } else {
      dashboardGoalLabel.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        No goal linked
      `;
    }
  }

  if (dashboardTitle) {
    dashboardTitle.textContent = task.title;
  }

  if (dashboardSubtitle) {
    dashboardSubtitle.textContent = task.duration + " session planned.";
  }

  if (focusPageTitle) {
    focusPageTitle.textContent = task.title;
  }

  if (focusPageSubtitle) {
    const subtitleParts = [escapeHTML(task.category), escapeHTML(task.priority) + " priority"];
    if (goal) {
      subtitleParts.push(escapeHTML(goal.title));
    }
    focusPageSubtitle.textContent = subtitleParts.join(" · ") + " · " + task.duration;
  }
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

      goalId: null,
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

    const goal = getGoalById(task.goalId);

    const metaParts = [escapeHTML(task.category), escapeHTML(task.duration)];

    if (goal) {
      metaParts.push(escapeHTML(goal.title));
    }

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
            ${metaParts.join(" · ")}
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

  onTasksChanged();
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

  onTasksChanged();
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

  populateTaskGoalSelect();

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

  const goalInput = $("#task-goal-input");

  const goalId =
    goalInput && goalInput.value ? goalInput.value : null;

  const task = createTask(title, category, duration, priority, goalId);

  EXECUTE.tasks.push(task);

  saveTasks();

  addActivity("Created task '" + title + "'");

  onTasksChanged();

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

    updateDashboard();

    return;
  }

  EXECUTE.goals.forEach(function (goal) {
    const card = document.createElement("div");

    card.className = "card goal-card";

    card.dataset.goalId = goal.id;

    const stats = calculateGoalProgress(goal.id);

    const progress = stats.progress;

    const taskProgressText =
      stats.total === 0
        ? "No tasks linked"
        : stats.completed +
          " of " +
          stats.total +
          " tasks completed";

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
            ${taskProgressText}
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

  updateDashboard();
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

  EXECUTE.tasks.forEach(function (task) {
    if (task.goalId === goalId) {
      task.goalId = null;
    }
  });

  saveGoals();
  saveTasks();

  addActivity("Deleted goal '" + goal.title + "'");

  renderGoals();
  renderTasks();
  updateFocusCard();
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

  syncAllGoalProgress();

  renderGoals();

  closeModal("goal-modal");

  goalForm.reset();
});

/* ============================================================
   STATISTICS HELPERS
   ============================================================ */

function toDateKey(timestamp) {
  const date = new Date(timestamp);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function isToday(timestamp) {
  if (!timestamp) {
    return false;
  }

  return toDateKey(timestamp) === toDateKey(Date.now());
}

function getStartOfWeek(date) {
  const start = new Date(date);

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  return start;
}

function isThisWeek(timestamp) {
  if (!timestamp) {
    return false;
  }

  return timestamp >= getStartOfWeek(new Date()).getTime();
}

function isTaskActiveToday(task) {
  if (!task.completed) {
    return true;
  }

  return isToday(task.completedAt);
}

function getTodayTaskStats() {
  const todayTasks = EXECUTE.tasks.filter(isTaskActiveToday);

  const completedToday = EXECUTE.tasks.filter(function (task) {
    return task.completed && isToday(task.completedAt);
  }).length;

  const totalToday = todayTasks.length;

  const percentage =
    totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);

  return {
    total: totalToday,
    completed: completedToday,
    percentage: percentage,
  };
}

function getActiveGoalsCount() {
  return EXECUTE.goals.filter(function (goal) {
    return calculateGoalProgress(goal.id).progress < 100;
  }).length;
}

function getCompletedFocusSessions(options) {
  const onlyThisWeek = options && options.thisWeek;

  return EXECUTE.activities.filter(function (activity) {
    if (activity.text !== "Completed a focus session") {
      return false;
    }

    if (onlyThisWeek) {
      return isThisWeek(activity.timestamp);
    }

    return true;
  });
}

function getFocusSeconds(sessionCount) {
  return sessionCount * EXECUTE.timer.duration;
}

function formatFocusDuration(totalSeconds) {
  const hours = totalSeconds / 3600;

  if (hours < 1) {
    return Math.round(totalSeconds / 60) + "m";
  }

  const rounded = Math.round(hours * 10) / 10;

  return Number.isInteger(rounded) ? rounded + "h" : rounded + "h";
}

function formatFocusDelta(totalSeconds) {
  if (totalSeconds <= 0) {
    return "+0h";
  }

  return "+" + formatFocusDuration(totalSeconds);
}

function getProductiveDayKeys() {
  const days = new Set();

  EXECUTE.tasks.forEach(function (task) {
    if (task.completed && task.completedAt) {
      days.add(toDateKey(task.completedAt));
    }
  });

  getCompletedFocusSessions().forEach(function (activity) {
    days.add(toDateKey(activity.timestamp));
  });

  return days;
}

function calculateStreaks(dayKeys) {
  const sortedDays = Array.from(dayKeys).sort();

  if (!sortedDays.length) {
    return {
      current: 0,
      best: 0,
    };
  }

  let best = 1;
  let run = 1;

  for (let index = 1; index < sortedDays.length; index++) {
    const previousParts = sortedDays[index - 1].split("-");
    const currentParts = sortedDays[index].split("-");

    const previous = new Date(
      Number(previousParts[0]),
      Number(previousParts[1]) - 1,
      Number(previousParts[2]),
    );

    const current = new Date(
      Number(currentParts[0]),
      Number(currentParts[1]) - 1,
      Number(currentParts[2]),
    );

    previous.setDate(previous.getDate() + 1);

    if (
      previous.getFullYear() === current.getFullYear() &&
      previous.getMonth() === current.getMonth() &&
      previous.getDate() === current.getDate()
    ) {
      run++;
    } else {
      run = 1;
    }

    if (run > best) {
      best = run;
    }
  }

  let current = 0;
  const cursor = new Date();

  cursor.setHours(0, 0, 0, 0);

  while (dayKeys.has(toDateKey(cursor.getTime()))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    current: current,
    best: Math.max(best, current),
  };
}

function getWeeklyExecutionPercent(dayKeys) {
  const weekStart = getStartOfWeek(new Date());

  let activeDays = 0;

  for (let day = 0; day < 7; day++) {
    const cursor = new Date(weekStart);

    cursor.setDate(cursor.getDate() + day);

    if (dayKeys.has(toDateKey(cursor.getTime()))) {
      activeDays++;
    }
  }

  return Math.round((activeDays / 7) * 100);
}

function getCompletedTasksCount(options) {
  const onlyThisWeek = options && options.thisWeek;

  return EXECUTE.tasks.filter(function (task) {
    if (!task.completed) {
      return false;
    }

    if (onlyThisWeek) {
      return isThisWeek(task.completedAt);
    }

    return true;
  }).length;
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function updateDashboard() {
  const todayStats = getTodayTaskStats();

  const allCompleted = getCompletedTasksCount();

  const activeGoals = getActiveGoalsCount();

  const focusSessions = getCompletedFocusSessions().length;

  const progressNumber = $("#dashboard-task-progress");

  if (progressNumber) {
    progressNumber.innerHTML = `

      <strong>
        ${todayStats.completed}
      </strong>

      / ${todayStats.total}

    `;
  }

  const dashboardProgress = $("#dashboard .stats-col .progress-fill");

  if (dashboardProgress) {
    dashboardProgress.style.width = todayStats.percentage + "%";
  }

  const statValues = $$("#dashboard .stats-card .stat-value");

  if (statValues.length >= 1) {
    statValues[0].textContent = allCompleted;
  }

  if (statValues.length >= 2) {
    statValues[1].textContent = activeGoals;
  }

  if (statValues.length >= 3) {
    statValues[2].textContent = focusSessions;
  }

  const dashboardTaskText = document.querySelector(
    "#dashboard .stats-col .progress-header > span:first-child",
  );

  if (dashboardTaskText) {
    dashboardTaskText.textContent = "Tasks";
  }

  updateProgress();
}

/* ============================================================
   PROGRESS PAGE
   ============================================================ */

function updateProgress() {
  const completedTasks = getCompletedTasksCount();
  const completedTasksThisWeek = getCompletedTasksCount({ thisWeek: true });

  const allFocusSessions = getCompletedFocusSessions();
  const weekFocusSessions = getCompletedFocusSessions({ thisWeek: true });

  const totalFocusSeconds = getFocusSeconds(allFocusSessions.length);
  const weekFocusSeconds = getFocusSeconds(weekFocusSessions.length);

  const productiveDays = getProductiveDayKeys();
  const streaks = calculateStreaks(productiveDays);
  const weeklyExecution = getWeeklyExecutionPercent(productiveDays);

  const tasksMetric = $("#progress-metric-tasks");

  if (tasksMetric) {
    tasksMetric.textContent = completedTasks;
  }

  const tasksWeekMetric = $("#progress-metric-tasks-week");

  if (tasksWeekMetric) {
    tasksWeekMetric.textContent =
      "+" + completedTasksThisWeek + " this week";
  }

  const focusMetric = $("#progress-metric-focus");

  if (focusMetric) {
    focusMetric.textContent = formatFocusDuration(totalFocusSeconds);
  }

  const focusWeekMetric = $("#progress-metric-focus-week");

  if (focusWeekMetric) {
    focusWeekMetric.textContent = formatFocusDelta(weekFocusSeconds);
  }

  const streakMetric = $("#progress-metric-streak");

  if (streakMetric) {
    streakMetric.textContent = streaks.current;
  }

  const bestStreakMetric = $("#progress-metric-best-streak");

  if (bestStreakMetric) {
    bestStreakMetric.textContent =
      "Best: " + streaks.best + (streaks.best === 1 ? " day" : " days");
  }

  const weeklyPercentElement = $("#progress-weekly-percent");

  if (weeklyPercentElement) {
    weeklyPercentElement.textContent = weeklyExecution + "%";
  }

  const weeklyFill = $("#progress-weekly-fill");

  if (weeklyFill) {
    weeklyFill.style.width = weeklyExecution + "%";
  }
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

  updateDashboard();
}

/* Focus button */

$("#focus-start")?.addEventListener("click", toggleFocusTimer);

/* Dashboard focus button */

$("#dashboard-start-focus")?.addEventListener("click", function () {
  const currentTask = getCurrentFocusTask();

  if (currentTask) {
    showSection("focus");
  }
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

syncAllGoalProgress();

/*
 * Render the actual application data.
 */

renderTasks();

renderGoals();

renderActivities();

updateDashboard();

updateFocusCard();

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
