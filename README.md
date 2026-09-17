# CodeCraftHub

CodeCraftHub is a beginner-friendly REST API for tracking personal learning goals and developer courses. It is built with Node.js and Express and stores course data in a local `courses.json` file, so no database is required.

## Features

- Create a new course
- Retrieve all courses
- Retrieve a course by ID
- Update an existing course
- Delete a course
- Automatically generate numeric course IDs starting from `1`
- Automatically add a creation timestamp
- Validate required fields
- Validate target dates in `YYYY-MM-DD` format
- Support the following course statuses:
  - `Not Started`
  - `In Progress`
  - `Completed`
- Automatically create `courses.json` if it does not exist
- Return helpful HTTP error responses

## Technologies

- Node.js
- Express
- JSON file storage

## Project structure

```text
codecrafthub/
├── app.js
├── package.json
├── courses.json       # Created automatically
└── README.md
```

## Course format

Each course contains the following fields:

|
 Field 
|
 Type 
|
 Description 
|
|
---
|
---
|
---
|
|
`id`
|
 Number 
|
 Automatically generated unique ID 
|
|
`name`
|
 String 
|
 Course name 
|
|
`description`
|
 String 
|
 Course description 
|
|
`target_date`
|
 String 
|
 Target completion date in 
`YYYY-MM-DD`
 format 
|
|
`status`
|
 String 
|
`Not Started`
, 
`In Progress`
, or 
`Completed`
|
|
`created_at`
|
 String 
|
 Automatically generated ISO timestamp 
|

Example:

```json
{
  "id": 1,
  "name": "Node.js Fundamentals",
  "description": "Learn Node.js and Express REST APIs.",
  "target_date": "2026-12-31",
  "status": "Not Started",
  "created_at": "2026-09-17T12:30:00.000Z"
}
```

## Installation

### Prerequisites

Install a current version of [Node.js](https://nodejs.org/). Node.js includes npm.

Confirm that both are installed:

```bash
node --version
npm --version
```

### Set up the project

1. Clone or download the project.

2. Open a terminal in the project directory:

   ```bash
   cd codecrafthub
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

The application will create `courses.json` automatically when it starts if the file does not already exist.

## Running the application

Start the server with:

```bash
npm start
```

Alternatively, run the application directly:

```bash
node app.js
```

The API will be available at:

```text
http://localhost:5000
```

Stop the server by pressing `Ctrl+C`.

## API endpoints

The API accepts and returns JSON.

|
 Method 
|
 Endpoint 
|
 Description 
|
|
---
|
---
|
---
|
|
`POST`
|
`/api/courses`
|
 Create a course 
|
|
`GET`
|
`/api/courses`
|
 Retrieve all courses 
|
|
`GET`
|
`/api/courses/:id`
|
 Retrieve a course by ID 
|
|
`PUT`
|
`/api/courses/:id`
|
 Update a course 
|
|
`DELETE`
|
`/api/courses/:id`
|
 Delete a course 
|

Replace `:id` with a course ID, such as `1`.

---

### Create a course

```http
POST /api/courses
```

All four user-supplied fields are required.

#### Example request

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Node.js Fundamentals",
    "description": "Learn Node.js and Express REST APIs.",
    "target_date": "2026-12-31",
    "status": "Not Started"
  }'
```

#### Successful response

Status: `201 Created`

```json
{
  "id": 1,
  "name": "Node.js Fundamentals",
  "description": "Learn Node.js and Express REST APIs.",
  "target_date": "2026-12-31",
  "status": "Not Started",
  "created_at": "2026-09-17T12:30:00.000Z"
}
```

#### Missing-field response

Status: `400 Bad Request`

```json
{
  "message": "Course validation failed.",
  "errors": [
    "Missing required fields: description, target_date."
  ]
}
```

#### Invalid-status response

Status: `400 Bad Request`

```json
{
  "message": "Course validation failed.",
  "errors": [
    "Invalid status. Status must be one of: Not Started, In Progress, Completed."
  ]
}
```

---

### Retrieve all courses

```http
GET /api/courses
```

#### Example request

```bash
curl http://localhost:5000/api/courses
```

#### Successful response

Status: `200 OK`

```json
[
  {
    "id": 1,
    "name": "Node.js Fundamentals",
    "description": "Learn Node.js and Express REST APIs.",
    "target_date": "2026-12-31",
    "status": "Not Started",
    "created_at": "2026-09-17T12:30:00.000Z"
  }
]
```

If there are no courses, the API returns:

```json
[]
```

---

### Retrieve a specific course

```http
GET /api/courses/:id
```

#### Example request

```bash
curl http://localhost:5000/api/courses/1
```

#### Successful response

Status: `200 OK`

```json
{
  "id": 1,
  "name": "Node.js Fundamentals",
  "description": "Learn Node.js and Express REST APIs.",
  "target_date": "2026-12-31",
  "status": "Not Started",
  "created_at": "2026-09-17T12:30:00.000Z"
}
```

#### Course-not-found response

Status: `404 Not Found`

```json
{
  "message": "Course with ID 1 was not found."
}
```

---

### Update a course

```http
PUT /api/courses/:id
```

`PUT` replaces the editable course fields, so `name`, `description`, `target_date`, and `status` are all required. The original `id` and `created_at` values are preserved.

#### Example request

```bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Node.js Fundamentals",
    "description": "Learn Node.js, Express, and REST API development.",
    "target_date": "2026-12-31",
    "status": "In Progress"
  }'
```

#### Successful response

Status: `200 OK`

```json
{
  "id": 1,
  "name": "Node.js Fundamentals",
  "description": "Learn Node.js, Express, and REST API development.",
  "target_date": "2026-12-31",
  "status": "In Progress",
  "created_at": "2026-09-17T12:30:00.000Z"
}
```

---

### Delete a course

```http
DELETE /api/courses/:id
```

#### Example request

```bash
curl -X DELETE http://localhost:5000/api/courses/1
```

#### Successful response

Status: `200 OK`

```json
{
  "message": "Course deleted successfully.",
  "course": {
    "id": 1,
    "name": "Node.js Fundamentals",
    "description": "Learn Node.js, Express, and REST API development.",
    "target_date": "2026-12-31",
    "status": "In Progress",
    "created_at": "2026-09-17T12:30:00.000Z"
  }
}
```

## HTTP status codes

|
 Status 
|
 Meaning 
|
|
---
|
---
|
|
`200 OK`
|
 A course was retrieved, updated, or deleted 
|
|
`201 Created`
|
 A course was created 
|
|
`400 Bad Request`
|
 The request contains missing or invalid data 
|
|
`404 Not Found`
|
 The course or endpoint does not exist 
|
|
`500 Internal Server Error`
|
 A file operation or unexpected server error occurred 
|

## Data storage

Courses are stored as a JSON array in `courses.json`:

```json
[
  {
    "id": 1,
    "name": "Node.js Fundamentals",
    "description": "Learn Node.js and Express REST APIs.",
    "target_date": "2026-12-31",
    "status": "Not Started",
    "created_at": "2026-09-17T12:30:00.000Z"
  }
]
```

The entire file is read when courses are requested and rewritten when a course is created, updated, or deleted. This approach is suitable for learning and small personal projects, but it is not intended for a production system with many simultaneous users.

## Troubleshooting

### `Cannot find module 'express'`

Install the project dependencies:

```bash
npm install
```

If necessary, install Express directly:

```bash
npm install express
```

### `courses.json` was not created

Make sure the application directory is writable and start the server again:

```bash
npm start
```

The application creates `courses.json` in the same directory as `app.js`.

You can also create it manually with this content:

```json
[]
```

### File read error or invalid JSON

Make sure `courses.json` contains valid JSON and that its top-level value is an array.

Valid empty file content:

```json
[]
```

Common JSON errors include:

- Missing commas
- Extra trailing commas
- Using single quotes instead of double quotes
- Missing closing braces or brackets

If the existing data is not needed, replace the file contents with `[]` and restart the application.

### Port 5000 is already in use

An error such as `EADDRINUSE` means another application is using port `5000`.

Stop the other application, or locate the process using the port.

On macOS or Linux:

```bash
lsof -i :5000
```

On Windows:

```powershell
netstat -ano | findstr :5000
```

Then stop the process and run CodeCraftHub again.

### Request body is undefined or rejected

Ensure the request includes the JSON content type:

```text
Content-Type: application/json
```

Also make sure the body contains valid JSON with all required fields.

### Invalid target date

Use the `YYYY-MM-DD` format:

```json
{
  "target_date": "2026-12-31"
}
```

Values such as `12/31/2026`, `31-12-2026`, and impossible calendar dates are rejected.

### Invalid status

Status values are case-sensitive and must exactly match one of these:

```text
Not Started
In Progress
Completed
```

For example, `"in progress"` is not accepted, but `"In Progress"` is accepted.

### Course not found

Confirm that:

- The course ID exists in `courses.json`.
- The endpoint contains a positive numeric ID.
- You are using a URL such as `/api/courses/1`.

## License

This project is intended for learning and personal use.