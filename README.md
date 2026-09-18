# CodeCraftHub

CodeCraftHub is a simple REST API for tracking personal learning goals and courses. It is built with Node.js and Express and stores course data in a local JSON file instead of a database.

This project is designed for developers learning REST API basics, including creating, reading, updating, and deleting data.

---

## Project Overview

With CodeCraftHub, you can track courses you want to learn and update their progress over time.

Each course includes:

- `id` — Auto-generated numeric course ID
- `name` — Course name
- `description` — Short description of the course
- `target_date` — Desired completion date in `YYYY-MM-DD` format
- `status` — Learning progress status
- `created_at` — Auto-generated creation timestamp

Allowed course statuses:

- `Not Started`
- `In Progress`
- `Completed`

Course data is stored in a local file named `courses.json`. The file is created automatically when the application starts if it does not already exist.

---

## Features

- Create a new learning course
- Retrieve all courses
- Retrieve one course by ID
- Update an existing course
- Delete a course
- Automatically generate course IDs starting from `1`
- Automatically create `courses.json` if it does not exist
- Validate required request fields
- Validate target completion dates
- Validate course status values
- Handle course-not-found errors
- Handle JSON file read/write errors
- No database, authentication, or user management required

---

## Project Structure

```text
codecrafthub/
├── app.js
├── package.json
├── courses.json
└── README.md