# EXECUTE

EXECUTE is a simple personal productivity dashboard built to help manage tasks, goals, focus sessions, and daily progress from one place.

The project focuses on a clean interface, minimal distractions, and fast interaction.

## Features

- Dashboard overview
- Task management
- Add Task modal
- Goal management
- Add Goal modal
- 25-minute focus timer
- Progress tracking
- Light / Dark mode
- Collapsible desktop sidebar
- Responsive mobile layout
- Mobile bottom navigation
- Recent activity
- Local browser storage for preferences

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- SVG icons
- LocalStorage

No frameworks or external libraries are currently required.

## Project Structure

```text
EXECUTE/
├── index.html
├── styles/
│   └── style.css
├── js/
│   └── app.js
└── README.md

The current version keeps the HTML, CSS, and JavaScript in a single index.html file to make the project easy to run and modify.

Main Sections
Dashboard

The dashboard gives a quick overview of the day:

Current focus
Task progress
Completed tasks
Goals in progress
Focus sessions
Recent activity
Tasks

Tasks can be created and managed through the task interface.

Each task can contain information such as:

Title
Category
Priority
Duration
Completion status

Tasks can be marked as completed directly from the task list.

Goals

Goals represent longer-term objectives.

Each goal can contain:

Goal title
Description
Progress
Target information

Progress is displayed visually using progress bars.

Focus

The Focus section provides a simple timer for deep-work sessions.

Default session:

25:00

The timer supports:

Start
Pause
Resume
Reset after completion
Progress

The Progress page provides a quick overview of execution, including:

Tasks completed
Focus time
Current streak
Weekly execution
Settings

Settings currently include:

Light / Dark theme
Sidebar controls
Local data information
Theme System

EXECUTE supports light and dark themes using CSS variables.

The current theme is stored in the browser's LocalStorage so the user's preference remains after refreshing the page.

execute_theme

The application uses:

<html data-theme="light">

for light mode and:

<html data-theme="dark">

for dark mode.

Responsive Design

EXECUTE is designed for desktop, tablet, and mobile screens.

Desktop

Desktop uses a sidebar navigation.

Tablet

The layout reduces the number of grid columns to make better use of available space.

Mobile

Mobile uses:

Sticky top header
Bottom navigation
Single-column content
Horizontal activity cards

The interface is designed to remain usable on small screens without requiring horizontal page scrolling.

Local Storage

The current application uses LocalStorage for small pieces of persistent UI state.

Currently stored preferences include:

execute_theme
execute_sidebar_collapsed

The project can later be expanded to persist tasks and goals as well.

Design Principles

EXECUTE is designed around a few principles:

Keep it simple

The interface should help the user execute rather than create more work.

Focus on the important information

Tasks, goals, focus time, and progress should be visible without unnecessary complexity.

Responsive by default

New features should work on both desktop and mobile.

Minimal dependencies

The project currently uses native HTML, CSS, and JavaScript instead of relying on large external libraries.

Future Improvements

Possible future features include:

Edit tasks
Delete tasks
Edit goals
Delete goals
Persistent task data
Persistent goal data
Daily planning
Calendar integration
More detailed statistics
User accounts
Cloud synchronization
AI-assisted task planning
Running the Project

No installation is required.

Open:

index.html

directly in a modern browser.

Alternatively, run a local server:

python -m http.server 8000

Then open:

http://localhost:8000
Status

Active development

EXECUTE is currently a frontend productivity application and is being developed incrementally.

The goal is to keep the core experience fast and simple while gradually adding more useful productivity functionality.

License

This project is currently for personal development and experimentation.
```
