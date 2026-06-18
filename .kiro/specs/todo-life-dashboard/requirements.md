# Requirements Document

## Introduction

The **To-Do Life Dashboard** is a single-page web application built with HTML, CSS, and Vanilla JavaScript for CodingCamp-17June26-Lewi Lucky Siagian. The dashboard provides a unified personal productivity hub that combines a live clock, contextual greeting, a 25-minute focus timer, a to-do task manager, and a quick-links panel — all persisted in the browser's Local Storage with no backend required. Users may also choose a light or dark color theme and set a custom display name.

---

## Glossary

- **Dashboard**: The single HTML page (`index.html`) that hosts all widgets.
- **Clock_Widget**: The UI element that continuously displays the current local time and date.
- **Greeting_Widget**: The UI element that shows a personalized, time-aware greeting message.
- **Timer**: The focus countdown timer component with a configurable 25-minute default.
- **Task_Manager**: The to-do list component that creates, reads, updates, and deletes tasks.
- **Task**: A single to-do item containing a text description and a completion state.
- **Link_Manager**: The quick-links component that stores and opens user-defined URLs.
- **Link**: A named URL entry consisting of a label and a valid URL.
- **Local_Storage**: The browser's `localStorage` API used for client-side data persistence.
- **Theme_Toggle**: The button that switches the Dashboard between light and dark visual modes.
- **User_Name**: The custom display name stored in Local_Storage and shown in the greeting.
- **Duplicate_Task**: A Task whose normalized text is identical (case-insensitive, trimmed) to an existing Task in the Task_Manager.

---

## Requirements

### Requirement 1: Live Clock and Date Display

**User Story:** As a user, I want to see the current time and date on the Dashboard, so that I can stay aware of the time without switching to another app.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Clock_Widget SHALL display the current local time in HH:MM:SS format with each component zero-padded to two digits.
2. WHILE the Dashboard is open, THE Clock_Widget SHALL update the displayed time once per second using `setInterval`.
3. WHEN the Dashboard loads, THE Clock_Widget SHALL display the current local date in the format "Weekday, DD Month YYYY" (e.g., "Monday, 17 June 2026") using the browser's locale-aware `Date` API.

---

### Requirement 2: Time-Based Greeting

**User Story:** As a user, I want to see a greeting that reflects the time of day, so that the Dashboard feels personal and contextually relevant.

#### Acceptance Criteria

1. WHEN the local hour is between 05 and 11 (inclusive), THE Greeting_Widget SHALL display the message "Good morning, [User_Name]!".
2. WHEN the local hour is between 12 and 17 (inclusive), THE Greeting_Widget SHALL display the message "Good afternoon, [User_Name]!".
3. WHEN the local hour is between 18 and 20 (inclusive), THE Greeting_Widget SHALL display the message "Good evening, [User_Name]!".
4. WHEN the local hour is between 21 and 23 (inclusive), THE Greeting_Widget SHALL display the message "Good night, [User_Name]!".
5. WHEN the local hour is between 00 and 04 (inclusive), THE Greeting_Widget SHALL display the message "Good night, [User_Name]!".
6. IF no User_Name has been set, THEN THE Greeting_Widget SHALL substitute "Friend" for [User_Name] in all greeting messages.
7. WHEN the local hour crosses a boundary into a new greeting range, THE Greeting_Widget SHALL re-evaluate and update the greeting text within the same one-second clock tick.

---

### Requirement 3: Custom Name Setting

**User Story:** As a user, I want to enter my own name, so that the greeting addresses me personally.

#### Acceptance Criteria

1. WHEN the user clicks the "Set Name" button, THE Dashboard SHALL display a modal dialog containing a text input and a Save button.
2. WHEN the user submits the name form with a non-empty, non-whitespace-only value, THE Dashboard SHALL save the trimmed name string (maximum 50 characters) to Local_Storage under the key `userName`.
3. WHEN the user submits the name form with a valid name, THE Greeting_Widget SHALL reflect the saved User_Name within 500 milliseconds without requiring a page reload.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the `userName` key from Local_Storage and apply it as User_Name if a non-empty value exists.
5. IF the user submits the name form with an empty or whitespace-only value, THEN THE Dashboard SHALL keep the modal open and display an inline validation message "Please enter a name." without saving to Local_Storage.
6. WHEN the user reopens the modal after a name has been saved, THE Dashboard SHALL pre-populate the text input with the currently saved User_Name.

---

### Requirement 4: Focus Timer

**User Story:** As a user, I want a focus countdown timer, so that I can use the Pomodoro technique to manage my work sessions.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Timer SHALL display an initial countdown value of 25:00 (MM:SS format, zero-padded).
2. WHEN the user clicks the Start button, THE Timer SHALL begin counting down from the current displayed value in one-second intervals.
3. WHILE the Timer is running, THE Timer SHALL disable the Start button, enable the Stop button, and keep the Reset button enabled.
4. WHEN the user clicks the Stop button, THE Timer SHALL pause the countdown at the current value.
5. WHILE the Timer is paused, THE Timer SHALL enable the Start button, disable the Stop button, and keep the Reset button enabled.
6. WHEN the user clicks the Reset button, THE Timer SHALL stop any active countdown and restore the display to 25:00, with Start button enabled and Stop button disabled.
7. WHEN the Timer countdown reaches 00:00, THE Timer SHALL stop automatically and restore the Start button to enabled and the Stop button to disabled.
8. WHEN the Timer countdown reaches 00:00, THE Dashboard SHALL notify the user via a browser `alert` with the message "Focus session complete!".

---

### Requirement 5: To-Do Task Management

**User Story:** As a user, I want to add, edit, mark, and delete tasks in a to-do list, so that I can track my daily activities from the Dashboard.

#### Acceptance Criteria

1. WHEN the user submits the add-task form with a non-empty, non-whitespace-only task description, THE Task_Manager SHALL append a new Task (with a unique ID, text, and `done: false`) to the task list.
2. WHEN a new Task is added, THE Task_Manager SHALL render a list item containing the task text, a completion checkbox, an Edit button, and a Delete button.
3. WHEN the user checks the completion checkbox of a Task, THE Task_Manager SHALL apply a "done" CSS class causing strikethrough text and reduced opacity (≤ 0.6) to that Task's list item.
4. WHEN the user unchecks the completion checkbox of a Task, THE Task_Manager SHALL remove the "done" CSS class from that Task's list item.
5. WHEN the user clicks the Edit button on a Task, THE Task_Manager SHALL replace the task text span with an inline `<input>` element pre-filled with the current task text and focused.
6. WHEN the user confirms an inline edit by pressing Enter or clicking a Save button, THE Task_Manager SHALL update the Task text with the trimmed input value and restore the read-only text view.
7. IF the user confirms an inline edit with an empty or whitespace-only value, THEN THE Task_Manager SHALL discard the edit and restore the original task text unchanged.
8. WHEN the user clicks the Delete button on a Task, THE Task_Manager SHALL permanently remove that Task from the list and from Local_Storage.
9. WHEN the task list contains no Tasks, THE Task_Manager SHALL display the message "No tasks yet. Add one above!" in place of the list.

---

### Requirement 6: Duplicate Task Prevention

**User Story:** As a user, I want the Dashboard to warn me when I add a task that already exists, so that I do not accidentally create redundant items.

#### Acceptance Criteria

1. WHEN the user submits the add-task form, THE Task_Manager SHALL compare the trimmed, lowercased input value against the trimmed, lowercased text of every existing Task, regardless of each Task's completion status.
2. IF a Duplicate_Task is detected on form submission, THEN THE Task_Manager SHALL display the warning message "⚠️ This task already exists." inline below the input field and retain the current input value.
3. IF a Duplicate_Task is detected on form submission, THEN THE Task_Manager SHALL NOT add the duplicate Task to the list.
4. WHILE a duplicate warning is visible, WHEN the user changes the value of the task input field, THE Task_Manager SHALL hide the duplicate warning message.

---

### Requirement 7: Task Persistence

**User Story:** As a user, I want my tasks to be saved automatically, so that I do not lose them when I refresh or close the browser.

#### Acceptance Criteria

1. WHEN a Task is added, edited, its completion state is toggled, or deleted, THE Task_Manager SHALL write the current task list to Local_Storage under the key `tasks`.
2. WHEN the Dashboard loads, THE Task_Manager SHALL read the `tasks` key from Local_Storage and render all previously saved Tasks in their original insertion order.
3. IF the `tasks` key does not exist in Local_Storage, THEN THE Task_Manager SHALL render an empty task list.
4. IF the data stored under the `tasks` key is malformed or cannot be parsed, THEN THE Task_Manager SHALL discard the corrupt data, clear the `tasks` key, and render an empty task list.

---

### Requirement 8: Quick Links Management

**User Story:** As a user, I want to save and open frequently visited URLs from the Dashboard, so that I can navigate quickly without searching my bookmarks.

#### Acceptance Criteria

1. WHEN the user submits the add-link form with a non-empty label (maximum 100 characters) and a URL that passes the browser's built-in `type="url"` validation (has a valid scheme and host), THE Link_Manager SHALL append a new Link to the links list.
2. WHEN a new Link is added, THE Link_Manager SHALL render a list item containing a clickable anchor displaying the link label, and a Delete button.
3. WHEN the user clicks a link anchor, THE Link_Manager SHALL open the stored URL in a new browser tab (`target="_blank"` with `rel="noopener noreferrer"`).
4. WHEN the user clicks the Delete button on a Link, THE Link_Manager SHALL permanently remove that Link from the list and from Local_Storage.
5. IF the user submits the add-link form with an empty label or an empty URL, THEN THE Link_Manager SHALL NOT add the Link.
6. WHEN the links list is empty, THE Link_Manager SHALL display the message "No links yet. Add one above!".
7. IF the user submits the add-link form with a non-empty URL that fails `type="url"` validation, THEN THE Link_Manager SHALL NOT add the Link and SHALL display an inline error message "Please enter a valid URL (e.g. https://example.com)." below the URL input.

---

### Requirement 9: Link Persistence

**User Story:** As a user, I want my quick links to be saved automatically, so that they are available after a page refresh.

#### Acceptance Criteria

1. WHEN a Link is added or deleted, THE Link_Manager SHALL write the current links list to Local_Storage under the key `links`.
2. WHEN the Dashboard loads, THE Link_Manager SHALL read the `links` key from Local_Storage and render all previously saved Links.
3. IF the `links` key does not exist in Local_Storage, THEN THE Link_Manager SHALL render an empty links list.
4. IF the Local_Storage write operation fails (e.g., quota exceeded), THEN THE Link_Manager SHALL retain the in-memory links list and display an inline error message "Could not save links. Storage may be full." without removing the newly added or existing links from view.
5. IF the data stored under the `links` key is malformed or cannot be parsed, THEN THE Link_Manager SHALL discard the corrupt data, clear the `links` key, and render an empty links list.

---

### Requirement 10: Light/Dark Mode Toggle

**User Story:** As a user, I want to switch between a light and dark color theme, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN the user clicks the Theme_Toggle button, THE Dashboard SHALL toggle the `data-theme` attribute on the `<html>` element between `"light"` and `"dark"`.
2. WHEN the `data-theme` attribute is set to `"dark"`, THE Theme_Toggle button label SHALL change to "☀️ Light Mode".
3. WHEN the `data-theme` attribute is set to `"light"`, THE Theme_Toggle button label SHALL change to "🌙 Dark Mode".
4. WHEN the user toggles the theme, THE Dashboard SHALL save the active theme string (`"light"` or `"dark"`) to Local_Storage under the key `theme`.
5. WHEN the Dashboard loads, THE Dashboard SHALL read the `theme` key from Local_Storage and set the `data-theme` attribute on `<html>` to the stored value.
6. IF the `theme` key does not exist in Local_Storage or contains an unrecognized value, THEN THE Dashboard SHALL default to `"light"` theme.
