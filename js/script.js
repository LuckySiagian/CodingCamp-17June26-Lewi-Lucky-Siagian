/**
 * To-Do Life Dashboard — script.js
 * CodingCamp-17June26-Lewi Lucky Siagian
 *
 * Organized into 8 sections inside a single DOMContentLoaded listener:
 *   Section 1 — Storage helpers
 *   Section 2 — Clock & Greeting module
 *   Section 3 — Timer module
 *   Section 4 — Task module
 *   Section 5 — Link module
 *   Section 6 — Theme module
 *   Section 7 — Name modal module
 *   Section 8 — Bootstrap
 */

document.addEventListener('DOMContentLoaded', () => {

  // ================================================================
  // Section 1 — Storage helpers
  // ================================================================

  /**
   * Load a JSON array from localStorage.
   * Returns [] on missing key, non-array value, or any parse error.
   * Discards corrupt data by removing the key before returning [].
   *
   * @param {string} key - The localStorage key to read.
   * @returns {Array} The parsed array, or [] on any failure.
   */
  function loadItems(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('not an array');
      return parsed;
    } catch {
      localStorage.removeItem(key); // discard corrupt data
      return [];
    }
  }

  /**
   * Serialize an array to JSON and write it to localStorage.
   *
   * @param {string} key  - The localStorage key to write.
   * @param {Array}  data - The array to persist.
   */
  function saveItems(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Write a plain string value to localStorage.
   *
   * @param {string} key - The localStorage key to write.
   * @param {string} val - The string value to store.
   */
  function saveString(key, val) {
    localStorage.setItem(key, val);
  }

  // ================================================================
  // Section 2 — Clock & Greeting module
  // ================================================================

  /**
   * Zero-pad a number to exactly 2 digits.
   * @param {number} n
   * @returns {string}
   */
  function zeroPad(n) {
    return String(n).padStart(2, '0');
  }

  /**
   * Format hours, minutes, seconds into "HH:MM:SS".
   * Each component is zero-padded to 2 digits.
   *
   * @param {number} h - Hours (0–23)
   * @param {number} m - Minutes (0–59)
   * @param {number} s - Seconds (0–59)
   * @returns {string} e.g. "09:05:03"
   */
  function formatTime(h, m, s) {
    return `${zeroPad(h)}:${zeroPad(m)}:${zeroPad(s)}`;
  }

  /**
   * Format a Date object into "Weekday, DD Month YYYY"
   * (e.g. "Monday, 17 June 2026") using the browser's locale-aware Date API.
   *
   * @param {Date} dateObj
   * @returns {string}
   */
  function formatDate(dateObj) {
    // en-GB with these options produces e.g. "Monday, 17 June 2026"
    const parts = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day:     '2-digit',
      month:   'long',
      year:    'numeric',
    }).formatToParts(dateObj);

    // Extract each named part for deterministic assembly.
    const get = (type) => (parts.find(p => p.type === type) || {}).value || '';
    return `${get('weekday')}, ${get('day')} ${get('month')} ${get('year')}`;
  }

  /**
   * Return the appropriate greeting phrase for a given hour and user name.
   *
   * Ranges (inclusive):
   *   05–11 → "Good morning"
   *   12–17 → "Good afternoon"
   *   18–20 → "Good evening"
   *   21–23 → "Good night"
   *   00–04 → "Good night"
   *
   * If userName is falsy or whitespace-only, "Friend" is substituted.
   *
   * @param {number} hour     - Integer 0–23
   * @param {string} userName - Display name (may be falsy or blank)
   * @returns {string} e.g. "Good morning, Alice!" or "Good night, Friend!"
   */
  function getGreetingPhrase(hour, userName) {
    const name = (userName && userName.trim()) ? userName.trim() : 'Friend';

    let phrase;
    if (hour >= 5 && hour <= 11) {
      phrase = 'Good morning';
    } else if (hour >= 12 && hour <= 17) {
      phrase = 'Good afternoon';
    } else if (hour >= 18 && hour <= 20) {
      phrase = 'Good evening';
    } else {
      // hours 21–23 and 00–04
      phrase = 'Good night';
    }

    return `${phrase}, ${name}!`;
  }

  const clockModule = {
    /**
     * Start the clock: render immediately, then tick every 1 000 ms.
     */
    init() {
      this.tick();
      setInterval(() => this.tick(), 1000);
    },

    /**
     * Update #current-time, #current-date, and the greeting.
     */
    tick() {
      const d = new Date();

      // Update time display
      const timeEl = document.getElementById('current-time');
      if (timeEl) {
        timeEl.textContent = formatTime(d.getHours(), d.getMinutes(), d.getSeconds());
      }

      // Update date display
      const dateEl = document.getElementById('current-date');
      if (dateEl) {
        dateEl.textContent = formatDate(d);
      }

      // Update greeting
      const userName = localStorage.getItem('userName');
      greetingModule.render(userName);
    },
  };

  const greetingModule = {
    /**
     * Compute and render the greeting into #greeting.
     *
     * @param {string|null} userName - The stored user name (may be null/empty).
     */
    render(userName) {
      const hour = new Date().getHours();
      const phrase = getGreetingPhrase(hour, userName);
      const el = document.getElementById('greeting');
      if (el) {
        el.textContent = phrase;
      }
    },
  };

  // ================================================================
  // Section 3 — Timer module
  // ================================================================

  const timerModule = {
    /**
     * Internal countdown state.
     * Scoped inside the object so all methods share the same instance.
     */
    _state: {
      totalSeconds: 1500,   // 25 * 60 — current countdown value
      intervalId:   null,   // setInterval handle; null when paused/stopped
      running:      false,
    },

    /**
     * Write current MM:SS to #timer-minutes / #timer-seconds and
     * update button disabled states to match the running invariant.
     *
     * running === true  → Start disabled, Stop enabled,  Reset enabled
     * running === false → Start enabled,  Stop disabled, Reset enabled
     */
    render() {
      const { totalSeconds, running } = this._state;

      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      const minEl = document.getElementById('timer-minutes');
      const secEl = document.getElementById('timer-seconds');
      if (minEl) minEl.textContent = zeroPad(minutes);
      if (secEl) secEl.textContent = zeroPad(seconds);

      const btnStart = document.getElementById('btn-timer-start');
      const btnStop  = document.getElementById('btn-timer-stop');
      const btnReset = document.getElementById('btn-timer-reset');

      if (btnStart) btnStart.disabled = running;
      if (btnStop)  btnStop.disabled  = !running;
      if (btnReset) btnReset.disabled = false;
    },

    /**
     * Reset state to defaults, call render() to show 25:00, and bind
     * the three button click listeners.
     */
    init() {
      this._state.totalSeconds = 1500;
      this._state.intervalId   = null;
      this._state.running      = false;
      this.render();

      const btnStart = document.getElementById('btn-timer-start');
      const btnStop  = document.getElementById('btn-timer-stop');
      const btnReset = document.getElementById('btn-timer-reset');

      if (btnStart) btnStart.addEventListener('click', () => this.start());
      if (btnStop)  btnStop.addEventListener('click',  () => this.stop());
      if (btnReset) btnReset.addEventListener('click', () => this.reset());
    },

    /**
     * Begin/resume the countdown.
     * Guards against multiple concurrent intervals.
     */
    start() {
      if (this._state.running) return;  // already running — do nothing

      this._state.running    = true;
      this._state.intervalId = setInterval(() => this.tick(), 1000);
      this.render();
    },

    /**
     * Pause the countdown at the current value.
     */
    stop() {
      if (!this._state.running) return;  // already stopped — do nothing

      clearInterval(this._state.intervalId);
      this._state.intervalId = null;
      this._state.running    = false;
      this.render();
    },

    /**
     * Stop any active countdown and restore the display to 25:00.
     */
    reset() {
      this.stop();  // clears interval and sets running = false
      this._state.totalSeconds = 1500;
      this.render();
    },

    /**
     * Decrement totalSeconds by 1 and update the display.
     * When the countdown reaches 0, stop the interval, update button
     * states, and alert the user. The display remains at 00:00.
     */
    tick() {
      this._state.totalSeconds -= 1;
      this.render();

      if (this._state.totalSeconds <= 0) {
        clearInterval(this._state.intervalId);
        this._state.intervalId = null;
        this._state.running    = false;
        this.render();  // update button states: Start enabled, Stop disabled
        window.alert('Focus session complete!');
      }
    },
  };

  // ================================================================
  // Section 4 — Task module
  // ================================================================

  // Closure variable — shared by all taskModule methods
  let tasks = [];

  const taskModule = {
    /**
     * Check whether a normalized text already exists in the task list.
     * Comparison is case-insensitive and whitespace-trimmed.
     * Pass `excludeId` when editing so the task's own text is not considered
     * a duplicate of itself.
     *
     * @param {string}      text      - Candidate text (will be trimmed + lowercased).
     * @param {string|null} excludeId - Task id to exclude from comparison (optional).
     * @returns {boolean} true if a matching task exists, false otherwise.
     * Requirements: 6.1
     */
    isDuplicate(text, excludeId = null) {
      const normalized = text.trim().toLowerCase();
      return tasks.some(t =>
        t.id !== Number(excludeId) &&
        t.text.trim().toLowerCase() === normalized
      );
    },

    /**
     * Load tasks from localStorage using the Section 1 helper.
     * Assigns the result to the closure `tasks` variable and returns it.
     *
     * @returns {Array} The loaded task array (may be empty).
     */
    loadTasks() {
      tasks = loadItems('tasks');
      return tasks;
    },

    /**
     * Persist the current in-memory `tasks` array to localStorage
     * using the Section 1 helper.
     */
    persistTasks() {
      saveItems('tasks', tasks);
    },

    /**
     * Re-build #todo-list entirely from the in-memory `tasks` array.
     *
     * - Clears #todo-list (innerHTML = '').
     * - Appends one <li class="task-item"> per task using the canonical template.
     * - Adds class "done" and checks the checkbox when task.done === true.
     * - Shows/hides #todo-list and #todo-empty-msg based on tasks.length.
     *
     * Requirements: 5.2, 5.9, 7.2, 7.3
     */
    renderList() {
      const list     = document.getElementById('todo-list');
      const emptyMsg = document.getElementById('todo-empty-msg');

      if (!list) return;

      // Clear existing items
      list.innerHTML = '';

      // Build one <li> per task
      tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.id = task.id;

        // Completion state
        if (task.done) {
          li.classList.add('done');
        }

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.setAttribute('aria-label', 'Mark done');
        if (task.done) {
          checkbox.checked = true;
        }

        // Text span
        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;

        // Action buttons container
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-icon btn-secondary';
        editBtn.dataset.action = 'edit';
        editBtn.textContent = '✏️';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-icon btn-danger';
        deleteBtn.dataset.action = 'delete';
        deleteBtn.textContent = '🗑️';

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(actions);

        list.appendChild(li);
      });

      // Toggle list visibility vs. empty-state message
      if (tasks.length === 0) {
        list.setAttribute('hidden', '');
        if (emptyMsg) emptyMsg.removeAttribute('hidden');
      } else {
        list.removeAttribute('hidden');
        if (emptyMsg) emptyMsg.setAttribute('hidden', '');
      }
    },

    /**
     * Add a new task to the list after trimming and validating the input text.
     *
     * - Empty / whitespace-only text: show #task-error-msg, return early.
     * - Valid text: hide error, push { id, text, done:false }, persist, render,
     *   and clear the input.
     *
     * Requirements: 5.1
     *
     * @param {string} text - The raw input value from #input-task.
     */
    addTask(text) {
      const trimmedText = (text || '').trim();
      const errorEl     = document.getElementById('task-error-msg');
      const inputEl     = document.getElementById('input-task');

      if (!trimmedText) {
        // Show inline validation error; do NOT clear the input
        if (errorEl) {
          errorEl.textContent = 'Please enter a task.';
          errorEl.removeAttribute('hidden');
        }
        return;
      }

      // Valid input — hide any previous error
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.setAttribute('hidden', '');
      }

      // Duplicate check — Requirements: 6.1, 6.2, 6.3
      const duplicateMsg = document.getElementById('todo-duplicate-msg');
      if (this.isDuplicate(trimmedText)) {
        if (duplicateMsg) duplicateMsg.removeAttribute('hidden');
        // Do NOT clear the input — keep the user's value
        return;
      }
      // Hide duplicate warning if previously shown
      if (duplicateMsg) duplicateMsg.setAttribute('hidden', '');

      // Create and append the new task
      const newTask = { id: Date.now(), text: trimmedText, done: false };
      tasks.push(newTask);

      this.persistTasks();
      this.renderList();

      // Clear the input field
      if (inputEl) inputEl.value = '';
    },

    /**
     * Flip the done state of the task with the given id, then persist and re-render.
     *
     * @param {string|number} id - The task's data-id value (will be cast to Number).
     * Requirements: 5.3, 5.4
     */
    toggleTask(id) {
      const task = tasks.find(t => t.id === Number(id));
      if (!task) return;
      task.done = !task.done;
      this.persistTasks();
      this.renderList();
    },

    /**
     * Remove the task with the given id from the list, then persist and re-render.
     *
     * @param {string|number} id - The task's data-id value (will be cast to Number).
     * Requirements: 5.8
     */
    deleteTask(id) {
      tasks = tasks.filter(t => t.id !== Number(id));
      this.persistTasks();
      this.renderList();
    },

    /**
     * Switch a task list item into inline-edit mode.
     * Replaces the .task-text span with a focused <input> pre-filled with the
     * current text, and replaces the action buttons with Save / Cancel buttons.
     *
     * @param {string|number} id - The task's data-id value.
     * Requirements: 5.5
     */
    beginEdit(id) {
      const list = document.getElementById('todo-list');
      if (!list) return;

      const li = list.querySelector(`li[data-id="${id}"]`);
      if (!li) return;

      const task = tasks.find(t => t.id === Number(id));
      if (!task) return;

      // Replace .task-text span with an inline input
      const span = li.querySelector('.task-text');
      if (span) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-edit-input';
        input.value = task.text;

        // Keyboard shortcuts: Enter → save, Escape → cancel
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.saveEdit(id, input.value);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            this.cancelEdit(id);
          }
        });

        li.replaceChild(input, span);
        input.focus();
      }

      // Replace action buttons with Save / Cancel
      const actions = li.querySelector('.task-actions');
      if (actions) {
        actions.innerHTML = '';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary btn-sm';
        saveBtn.dataset.action = 'save-edit';
        saveBtn.textContent = '💾 Save';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary btn-sm';
        cancelBtn.dataset.action = 'cancel-edit';
        cancelBtn.textContent = '✖ Cancel';

        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);
      }
    },

    /**
     * Confirm an inline edit. Trims the new text:
     * - If empty/whitespace-only → discard edit, restore original view.
     * - If valid → update task.text, persist, and re-render.
     *
     * @param {string|number} id      - The task's data-id value.
     * @param {string}        newText - The raw value from the inline input.
     * Requirements: 5.6, 5.7
     */
    saveEdit(id, newText) {
      const trimmed = (newText || '').trim();

      if (!trimmed) {
        // Discard — restore original read-only view
        this.cancelEdit(id);
        return;
      }

      // Check for duplicate — exclude the current task's own id
      // Requirements: 6.1 (also covers inline edit path)
      if (this.isDuplicate(trimmed, id)) {
        // Show warning inline inside the task's <li>, NOT in #todo-duplicate-msg
        const list = document.getElementById('todo-list');
        const li = list ? list.querySelector(`li[data-id="${id}"]`) : null;
        if (li) {
          let editError = li.querySelector('.edit-duplicate-msg');
          if (!editError) {
            editError = document.createElement('p');
            editError.className = 'error-msg edit-duplicate-msg';
            const editInput = li.querySelector('.task-edit-input');
            if (editInput) editInput.insertAdjacentElement('afterend', editError);
          }
          editError.textContent = '⚠️ This task already exists.';
          editError.removeAttribute('hidden');
        }
        // Keep the edit input active — do NOT save, do NOT re-render
        return;
      }

      // Clear the global duplicate message before saving
      const duplicateMsg = document.getElementById('todo-duplicate-msg');
      if (duplicateMsg) duplicateMsg.setAttribute('hidden', '');

      const task = tasks.find(t => t.id === Number(id));
      if (!task) return;

      task.text = trimmed;
      this.persistTasks();
      this.renderList();
    },

    /**
     * Cancel an inline edit by re-rendering the list from unchanged in-memory state,
     * effectively restoring the read-only view.
     *
     * @param {string|number} id - The task's data-id value (unused beyond type hint).
     * Requirements: 5.5 (cancel path)
     */
    cancelEdit(id) {
      this.renderList();
    },

    /**
     * Initialize the Task module:
     * 1. Inject #task-error-msg element into #form-add-task (guards against duplicates).
     * 2. Load persisted tasks and render the initial list.
     * 3. Bind the #form-add-task submit event to addTask().
     * 4. Bind delegated click handler on #todo-list for toggle, delete, and edit actions.
     *
     * Requirements: 7.2
     */
    init() {
      // --- Inject inline error element ---
      const form    = document.getElementById('form-add-task');
      const inputEl = document.getElementById('input-task');

      if (form && inputEl && !document.getElementById('task-error-msg')) {
        const errorEl = document.createElement('p');
        errorEl.className = 'error-msg';
        errorEl.id = 'task-error-msg';
        errorEl.setAttribute('hidden', '');
        // Insert after #input-task (before the submit button)
        inputEl.insertAdjacentElement('afterend', errorEl);
      }

      // --- Load persisted tasks and render ---
      tasks = this.loadTasks();
      this.renderList();

      // --- Bind add-task form ---
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const inputValue = inputEl ? inputEl.value : '';
          this.addTask(inputValue);
        });
      }

      // Hide duplicate warning as soon as the user starts typing again
      // Requirements: 6.4
      if (inputEl) {
        inputEl.addEventListener('input', () => {
          const duplicateMsg = document.getElementById('todo-duplicate-msg');
          if (duplicateMsg) duplicateMsg.setAttribute('hidden', '');
        });
      }

      // --- Delegated click handler on #todo-list ---
      // Handles: checkbox toggle, delete, edit, save-edit, cancel-edit
      const list = document.getElementById('todo-list');
      if (list) {
        list.addEventListener('click', (e) => {
          // 1. Checkbox toggle
          if (e.target.matches('.task-checkbox')) {
            const id = e.target.closest('li').dataset.id;
            this.toggleTask(id);
            return;
          }

          // 2. Delete button
          if (e.target.closest('[data-action="delete"]')) {
            const id = e.target.closest('li').dataset.id;
            this.deleteTask(id);
            return;
          }

          // 3. Edit button
          if (e.target.closest('[data-action="edit"]')) {
            const id = e.target.closest('li').dataset.id;
            this.beginEdit(id);
            return;
          }

          // 4. Save-edit button
          if (e.target.closest('[data-action="save-edit"]')) {
            const li = e.target.closest('li');
            const id = li.dataset.id;
            const inputVal = li.querySelector('.task-edit-input');
            this.saveEdit(id, inputVal ? inputVal.value : '');
            return;
          }

          // 5. Cancel-edit button
          if (e.target.closest('[data-action="cancel-edit"]')) {
            const id = e.target.closest('li').dataset.id;
            this.cancelEdit(id);
            return;
          }
        });
      }
    },
  };

  // ================================================================
  // Section 5 — Link module
  // ================================================================

  const linkModule = {};

  // ================================================================
  // Section 6 — Theme module
  // ================================================================

  const themeModule = {};

  // ================================================================
  // Section 7 — Name modal module
  // ================================================================

  const nameModule = {
    /**
     * Bind all event listeners for the name modal and inject the
     * inline error message element into the form.
     */
    init() {
      // Inject #name-error-msg after #input-name and before .modal-actions
      const form = document.getElementById('form-set-name');
      const inputName = document.getElementById('input-name');
      const modalActions = form ? form.querySelector('.modal-actions') : null;

      if (form && inputName && modalActions && !document.getElementById('name-error-msg')) {
        const errorEl = document.createElement('p');
        errorEl.className = 'error-msg';
        errorEl.id = 'name-error-msg';
        errorEl.setAttribute('hidden', '');
        form.insertBefore(errorEl, modalActions);
      }

      // Wire open button
      const btnOpen = document.getElementById('btn-set-name');
      if (btnOpen) {
        btnOpen.addEventListener('click', () => this.openModal());
      }

      // Wire close/cancel button
      const btnClose = document.getElementById('btn-modal-close');
      if (btnClose) {
        btnClose.addEventListener('click', () => this.closeModal());
      }

      // Wire form submit
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.saveName();
        });
      }
    },

    /**
     * Open the name modal:
     * - Remove the `hidden` attribute from #modal-name
     * - Pre-populate #input-name with the currently saved userName (or '')
     * - Focus the input
     */
    openModal() {
      const modal = document.getElementById('modal-name');
      const inputName = document.getElementById('input-name');

      if (modal) {
        modal.removeAttribute('hidden');
      }

      if (inputName) {
        inputName.value = localStorage.getItem('userName') || '';
        inputName.focus();
      }
    },

    /**
     * Close the name modal:
     * - Add the `hidden` attribute back to #modal-name
     * - Clear any inline validation message in #name-error-msg
     */
    closeModal() {
      const modal = document.getElementById('modal-name');
      const errorEl = document.getElementById('name-error-msg');

      if (modal) {
        modal.setAttribute('hidden', '');
      }

      if (errorEl) {
        errorEl.textContent = '';
        errorEl.setAttribute('hidden', '');
      }
    },

    /**
     * Validate and save the name from #input-name:
     * 1. Read and trim the value.
     * 2. If empty/whitespace-only → show inline error, keep modal open, do NOT save.
     * 3. If valid → slice to 50 chars, save to localStorage, update greeting, close modal.
     */
    saveName() {
      const inputName = document.getElementById('input-name');
      const errorEl = document.getElementById('name-error-msg');

      if (!inputName) return;

      const trimmedName = inputName.value.trim();

      if (!trimmedName) {
        // Show inline validation error; keep modal open
        if (errorEl) {
          errorEl.textContent = 'Please enter a name.';
          errorEl.removeAttribute('hidden');
        }
        return;
      }

      // Valid name — slice to max 50 chars (trim already applied above)
      const finalName = trimmedName.slice(0, 50);

      // Persist
      saveString('userName', finalName);

      // Update greeting immediately without page reload
      greetingModule.render(finalName);

      // Close the modal (also clears the error message)
      this.closeModal();
    },
  };

  // ================================================================
  // Section 8 — Bootstrap
  // ================================================================

  function init() {
    // Each module's init() will be wired up here as modules are implemented.
    clockModule.init();
    timerModule.init();
    nameModule.init();
    taskModule.init();
  }

  init();

});
