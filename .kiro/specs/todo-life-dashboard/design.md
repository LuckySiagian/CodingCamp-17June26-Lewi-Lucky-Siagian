# Design Document — To-Do Life Dashboard

## Overview

The To-Do Life Dashboard is a single-page web application delivered as three files:
`index.html`, `css/style.css`, and `js/script.js`. There is no build step, no bundler,
and no server — the page is opened directly in a browser.

All state lives in two places:
- **In-memory** JavaScript variables (authoritative during a session)
- **`localStorage`** (persisted across sessions)

On every mutation the in-memory state is serialized and written to `localStorage`.
On every page load `localStorage` is read and used to hydrate the in-memory state
before the first render.

### Key design decisions

| Decision | Rationale |
|---|---|
| Single `script.js`, no modules | No build tooling; the file is organized into logical sections with clear comments |
| `DOMContentLoaded` entry point | Guarantees the DOM is ready before any query selector runs |
| `data-theme` attribute on `<html>` | CSS custom properties cascade from the root; a single attribute flip re-themes the entire page |
| `setInterval` for clock and timer | Lightweight, sufficient precision for 1-second ticks |
| `localStorage` as the only store | Satisfies the no-backend constraint; quota limits are handled gracefully |
| Unique task IDs via `Date.now()` | Sufficient for single-user, single-tab usage |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  index.html  (structure + IDs)                                 │
│  css/style.css  (tokens via CSS custom properties)             │
│                                                                │
│  js/script.js                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  IIFE / DOMContentLoaded wrapper                         │  │
│  │                                                          │  │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐  │  │
│  │  │  Storage   │  │  State      │  │  DOM Refs        │  │  │
│  │  │  (R/W)     │  │  (in-memory)│  │  (cached)        │  │  │
│  │  └─────┬──────┘  └──────┬──────┘  └────────┬─────────┘  │  │
│  │        │                │                   │            │  │
│  │  ┌─────▼────────────────▼───────────────────▼─────────┐  │  │
│  │  │              Module Functions                       │  │  │
│  │  │  clockModule  │  timerModule  │  taskModule         │  │  │
│  │  │  linkModule   │  themeModule  │  nameModule         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │  init()  — called once, wires all event listeners │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  localStorage                                                  │
│  ┌──────────┬──────────┬─────────────────────────────────┐    │
│  │  tasks   │  links   │  userName  │  theme             │    │
│  └──────────┴──────────┴─────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

Data flow is always **unidirectional**:

```
User action → event handler → mutate state → persist to localStorage → re-render DOM
```

There is no two-way binding framework. Every render function is a pure "paint the DOM
from current state" operation. Functions are called explicitly after each mutation.

---

## Components and Interfaces

### Clock_Widget

**Responsibility:** Display the current local time (HH:MM:SS) and date
("Weekday, DD Month YYYY"). Update every second.

**DOM targets:**
- `#current-time` — time string
- `#current-date` — date string

**Interface:**
```js
clockModule.init()      // starts setInterval, renders immediately
clockModule.tick()      // called each interval; updates time + date + greeting
```

The clock tick also triggers a greeting re-evaluation so the greeting range boundary
is respected within the same second (Requirement 2.7).

---

### Greeting_Widget

**Responsibility:** Display a time-aware, personalized greeting.

**DOM target:** `#greeting`

**Interface:**
```js
greetingModule.render(userName)  // computes greeting phrase from Date().getHours()
                                 // and writes to #greeting
```

Greeting ranges (all inclusive):

| Hours | Phrase |
|---|---|
| 05 – 11 | Good morning |
| 12 – 17 | Good afternoon |
| 18 – 20 | Good evening |
| 21 – 23 | Good night |
| 00 – 04 | Good night |

If `userName` is falsy (empty string or null), "Friend" is substituted.

---

### Timer

**Responsibility:** 25-minute countdown with Start / Stop / Reset controls.

**DOM targets:**
- `#timer-minutes`, `#timer-seconds` — display spans
- `#btn-timer-start`, `#btn-timer-stop`, `#btn-timer-reset` — control buttons

**In-memory state:**
```js
timerState = {
  totalSeconds: 1500,   // current countdown value (25 * 60)
  intervalId:   null,   // setInterval handle; null when paused/stopped
  running:      false
}
```

**Interface:**
```js
timerModule.init()     // binds button event listeners
timerModule.start()    // begins / resumes countdown
timerModule.stop()     // pauses countdown
timerModule.reset()    // stops and restores to 1500 s
timerModule.tick()     // decrements totalSeconds; checks for 00:00; updates DOM
timerModule.render()   // writes MM:SS to DOM spans; sets button disabled states
```

On reaching 00:00: calls `window.alert("Focus session complete!")` then resets
button states (Start enabled, Stop disabled). Does **not** auto-reset the time
display — the display stays at 00:00 until the user clicks Reset.

---

### Task_Manager

**Responsibility:** Create, read, update, delete to-do tasks. Detect duplicates.
Persist to `localStorage['tasks']`.

**DOM targets:**
- `#form-add-task`, `#input-task` — add form
- `#todo-duplicate-msg` — duplicate warning (toggled with `hidden` attribute)
- `#todo-list` — `<ul>` container
- `#todo-empty-msg` — empty state paragraph

**In-memory state:**
```js
tasks = []   // array of Task objects (see Data Models)
```

**Interface:**
```js
taskModule.init()                  // loads from localStorage, binds form events
taskModule.addTask(text)           // validates, deduplicates, appends, persists, renders
taskModule.deleteTask(id)          // removes by id, persists, renders
taskModule.toggleTask(id)          // flips done flag, persists, renders
taskModule.beginEdit(id)           // replaces text span with inline input
taskModule.saveEdit(id, newText)   // validates, updates, persists, renders
taskModule.cancelEdit(id)          // restores read-only view without change
taskModule.renderList()            // re-builds #todo-list from tasks array
taskModule.persistTasks()          // JSON.stringify(tasks) → localStorage
taskModule.loadTasks()             // JSON.parse from localStorage; falls back to []
```

Duplicate detection: `text.trim().toLowerCase()` vs every existing task's
`task.text.trim().toLowerCase()`, regardless of completion state.

---

### Link_Manager

**Responsibility:** Add and delete quick-link entries. Persist to `localStorage['links']`.

**DOM targets:**
- `#form-add-link`, `#input-link-label`, `#input-link-url` — add form
- `#links-list` — `<ul>` container
- `#links-empty-msg` — empty state paragraph
- An inline `<p class="error-msg">` injected below `#input-link-url` for URL errors

**In-memory state:**
```js
links = []   // array of Link objects (see Data Models)
```

**Interface:**
```js
linkModule.init()               // loads from localStorage, binds form events
linkModule.addLink(label, url)  // validates, appends, persists, renders
linkModule.deleteLink(id)       // removes by id, persists, renders
linkModule.renderList()         // re-builds #links-list from links array
linkModule.persistLinks()       // JSON.stringify(links) → localStorage; catches QuotaExceededError
linkModule.loadLinks()          // JSON.parse from localStorage; falls back to []
```

URL validation uses the browser's built-in `<input type="url">` constraint
(`inputElement.checkValidity()`). No custom regex is needed.

Storage quota handling: `persistLinks` wraps the `localStorage.setItem` call in a
`try/catch`; on `QuotaExceededError` the in-memory array is left intact and an
inline error message is shown.

---

### Theme_Toggle

**Responsibility:** Switch the `data-theme` attribute on `<html>` between `"light"`
and `"dark"`. Persist the choice to `localStorage['theme']`.

**DOM targets:**
- `#btn-theme-toggle` — toggle button
- `document.documentElement` — `<html>` element

**Interface:**
```js
themeModule.init()          // loads saved theme, applies, binds button
themeModule.applyTheme(t)   // sets data-theme attribute + updates button label
themeModule.toggle()        // flips between "light" and "dark", persists
```

Button label mapping:
- `data-theme="dark"` → button text `"☀️ Light Mode"`
- `data-theme="light"` → button text `"🌙 Dark Mode"`

Default when `localStorage['theme']` is missing or unrecognized: `"light"`.

---

### Name Modal

**Responsibility:** Collect and save a custom display name. Pre-populate with the
currently saved name on re-open. Validate that the input is non-empty and
non-whitespace-only.

**DOM targets:**
- `#btn-set-name` — header button that opens the modal
- `#modal-name` — modal overlay (toggled with `hidden`)
- `#form-set-name`, `#input-name` — form and input inside modal
- `#btn-modal-close` — cancel button
- An inline `<p class="error-msg" id="name-error-msg">` injected inside the modal
  for validation feedback

**Interface:**
```js
nameModule.init()         // binds open/close/save events
nameModule.openModal()    // removes hidden; pre-populates input; focuses input
nameModule.closeModal()   // adds hidden; clears validation message
nameModule.saveName()     // validates, trims, saves to localStorage, updates greeting
```

---

## Data Models

### Task

```js
{
  id:   Number,   // Date.now() at creation time — unique per session
  text: String,   // trimmed task description, max 200 chars
  done: Boolean   // false on creation; toggled by checkbox
}
```

### Link

```js
{
  id:    Number,  // Date.now() at creation time
  label: String,  // trimmed display label, max 100 chars
  url:   String   // validated URL string (passes <input type="url"> constraint)
}
```

### localStorage Schema

| Key | Type | Description |
|---|---|---|
| `tasks` | `JSON string → Task[]` | Ordered array of Task objects |
| `links` | `JSON string → Link[]` | Ordered array of Link objects |
| `userName` | `string` | Trimmed display name, max 50 chars |
| `theme` | `"light" \| "dark"` | Active color theme |

**Read strategy (tasks and links):**
```js
function loadItems(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return parsed;
  } catch {
    localStorage.removeItem(key);  // discard corrupt data
    return [];
  }
}
```

---

## Module Structure in script.js

`script.js` is organized into labeled sections separated by banner comments.
All code is wrapped in a single `DOMContentLoaded` listener to avoid polluting
the global scope unnecessarily.

```
js/script.js
│
├── Section 1 — Storage helpers
│     loadItems(key), saveItems(key, data), saveString(key, val)
│
├── Section 2 — Clock & Greeting module
│     clockModule.init(), clockModule.tick()
│     greetingModule.render(name)
│
├── Section 3 — Timer module
│     timerModule.{init, start, stop, reset, tick, render}
│
├── Section 4 — Task module
│     taskModule.{init, addTask, deleteTask, toggleTask,
│                 beginEdit, saveEdit, cancelEdit,
│                 renderList, persistTasks, loadTasks}
│
├── Section 5 — Link module
│     linkModule.{init, addLink, deleteLink,
│                 renderList, persistLinks, loadLinks}
│
├── Section 6 — Theme module
│     themeModule.{init, applyTheme, toggle}
│
├── Section 7 — Name modal module
│     nameModule.{init, openModal, closeModal, saveName}
│
└── Section 8 — Bootstrap
      init() — calls every module's init(); called inside DOMContentLoaded
```

---

## DOM Structure Guidance

The existing `index.html` already defines the correct element IDs and classes.
The JavaScript modules **only** interact with elements via the IDs listed in each
component's section above. Key structural notes:

- Task list items are created dynamically and appended to `#todo-list`.
  Each `<li>` carries a `data-id` attribute matching the task's `id` field.
- Link list items are created dynamically and appended to `#links-list`.
  Each `<li>` carries a `data-id` attribute matching the link's `id` field.
- The modal overlay uses the native HTML `hidden` attribute (not a CSS class) so
  that `display: none` is applied unconditionally regardless of theme.
- The timer display uses two separate `<span>` elements (`#timer-minutes` and
  `#timer-seconds`) so that the colon separator is never replaced during updates.
- `aria-live="polite"` on `.timer-display` announces timer changes to screen readers.

### Dynamically rendered task item template

```html
<li class="task-item" data-id="1718600000000">
  <input type="checkbox" class="task-checkbox" aria-label="Mark done" />
  <span class="task-text">Buy groceries</span>
  <div class="task-actions">
    <button class="btn btn-icon btn-secondary" data-action="edit">✏️</button>
    <button class="btn btn-icon btn-danger"    data-action="delete">🗑️</button>
  </div>
</li>
```

### Dynamically rendered link item template

```html
<li class="link-item" data-id="1718600001234">
  <a class="link-anchor" href="https://github.com"
     target="_blank" rel="noopener noreferrer">GitHub</a>
  <div class="link-actions">
    <button class="btn btn-icon btn-danger" data-action="delete">🗑️</button>
  </div>
</li>
```

---

## CSS Theming Strategy

All color values are defined as CSS custom properties on `:root` (light mode
defaults). The `[data-theme="dark"]` selector on `:root` / `html` overrides
exactly those same custom property names with dark-mode values.

```css
:root {
  --color-bg:           #f4f6f9;
  --color-surface:      #ffffff;
  /* … */
}

[data-theme="dark"] {
  --color-bg:           #0f1117;
  --color-surface:      #1c1f2a;
  /* … */
}
```

Switching themes requires only one DOM write:
```js
document.documentElement.setAttribute('data-theme', theme);
```

Every element that uses `var(--color-*)` responds to this change immediately
via CSS cascade. The `transition: background-color 0.2s ease` declarations on
`body` and `.card` provide a smooth visual transition.

No class toggling on individual elements is needed; the attribute on `<html>`
is the single source of truth for the active theme.

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage.getItem` returns `null` | Treat as empty; return `[]` or `""` |
| `JSON.parse` throws on corrupt data | Catch, call `localStorage.removeItem(key)`, return `[]` |
| `localStorage.setItem` throws `QuotaExceededError` | Catch, show inline error, keep in-memory state intact |
| Timer reaches 00:00 | Auto-stop interval, fire `alert`, leave display at 00:00 |
| Task add with empty/whitespace input | Prevent submission; show no duplicate warning (input validation is separate from duplicate check) |
| Link add with invalid URL | Show inline error `"Please enter a valid URL (e.g. https://example.com)."` |
| Name save with empty/whitespace input | Keep modal open; show `"Please enter a name."` |
| Inline task edit saved as empty/whitespace | Discard edit; restore original text |

---

## Testing Strategy

### Unit tests (example-based)

These cover specific behaviors with concrete inputs:

- Clock formatting: `formatTime(9, 5, 3)` → `"09:05:03"`
- Date formatting: given a fixed `Date` object → expected string
- Greeting selection: each of the five hour ranges returns the correct phrase
- Timer display: `formatTimer(90)` → `"01:30"`
- Timer state transitions: start → running; stop → paused; reset → 1500s
- `loadItems` with `null`, valid JSON, invalid JSON, non-array JSON
- Task deduplication: same text different case → detected; different text → not detected
- Name validation: whitespace-only → rejected; trimmed non-empty → accepted
- URL validation via `<input type="url">` constraint check
- Theme default fallback: unrecognized `localStorage` value → `"light"`

### Property-based tests

See **Correctness Properties** section below for universal properties. A property-based
testing library such as [fast-check](https://github.com/dubzzz/fast-check) is recommended
for the JavaScript/browser environment. Each property test should run a minimum of
**100 iterations**.

Tag format for each property test:
`// Feature: todo-life-dashboard, Property <N>: <property_text>`

### Integration / smoke tests

- Page loads without console errors
- All `localStorage` keys survive a page reload round-trip
- Theme applied before first paint (no flash of wrong theme)


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time formatting always zero-pads two digits

*For any* integer hour (0–23), minute (0–59), and second (0–59), the `formatTime`
function SHALL produce a string of the form `"HH:MM:SS"` where each component is
exactly two characters wide and zero-padded when the value is a single digit.

**Validates: Requirements 1.1**

---

### Property 2: Date formatting always matches the expected pattern

*For any* `Date` object, the `formatDate` function SHALL produce a string that
matches the pattern `"<Weekday>, DD <Month> YYYY"` where the weekday and month
names are full English locale words and the day is zero-padded to two digits.

**Validates: Requirements 1.3**

---

### Property 3: Greeting phrase maps correctly for all hours and names

*For any* integer hour in the range 0–23 and any non-null user name string, the
`getGreetingPhrase` function SHALL return a string of the form
`"<Phrase>, <displayName>!"` where:
- hours 05–11 → phrase is `"Good morning"`
- hours 12–17 → phrase is `"Good afternoon"`
- hours 18–20 → phrase is `"Good evening"`
- hours 21–23 or 00–04 → phrase is `"Good night"`
- if the name is empty or whitespace-only → `displayName` is `"Friend"`

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

---

### Property 4: Name save/load round-trip preserves the trimmed value

*For any* string `s` that, after trimming, is non-empty and at most 50 characters,
saving `s` via `nameModule.saveName()` and then reading `localStorage.getItem('userName')`
SHALL return `s.trim()`.

**Validates: Requirements 3.2, 3.4**

---

### Property 5: Whitespace-only names are rejected without mutating state

*For any* string composed entirely of whitespace characters (including the empty
string), calling `nameModule.saveName()` with that value SHALL NOT write to
`localStorage` and SHALL leave the `userName` key unchanged.

**Validates: Requirements 3.5**

---

### Property 6: Timer button states are always consistent with running state

*For any* timer state (running or paused/stopped), the button disabled attributes
SHALL satisfy the invariant:
- `running === true` → Start disabled, Stop enabled, Reset enabled
- `running === false` → Start enabled, Stop disabled, Reset enabled

This invariant must hold after every `start()`, `stop()`, and `reset()` call,
regardless of how many times they are invoked in any order.

**Validates: Requirements 4.3, 4.4, 4.5, 4.6**

---

### Property 7: Adding a valid task grows the list by exactly one

*For any* existing task list and any task description that is non-empty after
trimming, calling `taskModule.addTask(text)` SHALL result in the in-memory task
array having exactly one more element than before.

**Validates: Requirements 5.1**

---

### Property 8: Each rendered task item always contains all required elements

*For any* array of Task objects, calling `taskModule.renderList()` SHALL produce
a `#todo-list` where every `<li>` element contains:
- a `<input type="checkbox">` element
- a `<span class="task-text">` element with the task's text
- a button with `data-action="edit"`
- a button with `data-action="delete"`

**Validates: Requirements 5.2**

---

### Property 9: Task completion toggle is a round-trip (idempotent under double application)

*For any* Task, toggling `done` from `false → true → false` SHALL return the Task
to its original state (the `"done"` CSS class present after the first toggle,
absent after the second). Equivalently, toggling twice is an identity operation.

**Validates: Requirements 5.3, 5.4**

---

### Property 10: Whitespace-only inline edits are discarded

*For any* Task and any edit input string that is empty or composed entirely of
whitespace, confirming the edit via `taskModule.saveEdit(id, newText)` SHALL leave
`task.text` unchanged.

**Validates: Requirements 5.7**

---

### Property 11: Deleting a task removes exactly that task from the list

*For any* task list containing at least one task, calling `taskModule.deleteTask(id)`
SHALL result in a list that:
- no longer contains any task with that `id`
- contains all other tasks unchanged and in the same relative order

**Validates: Requirements 5.8**

---

### Property 12: Duplicate detection is case- and whitespace-insensitive

*For any* existing task list and any candidate text, calling `taskModule.addTask(text)`
SHALL reject the addition (return without mutating the list) if and only if
`text.trim().toLowerCase()` equals the `trim().toLowerCase()` of any existing task's
text, regardless of completion status.

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 13: Task persistence round-trip preserves data and insertion order

*For any* array of Task objects, serializing via `taskModule.persistTasks()` and then
deserializing via `taskModule.loadTasks()` SHALL produce an array that is deeply equal
to the original array and in the same insertion order.

**Validates: Requirements 7.1, 7.2**

---

### Property 14: Malformed localStorage data is discarded and returns an empty list

*For any* string that is not a valid JSON-encoded array (including `null`, `undefined`,
non-JSON strings, valid JSON objects, and valid JSON primitives), calling `loadItems(key)`
after writing that string to `localStorage[key]` SHALL return `[]` and remove the key
from `localStorage`.

**Validates: Requirements 7.4, 9.5**

---

### Property 15: Each rendered link item contains the required anchor attributes

*For any* array of Link objects, calling `linkModule.renderList()` SHALL produce a
`#links-list` where every `<li>` element contains an `<a>` element with:
- `href` equal to the link's `url`
- `target="_blank"`
- `rel="noopener noreferrer"`
- visible text equal to the link's `label`

**Validates: Requirements 8.2, 8.3**

---

### Property 16: Deleting a link removes exactly that link from the list

*For any* links list containing at least one link, calling `linkModule.deleteLink(id)`
SHALL result in a list that no longer contains any link with that `id` and retains
all other links unchanged and in the same relative order.

**Validates: Requirements 8.4**

---

### Property 17: Link persistence round-trip preserves data and insertion order

*For any* array of Link objects, serializing via `linkModule.persistLinks()` and then
deserializing via `linkModule.loadLinks()` SHALL produce an array that is deeply equal
to the original array and in the same insertion order.

**Validates: Requirements 9.1, 9.2**

---

### Property 18: Theme toggle is a round-trip (double-toggle returns to original theme)

*For any* starting theme value (`"light"` or `"dark"`), calling `themeModule.toggle()`
twice SHALL result in the `data-theme` attribute on `<html>` equaling the original
starting value, and the Theme_Toggle button label SHALL match the expected label for
that theme.

**Validates: Requirements 10.1, 10.2, 10.3**

---

### Property 19: Unrecognized or absent theme key defaults to "light"

*For any* string that is neither `"light"` nor `"dark"` (including `null` and `undefined`),
calling `themeModule.init()` with that value in `localStorage['theme']` SHALL set
`data-theme` on `<html>` to `"light"`.

**Validates: Requirements 10.6**
