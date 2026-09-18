// app.js

const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = 5000;

// Path to courses.json in the same folder as app.js
const coursesFilePath = path.join(__dirname, "courses.json");

// Valid course statuses
const VALID_STATUSES = ["Not Started", "In Progress", "Completed"];

// Allows Express to read JSON request bodies
app.use(express.json());

/*
  Custom error class.

  This lets us attach an HTTP status code to errors.
  Example:
  throw new AppError("Course not found", 404);
*/
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

/*
  Wrapper for async route handlers.

  It sends errors from async functions to the error-handling middleware
  at the bottom of this file.
*/
function asyncHandler(callback) {
  return (req, res, next) => {
    Promise.resolve(callback(req, res, next)).catch(next);
  };
}

/*
  Create courses.json automatically if it does not exist.

  The initial file contains an empty array because all courses
  will be stored in an array.
*/
async function ensureCoursesFileExists() {
  try {
    await fs.access(coursesFilePath);
  } catch (error) {
    // ENOENT means the file does not exist
    if (error.code === "ENOENT") {
      try {
        await fs.writeFile(coursesFilePath, "[]", "utf8");
        console.log("courses.json created successfully.");
      } catch (writeError) {
        throw new AppError(
          "Unable to create courses.json. Check file permissions.",
          500
        );
      }
    } else {
      throw new AppError(
        "Unable to access courses.json. Check file permissions.",
        500
      );
    }
  }
}

/*
  Read courses from courses.json.

  JSON.parse converts JSON text into a JavaScript array.
*/
async function readCourses() {
  try {
    const data = await fs.readFile(coursesFilePath, "utf8");
    const courses = JSON.parse(data);

    // Make sure the JSON file contains an array
    if (!Array.isArray(courses)) {
      throw new AppError(
        "courses.json has an invalid format. It must contain an array.",
        500
      );
    }

    return courses;
  } catch (error) {
    // Preserve custom errors
    if (error instanceof AppError) {
      throw error;
    }

    // Handle invalid/corrupted JSON
    if (error instanceof SyntaxError) {
      throw new AppError(
        "courses.json contains invalid JSON data.",
        500
      );
    }

    throw new AppError(
      "Unable to read courses.json. Check that the file exists and is readable.",
      500
    );
  }
}

/*
  Save the full courses array back into courses.json.

  JSON.stringify(..., null, 2) formats the JSON with indentation,
  making it easier for humans to read.
*/
async function writeCourses(courses) {
  try {
    await fs.writeFile(
      coursesFilePath,
      JSON.stringify(courses, null, 2),
      "utf8"
    );
  } catch (error) {
    throw new AppError(
      "Unable to save courses to courses.json. Check file permissions.",
      500
    );
  }
}

/*
  Check that target_date follows YYYY-MM-DD format
  and represents a real calendar date.
*/
function isValidDate(dateString) {
  // First, require the exact YYYY-MM-DD format
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(dateString)) {
    return false;
  }

  // Then verify that it is a real date, such as rejecting 2026-02-30
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/*
  Validate the fields required when creating or fully updating a course.
*/
function validateCourseInput(body) {
  const { name, description, target_date, status } = body;

  // Check required fields
  if (!name || !description || !target_date || !status) {
    throw new AppError(
      "Missing required fields. name, description, target_date, and status are required.",
      400
    );
  }

  // Ensure name and description are text values
  if (typeof name !== "string" || typeof description !== "string") {
    throw new AppError("name and description must be text values.", 400);
  }

  // Do not allow empty strings such as "   "
  if (name.trim() === "" || description.trim() === "") {
    throw new AppError("name and description cannot be empty.", 400);
  }

  // Validate target date
  if (typeof target_date !== "string" || !isValidDate(target_date)) {
    throw new AppError(
      "target_date must be a valid date in YYYY-MM-DD format.",
      400
    );
  }

  // Validate course status
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(
      `Invalid status. Status must be one of: ${VALID_STATUSES.join(", ")}.`,
      400
    );
  }
}

/*
  Convert and validate a course ID from the URL.

  Example:
  /api/courses/3 -> id = 3
*/
function getCourseId(idParam) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id < 1) {
    throw new AppError("Course ID must be a positive whole number.", 400);
  }

  return id;
}

/*
  Generate the next course ID.

  If no courses exist, the first course gets ID 1.
  Otherwise, the next ID is the highest current ID plus 1.
*/
function getNextCourseId(courses) {
  if (courses.length === 0) {
    return 1;
  }

  const highestId = Math.max(...courses.map((course) => course.id));
  return highestId + 1;
}

/*
  GET /api/courses

  Get every course from courses.json.
*/
app.get(
  "/api/courses",
  asyncHandler(async (req, res) => {
    const courses = await readCourses();

    res.status(200).json({
      count: courses.length,
      courses
    });
  })
);

/*
  GET /api/courses/:id

  Get one specific course by ID.

  Example:
  GET /api/courses/1
*/
app.get(
  "/api/courses/:id",
  asyncHandler(async (req, res) => {
    const courseId = getCourseId(req.params.id);
    const courses = await readCourses();

    const course = courses.find((item) => item.id === courseId);

    if (!course) {
      throw new AppError("Course not found.", 404);
    }

    res.status(200).json(course);
  })
);

/*
  POST /api/courses

  Add a new course.

  Required JSON request body example:

  {
    "name": "Node.js Fundamentals",
    "description": "Learn Node.js and Express basics.",
    "target_date": "2026-12-01",
    "status": "Not Started"
  }
*/
app.post(
  "/api/courses",
  asyncHandler(async (req, res) => {
    validateCourseInput(req.body);

    const { name, description, target_date, status } = req.body;
    const courses = await readCourses();

    const newCourse = {
      id: getNextCourseId(courses),
      name: name.trim(),
      description: description.trim(),
      target_date,
      status,
      created_at: new Date().toISOString()
    };

    courses.push(newCourse);

    await writeCourses(courses);

    res.status(201).json({
      message: "Course created successfully.",
      course: newCourse
    });
  })
);

/*
  PUT /api/courses/:id

  Replace/update an existing course.

  All required fields must be included in the request body.
  The original id and created_at values are preserved.
*/
app.put(
  "/api/courses/:id",
  asyncHandler(async (req, res) => {
    const courseId = getCourseId(req.params.id);

    validateCourseInput(req.body);

    const { name, description, target_date, status } = req.body;
    const courses = await readCourses();

    const courseIndex = courses.findIndex(
      (course) => course.id === courseId
    );

    if (courseIndex === -1) {
      throw new AppError("Course not found.", 404);
    }

    const updatedCourse = {
      id: courseId,
      name: name.trim(),
      description: description.trim(),
      target_date,
      status,
      created_at: courses[courseIndex].created_at
    };

    courses[courseIndex] = updatedCourse;

    await writeCourses(courses);

    res.status(200).json({
      message: "Course updated successfully.",
      course: updatedCourse
    });
  })
);

/*
  DELETE /api/courses/:id

  Delete a course by ID.

  Example:
  DELETE /api/courses/1
*/
app.delete(
  "/api/courses/:id",
  asyncHandler(async (req, res) => {
    const courseId = getCourseId(req.params.id);
    const courses = await readCourses();

    const courseIndex = courses.findIndex(
      (course) => course.id === courseId
    );

    if (courseIndex === -1) {
      throw new AppError("Course not found.", 404);
    }

    // Remove one item from the array at courseIndex
    const deletedCourse = courses.splice(courseIndex, 1)[0];

    await writeCourses(courses);

    res.status(200).json({
      message: "Course deleted successfully.",
      deleted_course: deletedCourse
    });
  })
);

/*
  Handle requests to endpoints that do not exist.
*/
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found."
  });
});

/*
  Central error-handling middleware.

  Any errors from route handlers are sent here.
*/
app.use((error, req, res, next) => {
  console.error("Error:", error.message);

  res.status(error.statusCode || 500).json({
    message: error.message || "An unexpected server error occurred."
  });
});

/*
  Create courses.json first, then start the server.
*/
ensureCoursesFileExists()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CodeCraftHub API is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  });