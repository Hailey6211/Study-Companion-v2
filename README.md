# Study Bloom

A pastel, GitHub Pages-friendly static study companion for organizing classes, assignments, notes, flashcards, study sessions, and messages.

## Features

- Device-local sign in screen
- Dashboard with tasks, progress, and a Pomodoro-style timer
- Calendar with assignment deadlines
- Classes and assignment creation
- Persistent flashcard sets with click-to-reveal practice
- Notes
- Inbox / compose message demo
- Pastel rainbow color picker and dark mode
- Responsive desktop and mobile layout

## Run locally

Open `index.html` in a browser. No build step or dependencies are required.

## Publish with GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Choose `main` and `/ (root)`, then select **Save**.
4. GitHub will provide the published URL after the workflow completes.

## Important limitation

This is a static front-end app. Account information, tasks, notes, flashcards, and demo messages are stored in the browser's `localStorage`; there is no real server-side authentication or cross-user messaging. Real multi-user login and messaging would require a backend service such as Firebase or Supabase.
