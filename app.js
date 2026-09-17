// app.js

// Import the packages and built-in Node.js modules we need.
const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");

// Create the Express application.
const app = express();

// The server must run on port 5000.
const PORT = 5000;

// Store courses.json in the same directory as app.js.
const COURSES_FILE = path.join(__dirname, "courses.json");

// These are the only allowed course status values.
const VALID_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed"
];

// Parse incoming JSON request bodies.
// Without this middleware, req.body would be undefined.
app.use(express.json());

/*
 * Create courses.json if it does not already exist.
 *
 * The file starts with an empty JSON array because courses
 * will be stored as an array of objects.
 */
async function ensureCoursesFileExists() {
  try {
    await fs.access(COURSES_FILE);
  } catch (error) {
    if (error.code === "ENOENT") {
      try {
        await fs.writeFile(COURSES_FILE, "[]", "utf8");
        console.log("Created courses.json");
      } catch (writeError) {
        throw new Error(
          `Could not create courses.json: ${writeError.message}`
        );
      }
    } else {
      throw new Error(
        `Could not access courses.json: ${error.message}`
      );
    }
  }
}

/*
 * Read all courses from courses.json.
 *
 * JSON.parse() converts the JSON text into a JavaScript array.
 */
async function readCourses() {
  try {
    const fileContents = await fs.readFile(COURSES_FILE, "utf8");

    // Treat an accidentally empty file as an empty course list.
    if (!fileContents.trim()) {
      return [];
    }

    const courses = JSON.parse(fileContents);

    // Ensure that courses.json contains the expected array format.
    if (!Array.isArray(courses)) {
      throw new Error("courses.json must contain a JSON array.");
    }

    return courses;
  } catch (error) {
    // Add context while preserving the original error.
    const fileError = new Error(
      `Unable to read courses.json: ${error.message}`
    );

    fileError.code = "FILE_READ_ERROR";
    throw fileError;
  }
}

/*
 * Save all courses to courses.json.
 *
 * JSON.stringify(courses, null, 2) converts the array into
 * formatted JSON text with two-space indentation.
 */
async function writeCourses(courses) {
  try {
    await fs.writeFile(
      COURSES_FILE,
      JSON.stringify(courses, null, 2),
      "utf8"
    );
  } catch (error) {
    const fileError = new Error(
      `Unable to write courses.json: ${error.message}`
    );

    fileError.code = "FILE_WRITE_ERROR";
    throw fileError;
  }
}

/*
 * Check that a date:
 *
 * 1. Uses the YYYY-MM-DD format.
 * 2. Represents a real calendar date.
 *
 * For example, 2026-12-31 is valid, but 2026-02-30 is not.
 */
function isValidDate(dateString) {
  if (
    typeof dateString !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    return false;
  }

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/*
 * Validate data supplied when creating or replacing a course.
 *
 * POST and PUT both require all four user-supplied fields.
 */
function validateCourse(course) {
  const errors = [];
  const requiredFields = [
    "name",
    "description",
    "target_date",
    "status"
  ];

  const missingFields = requiredFields.filter(field => {
    const value = course[field];

    return (
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim())
    );
  });

  if (missingFields.length > 0) {
    errors.push(
      `Missing required fields: ${missingFields.join(", ")}.`
    );
  }

  // Validate each field only when it was provided. This prevents
  // duplicate messages for fields that are already reported missing.
  if (
    course.name !== undefined &&
    (typeof course.name !== "string" || !course.name.trim())
  ) {
    errors.push("name must be a non-empty string.");
  }

  if (
    course.description !== undefined &&
    (typeof course.description !== "string" ||
      !course.description.trim())
  ) {
    errors.push("description must be a non-empty string.");
  }

  if (
    course.target_date !== undefined &&
    !isValidDate(course.target_date)
  ) {
    errors.push(
      "target_date must be a valid date in YYYY-MM-DD format."
    );
  }

  if (
    course.status !== undefined &&
    !VALID_STATUSES.includes(course.status)
  ) {
    errors.push(
      `Invalid status. Status must be one of: ${VALID_STATUSES.join(
        ", "
      )}.`
    );
  }

  return errors;
}

/*
 * Validate and convert an ID route parameter into a number.
 */
function parseCourseId(value) {
  // Number("1") produces 1. Number("abc") produces NaN.
  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    return null;
  }

  return id;
}

/*
 * POST /api/courses
 *
 * Add a new course.
 */
app.post("/api/courses", async (req, res, next) => {
  try {
    const errors = validateCourse(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Course validation failed.",
        errors
      });
    }

    const courses = await readCourses();

    /*
     * Find the highest existing ID and add one.
     * If the array is empty, Math.max() returns 0 because
     * zero is included as the first argument.
     */
    const highestId = Math.max(
      0,
      ...courses.map(course => course.id)
    );

    const newCourse = {
      id: highestId + 1,
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      target_date: req.body.target_date,
      status: req.body.status,
      created_at: new Date().toISOString()
    };

    courses.push(newCourse);
    await writeCourses(courses);

    // 201 means that a new resource was successfully created.
    return res.status(201).json(newCourse);
  } catch (error) {
    next(error);
  }
});

/*
 * GET /api/courses
 *
 * Return all courses.
 */
app.get("/api/courses", async (req, res, next) => {
  try {
    const courses = await readCourses();

    return res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
});

/*
 * GET /api/courses/stats
 *
 * Return the total number of courses and the number of courses
 * in each status category.
 *
 * Important: This route must be defined before /api/courses/:id.
 */
app.get("/api/courses/stats", async (req, res, next) => {
  try {
    const courses = await readCourses();

    const byStatus = {
      "Not Started": 0,
      "In Progress": 0,
      "Completed": 0
    };

    // Count each course according to its current status.
    for (const course of courses) {
      if (Object.hasOwn(byStatus, course.status)) {
        byStatus[course.status]++;
      }
    }

    return res.status(200).json({
      total: courses.length,
      by_status: byStatus
    });
  } catch (error) {
    // Pass file read errors to the central error handler.
    next(error);
  }
});

/*
 * GET /api/courses/:id
 *
 * Return one specific course.
 *
 * Example:
 * GET /api/courses/1
 */
app.get("/api/courses/:id", async (req, res, next) => {
  try {
    const courseId = parseCourseId(req.params.id);

    if (courseId === null) {
      return res.status(400).json({
        message: "Course ID must be a positive integer."
      });
    }

    const courses = await readCourses();

    const course = courses.find(
      item => item.id === courseId
    );

    if (!course) {
      return res.status(404).json({
        message: `Course with ID ${courseId} was not found.`
      });
    }

    return res.status(200).json(course);
  } catch (error) {
    next(error);
  }
});

/*
 * PUT /api/courses/:id
 *
 * Replace the editable fields of an existing course.
 * All required fields must be supplied.
 *
 * The original id and created_at values are preserved.
 *
 * Example:
 * PUT /api/courses/1
 */
app.put("/api/courses/:id", async (req, res, next) => {
  try {
    const courseId = parseCourseId(req.params.id);

    if (courseId === null) {
      return res.status(400).json({
        message: "Course ID must be a positive integer."
      });
    }

    const errors = validateCourse(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Course validation failed.",
        errors
      });
    }

    const courses = await readCourses();

    const courseIndex = courses.findIndex(
      item => item.id === courseId
    );

    if (courseIndex === -1) {
      return res.status(404).json({
        message: `Course with ID ${courseId} was not found.`
      });
    }

    const updatedCourse = {
      id: courses[courseIndex].id,
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      target_date: req.body.target_date,
      status: req.body.status,
      created_at: courses[courseIndex].created_at
    };

    courses[courseIndex] = updatedCourse;
    await writeCourses(courses);

    return res.status(200).json(updatedCourse);
  } catch (error) {
    next(error);
  }
});

/*
 * DELETE /api/courses/:id
 *
 * Delete a specific course.
 *
 * Example:
 * DELETE /api/courses/1
 */
app.delete("/api/courses/:id", async (req, res, next) => {
  try {
    const courseId = parseCourseId(req.params.id);

    if (courseId === null) {
      return res.status(400).json({
        message: "Course ID must be a positive integer."
      });
    }

    const courses = await readCourses();

    const courseIndex = courses.findIndex(
      item => item.id === courseId
    );

    if (courseIndex === -1) {
      return res.status(404).json({
        message: `Course with ID ${courseId} was not found.`
      });
    }

    // Remove one item at courseIndex.
    const [deletedCourse] = courses.splice(courseIndex, 1);

    await writeCourses(courses);

    return res.status(200).json({
      message: "Course deleted successfully.",
      course: deletedCourse
    });
  } catch (error) {
    next(error);
  }
});

/*
 * Handle endpoints that do not exist.
 *
 * This middleware must appear after all valid routes.
 */
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} was not found.`
  });
});

/*
 * Central Express error handler.
 *
 * Error-handling middleware has four parameters. It must appear
 * after routes and other middleware.
 */
app.use((error, req, res, next) => {
  console.error(error);

  // Express/body-parser creates this error for malformed JSON.
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      message: "The request body contains invalid JSON."
    });
  }

  if (
    error.code === "FILE_READ_ERROR" ||
    error.code === "FILE_WRITE_ERROR"
  ) {
    return res.status(500).json({
      message: "A course data file error occurred.",
      error: error.message
    });
  }

  return res.status(500).json({
    message: "An unexpected server error occurred."
  });
});

/*
 * Create courses.json before accepting requests.
 *
 * If the file cannot be created or accessed, the application logs
 * the error and does not start because course storage is unavailable.
 */
async function startServer() {
  try {
    await ensureCoursesFileExists();

    app.listen(PORT, () => {
      console.log(
        `CodeCraftHub API is running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
}

startServer();