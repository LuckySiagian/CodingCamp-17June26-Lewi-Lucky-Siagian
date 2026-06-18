# Implementation Plan: To-Do Life Dashboard

## Overview

Implement the dashboard incrementally in `js/script.js`, building each module
in isolation before wiring them together in `init()`. The existing `index.html`
and `css/style.css` are already complete and must not be modified unless
correcting an oversight. All state is managed in-memory and persisted to
`localStorage` on every mutation.

Implementation language: **Vanilla JavaScript** (ES2020, no build step).

---

## Tasks

- [x] 1. Set up storage helpers and module scaffolding
  - Inside the `DOMContentLoaded` callback in `js/script.js`, replace the
    placeholder `console.log` with the complete module scaffold (all section
    banner comments and empty module objects for `clockModule`, `greetingModule`,
    `timerModule`, `taskModule`, `linkModule`, `themeModule`, `nameModule`).
  - Implement `loadItems(key)`, `saveItems(key, data)`, and `saveString(key, val)`
    storage helper functions as described in the design's **Section 1**.
  - `loadItems` must wrap `JSON.parse` in a `try/catch`; on any error it calls
    `localStorage.removeItem(key)` and returns `[]`.
  - _Requirements: 7.3, 7.4, 9.3, 9.5_

  - [x] 1.1 Implement storage helpers (`loadItems`, `saveItems`, `saveString`)
    - Write the three helpers inside the `DOMContentLoaded` wrapper.
    - _Requirements: 7.3, 7.4, 9.3, 9.5_

  - [ ]* 1.2 Write property test for `loadItems` malformed-data behavior
    - **Property 14: Malformed localStorage data is discarded and returns an empty list**
    - **Validates: Requirements 7.4, 9.5**

- [ ] 2. Implement Clock & Greeting module
  - Implement `clockModule.init()` and `clockModule.tick()` in **Section 2** of
    `script.js`.
  - `tick()` must update `#current-time` (HH:MM:SS, zero-padded) and
    `#current-date` ("Weekday, DD Month YYYY") and call `greetingModule.render`.
  - Implement `greetingModule.render(userName)` which reads `new Date().getHours()`
    and writes the appropriate phrase to `#greeting`; substitutes `"Friend"` when
    `userName` is falsy.
  - Expose a pure `formatTime(h, m, s)` helper and a `formatDate(dateObj)` helper
    so they can be independently tested.
  - Expose a pure `getGreetingPhrase(hour, userName)` helper for the same reason.
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ] 2.1 Implement `formatTime`, `formatDate`, `getGreetingPhrase` pure helpers
    - Write zero-padding logic and greeting-range mapping.
    - _Requirements: 1.1, 1.3, 2.1–2.6_

  - [ ]* 2.2 Write property test for `formatTime` zero-padding (Property 1)
    - **Property 1: Time formatting always zero-pads two digits**
    - **Validates: Requirements 1.1**

  - [ ]* 2.3 Write property test for `formatDate` pattern (Property 2)
    - **Property 2: Date formatting always matches the expected pattern**
    - **Validates: Requirements 1.3**

  - [ ]* 2.4 Write property test for `getGreetingPhrase` hour mapping (Property 3)
    - **Property 3: Greeting phrase maps correctly for all hours and names**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

  - [ ] 2.5 Implement `clockModule.init()` and `clockModule.tick()`
    - Start a `setInterval` (1 000 ms) that calls `tick()`; call `tick()` once
      immediately on `init()`.
    - _Requirements: 1.1, 1.2, 1.3, 2.7_

- [ ] 3. Checkpoint — clock and greeting
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Theme module
  - Implement `themeModule.{init, applyTheme, toggle}` in **Section 6** of
    `script.js`.
  - `applyTheme(t)` sets `document.documentElement.setAttribute('data-theme', t)`
    and updates the `#btn-theme-toggle` label.
  - `init()` reads `localStorage['theme']`; defaults to `"light"` if the stored
    value is absent or not `"light"` / `"dark"`.
  - `toggle()` flips the active theme and calls `saveString('theme', newTheme)`.
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ] 4.1 Implement `themeModule.applyTheme` and `themeModule.toggle`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 4.2 Implement `themeModule.init` with localStorage load and fallback
    - _Requirements: 10.5, 10.6_

  - [ ]* 4.3 Write property test for theme toggle round-trip (Property 18)
    - **Property 18: Theme toggle is a round-trip (double-toggle returns to original theme)**
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [ ]* 4.4 Write property test for unrecognized theme default (Property 19)
    - **Property 19: Unrecognized or absent theme key defaults to "light"**
    - **Validates: Requirements 10.6**

- [x] 5. Implement Name Modal module
  - Implement `nameModule.{init, openModal, closeModal, saveName}` in **Section 7**.
  - `openModal()` removes `hidden` from `#modal-name`, pre-populates `#input-name`
    with the currently saved name, and focuses the input.
  - `closeModal()` adds `hidden` and clears any inline validation message.
  - `saveName()` trims the input; if empty/whitespace-only, shows
    `"Please enter a name."` inline without saving; otherwise saves to
    `localStorage['userName']` and calls `greetingModule.render` to update the
    greeting within 500 ms.
  - Inject a `<p class="error-msg" id="name-error-msg">` inside the modal form for
    validation feedback (if not already in `index.html`).
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 5.1 Implement `nameModule.openModal`, `nameModule.closeModal`
    - Wire `#btn-set-name` click → `openModal()`, `#btn-modal-close` click →
      `closeModal()`.
    - _Requirements: 3.1, 3.6_

  - [x] 5.2 Implement `nameModule.saveName` with validation and greeting update
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.3 Write property test for name save/load round-trip (Property 4)
    - **Property 4: Name save/load round-trip preserves the trimmed value**
    - **Validates: Requirements 3.2, 3.4**

  - [ ]* 5.4 Write property test for whitespace-only names rejected (Property 5)
    - **Property 5: Whitespace-only names are rejected without mutating state**
    - **Validates: Requirements 3.5**

- [ ] 6. Checkpoint — theme and name modal
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Focus Timer module
  - Implement `timerModule.{init, start, stop, reset, tick, render}` in **Section 3**.
  - In-memory state: `timerState = { totalSeconds: 1500, intervalId: null, running: false }`.
  - `render()` writes formatted MM:SS to `#timer-minutes`/`#timer-seconds` spans and
    sets the disabled states of the three buttons per the running/stopped invariant.
  - `tick()` decrements `totalSeconds`; at 0 it stops the interval, fires
    `window.alert("Focus session complete!")`, and restores button states (Start
    enabled, Stop disabled); the display stays at `00:00`.
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 7.1 Implement `timerModule.render` and initial state setup
    - _Requirements: 4.1, 4.3, 4.5_

  - [x] 7.2 Implement `timerModule.start`, `timerModule.stop`, `timerModule.reset`
    - `start()` and `stop()` flip `running` flag and update the interval handle;
      `reset()` clears the interval and restores to 1 500 s.
    - _Requirements: 4.2, 4.4, 4.6_

  - [ ]* 7.3 Write property test for timer button-state invariant (Property 6)
    - **Property 6: Timer button states are always consistent with running state**
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6**

  - [x] 7.4 Implement `timerModule.tick` with 00:00 detection and alert
    - _Requirements: 4.7, 4.8_

- [ ] 8. Checkpoint — focus timer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Task Manager module
  - Implement `taskModule.{init, addTask, deleteTask, toggleTask, beginEdit, saveEdit, cancelEdit, renderList, persistTasks, loadTasks}` in **Section 4**.
  - In-memory state: `let tasks = []`.
  - Each Task: `{ id: Date.now(), text: String, done: Boolean }`.
  - `renderList()` clears and rebuilds `#todo-list` using the dynamic `<li>` template
    from the design; shows `#todo-empty-msg` when the list is empty.
  - `persistTasks()` calls `saveItems('tasks', tasks)`.
  - `loadTasks()` calls `loadItems('tasks')`.
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 9.1 Implement `taskModule.loadTasks`, `taskModule.persistTasks`, and `taskModule.renderList`
    - Wire `#todo-empty-msg` visibility to `tasks.length === 0`.
    - _Requirements: 5.2, 5.9, 7.2, 7.3_

  - [ ]* 9.2 Write property test for rendered task item structure (Property 8)
    - **Property 8: Each rendered task item always contains all required elements**
    - **Validates: Requirements 5.2**

  - [x] 9.3 Implement `taskModule.addTask` (without duplicate check)
    - Generate unique ID via `Date.now()`, push to `tasks`, call `persistTasks` and
      `renderList`, clear the input.
    - _Requirements: 5.1_

  - [ ]* 9.4 Write property test for addTask growing the list by one (Property 7)
    - **Property 7: Adding a valid task grows the list by exactly one**
    - **Validates: Requirements 5.1**

  - [x] 9.5 Implement `taskModule.toggleTask`
    - Flip `done` on the matching task, call `persistTasks` and `renderList`.
    - _Requirements: 5.3, 5.4_

  - [ ]* 9.6 Write property test for task completion toggle round-trip (Property 9)
    - **Property 9: Task completion toggle is a round-trip**
    - **Validates: Requirements 5.3, 5.4**

  - [x] 9.7 Implement `taskModule.deleteTask`
    - Filter `tasks` by `id`, call `persistTasks` and `renderList`.
    - _Requirements: 5.8_

  - [ ]* 9.8 Write property test for deleteTask removes exactly one task (Property 11)
    - **Property 11: Deleting a task removes exactly that task from the list**
    - **Validates: Requirements 5.8**

  - [x] 9.9 Implement `taskModule.beginEdit`, `taskModule.saveEdit`, `taskModule.cancelEdit`
    - `beginEdit` replaces `.task-text` span with a focused `<input class="task-edit-input">`.
    - `saveEdit` trims; if empty/whitespace discard and restore original text;
      otherwise update `task.text`, persist, and render.
    - `cancelEdit` restores the read-only span without changes.
    - _Requirements: 5.5, 5.6, 5.7_

  - [ ]* 9.10 Write property test for whitespace-only edits discarded (Property 10)
    - **Property 10: Whitespace-only inline edits are discarded**
    - **Validates: Requirements 5.7**

  - [ ]* 9.11 Write property test for task persistence round-trip (Property 13)
    - **Property 13: Task persistence round-trip preserves data and insertion order**
    - **Validates: Requirements 7.1, 7.2**

- [x] 10. Implement Duplicate Task Prevention
  - Extend `taskModule.addTask` to run the duplicate check **before** inserting.
  - Duplicate check: `text.trim().toLowerCase()` vs every existing task's
    `task.text.trim().toLowerCase()`, regardless of `done` status.
  - On duplicate: show `#todo-duplicate-msg` (remove `hidden`), do NOT add the task.
  - On any subsequent change to `#input-task`, hide `#todo-duplicate-msg` again.
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 10.1 Add duplicate detection logic inside `taskModule.addTask`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 10.2 Write property test for duplicate detection (Property 12)
    - **Property 12: Duplicate detection is case- and whitespace-insensitive**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 10.3 Bind `#input-task` `input` event to hide duplicate warning
    - _Requirements: 6.4_

- [ ] 11. Checkpoint — task manager and duplicate prevention
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement Quick Links module
  - Implement `linkModule.{init, addLink, deleteLink, renderList, persistLinks, loadLinks}` in **Section 5**.
  - In-memory state: `let links = []`.
  - Each Link: `{ id: Date.now(), label: String, url: String }`.
  - URL validation: use `inputLinkUrl.checkValidity()` (browser built-in `type="url"`
    constraint). Show inline error `"Please enter a valid URL (e.g. https://example.com)."` on failure.
  - `renderList()` rebuilds `#links-list`; shows `#links-empty-msg` when empty;
    anchors must have `target="_blank"` and `rel="noopener noreferrer"`.
  - `persistLinks()` wraps `saveItems('links', links)` in a `try/catch` for
    `QuotaExceededError`; on error shows inline message
    `"Could not save links. Storage may be full."` without removing links from view.
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 12.1 Implement `linkModule.loadLinks`, `linkModule.persistLinks`, and `linkModule.renderList`
    - Render the dynamic `<li>` template from the design; handle `QuotaExceededError`
      in `persistLinks`.
    - _Requirements: 8.2, 8.3, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 12.2 Write property test for rendered link item anchor attributes (Property 15)
    - **Property 15: Each rendered link item contains the required anchor attributes**
    - **Validates: Requirements 8.2, 8.3**

  - [ ] 12.3 Implement `linkModule.addLink` with label and URL validation
    - Empty label or URL → do not add (Req 8.5); invalid URL → show inline error
      (Req 8.7).
    - _Requirements: 8.1, 8.5, 8.7_

  - [ ] 12.4 Implement `linkModule.deleteLink`
    - _Requirements: 8.4_

  - [ ]* 12.5 Write property test for deleteLink removes exactly one link (Property 16)
    - **Property 16: Deleting a link removes exactly that link from the list**
    - **Validates: Requirements 8.4**

  - [ ]* 12.6 Write property test for link persistence round-trip (Property 17)
    - **Property 17: Link persistence round-trip preserves data and insertion order**
    - **Validates: Requirements 9.1, 9.2**

- [ ] 13. Wire all modules together in `init()`
  - Implement the `init()` bootstrap function in **Section 8** of `script.js`.
  - Call every module's `init()` method in the following order:
    `themeModule.init()`, `nameModule.init()`, `clockModule.init()`,
    `timerModule.init()`, `taskModule.init()`, `linkModule.init()`.
  - Call `init()` as the last statement inside `DOMContentLoaded`.
  - Verify that no module's `init()` depends on another having already rendered;
    adjust order if a dependency is discovered.
  - _Requirements: 1.1, 2.1, 3.4, 4.1, 7.2, 9.2, 10.5_

  - [ ] 13.1 Write and call `init()` to bootstrap all modules
    - _Requirements: 1.1, 2.1, 3.4, 4.1, 7.2, 9.2, 10.5_

- [ ] 14. Final checkpoint — full integration
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify: page loads without console errors, all localStorage keys
    survive a page reload, theme is applied before first paint, all CRUD flows
    work end-to-end.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) and
  should run a minimum of 100 iterations each.
- Tag format for each property test:
  `// Feature: todo-life-dashboard, Property <N>: <property_text>`
- Each task references specific requirements for traceability.
- The `index.html` and `css/style.css` files are complete; do not modify them
  unless correcting an actual gap discovered during implementation.
- All JavaScript lives in `js/script.js` — no modules, no bundler.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5"] },
    { "id": 3, "tasks": ["4.1", "4.2", "9.1"] },
    { "id": 4, "tasks": ["4.3", "4.4", "5.1", "7.1", "9.2"] },
    { "id": 5, "tasks": ["5.2", "7.2", "9.3", "12.1"] },
    { "id": 6, "tasks": ["5.3", "5.4", "7.3", "7.4", "9.4", "9.5", "12.2", "12.3"] },
    { "id": 7, "tasks": ["9.6", "9.7", "9.9", "10.1", "12.4"] },
    { "id": 8, "tasks": ["9.8", "9.10", "9.11", "10.2", "10.3", "12.5", "12.6"] },
    { "id": 9, "tasks": ["13.1"] }
  ]
}
```
