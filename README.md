# Daily Wins

Build a simple, clean, responsive Habit Tracking Web App that I can access from both my laptop and phone.

Core idea

The app lets me create habits and mark whether I completed each habit on a particular day. Each habit should have its own GitHub-style heatmap showing my consistency over time.

Features

Dashboard

Show all my habits as separate cards.

Each card should display:

Habit name

Current streak

Longest streak

Completion percentage

A button/checkbox to mark the habit as Done today

A small preview of its heatmap

Clearly show whether today's habit is completed.

Add Habit

Prominent + Add Habit button.

Allow me to enter:

Habit name

Optional description

After creating it, immediately show it on the dashboard.

Daily Tracking

I should be able to mark a habit as completed for today with one click.

Clicking again should undo the completion.

Store completion data by date.

Use the user's local date so that phone and laptop behave consistently.

Individual Habit Page

Clicking a habit opens a detailed page.

Show:

Habit name

Current streak

Longest streak

Total completed days

Completion percentage

Full historical heatmap

Heatmap should look similar to the contribution graph on GitHub:

Each square = one day

Empty/light square = not completed

Filled/darker square = completed

Organize the days by week

Show month labels

Allow viewing several months/approximately one year of history.

Habit Management

Allow editing a habit name/description.

Allow deleting a habit with a confirmation dialog.

Deleting a habit should also remove its associated tracking data.

Data & persistence

The data must persist when I close and reopen the website.

Use a proper backend/database rather than only temporary React state.

Prefer:

React + TypeScript

Tailwind CSS

Supabase for authentication/database

Structure the database so each user's habits and completion records are stored separately.

Create sensible tables such as:

habits

habit_completions

A completion record should contain at minimum:

habit ID

completion date

completed status

Make sure the database has appropriate relationships and prevents duplicate completion records for the same habit and date.

Authentication

Add simple authentication so I can use the same account from my phone and laptop and see the same habits and history on both devices.

Keep authentication simple:

Sign up

Log in

Log out

UI/UX

Make the design minimal, modern, and clean, focused on actually using the tracker every day.

Requirements:

Fully responsive/mobile-first design.

Works well on both phone and desktop.

Large, easy-to-tap completion buttons on mobile.

Clean typography and spacing.

Subtle animations when marking a habit complete.

Avoid unnecessary features, complicated navigation, social features, or gamification.

Use a simple light theme with an optional dark mode if easy to implement.

Dashboard layout

Desktop:

Header with app name, today's date, and profile/logout.

Add Habit button.

Habit cards arranged in a responsive grid.

Mobile:

Single-column habit cards.

Make Done Today extremely easy to tap.

Heatmap should remain usable without horizontal overflow.

Important behavior

If today is September 15 and I mark "React Course" as done, the September 15 square for that habit becomes completed.

If I open the app tomorrow, September 16 should automatically be the new "today" and September 15 should remain in the history.

Calculate streaks correctly:

Current streak = consecutive completed days ending today.

If today is not completed, current streak should be 0.

Longest streak = longest sequence of consecutive completed days in the entire history.

Deployment

Make the project ready to deploy directly to Vercel.

Use environment variables for Supabase credentials and do not hardcode secrets.

The final project should be a functional MVP, not just a UI mockup. Make sure:

Database operations work.

Authentication works.

Creating habits works.

Completing/undoing habits works.

Heatmaps update automatically.

Streak calculations work.

Data persists across devices.

The application is responsive.

Keep the architecture simple and beginner-friendly so I can later study the code and understand how the application works.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6aa46274-40e4-44ae-9c1c-0007af0febf7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
