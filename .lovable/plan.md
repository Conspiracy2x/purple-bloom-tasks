

## Task Management App — Implementation Plan

### Theme & Design
- Light purple color theme (soft lavender palette) applied globally via CSS variables
- Clean, minimal UI with smooth hover/transition animations
- Fully responsive layout for mobile and desktop

### Pages & Navigation
- **Sidebar/Top navigation** with links: Tasks, Dashboard, History
- Three main routes: `/` (Tasks), `/dashboard`, `/history`

### Tasks Page (`/`)
- "Add Task" button opens a modal with two options: **Normal Task** or **Detailed Task**
- **Normal Task form**: Description field only (date/time auto-captured)
- **Detailed Task form**: Heading, Description, Task Type dropdown (Work/Study/Personal/Other), date/time auto-captured
- Active tasks displayed as cards with:
  - Check button to mark complete
  - Edit and Delete actions
  - Visual distinction between Normal and Detailed tasks
- Completed tasks shown in a separate "Completed" section below (with strikethrough/faded style)

### Dashboard Page (`/dashboard`)
- Stat cards: Tasks completed today, this week, and total
- Optional simple bar/pie chart for visual breakdown using recharts

### History Page (`/history`)
- List of all completed tasks with: type badge, title, description, completion date/time
- Sorted by most recent completion

### Data Persistence
- All task data stored in **localStorage** via a custom React hook
- Task model: `{ id, type, heading?, description, taskCategory?, createdAt, completedAt?, completed }`

### Animations
- Fade/slide transitions on task add/remove
- Smooth hover effects on cards and buttons

