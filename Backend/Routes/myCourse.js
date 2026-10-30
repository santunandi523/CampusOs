const express = require("express");
const Course = require("../Models/Course.js");
const User = require("../Models/User.js");
const authMiddleware = require("../Middleware/authMiddleware.js");

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// IMPORTANT: All static string routes MUST come before /:courseId
// otherwise Express treats "createdCourses", "my-courses" etc.
// as the :courseId param and never reaches them.
// ─────────────────────────────────────────────────────────────

// POST /api/course — create course + push to user.createdCourses
router.post("/", authMiddleware, async (req, res) => {
  try {
    const course = await Course.create({
      title: req.body.title,
      description: req.body.description,
      subjectTag: req.body.subjectTag,
      backgroundColor: req.body.backgroundColor,
      instructor: req.user,
    });

    await User.findByIdAndUpdate(req.user, {
      $addToSet: { createdCourses: course._id },
    });

    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/course — all courses
router.get("/", authMiddleware, async (req, res) => {
  try {
    const courses = await Course.find({});
    res.status(200).json(courses);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/course/createdCourses — courses made by this teacher
router.get("/createdCourses", authMiddleware, async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user });
    res.status(200).json(courses);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/course/my-courses — enrolled courses for student
router.get("/my-courses", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user).populate("enrolledCourses").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const progressArray = (user.courseProgress || []).map((c) => ({
      courseId: c.courseId.toString(),
      progress: c.progress,
    }));

    res.status(200).json({
      success: true,
      count: user.enrolledCourses.length,
      courses: user.enrolledCourses,
      progress: progressArray,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching your courses" });
  }
});

// POST /api/course/enroll
router.post("/enroll", authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: "Course ID is required" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const updatedUser = await User.findByIdAndUpdate(
      req.user,
      {
        $addToSet: { enrolledCourses: courseId },
        $push: { courseProgress: { courseId, progress: 0, completedLessons: [] } },
      },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    // ── Add student to instructor's students array ──────────
    await User.findByIdAndUpdate(course.instructor, {
      $push: {
        students: {
          studentId: req.user,
          name: updatedUser.name,
          courseId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Enrolled successfully",
      enrolledCourses: updatedUser.enrolledCourses,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during enrollment" });
  }
});

// POST /api/course/complete-lesson
router.post("/complete-lesson", authMiddleware, async (req, res) => {
  try {
    const { courseId, lessonId, progress } = req.body;
    const updated = await User.findOneAndUpdate(
      { _id: req.user, "courseProgress.courseId": courseId },
      {
        $addToSet: { "courseProgress.$.completedLessons": lessonId },
        $set: { "courseProgress.$.progress": progress },
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Progress not found" });
    res.status(200).json({ success: true, message: "Lesson marked complete" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/course/remove-lesson
router.post("/remove-lesson", authMiddleware, async (req, res) => {
  try {
    const { courseId, lessonId, progress } = req.body;
    const updated = await User.findOneAndUpdate(
      { _id: req.user, "courseProgress.courseId": courseId },
      {
        $pull: { "courseProgress.$.completedLessons": lessonId },
        $set: { "courseProgress.$.progress": progress },
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Progress not found" });
    res.status(200).json({ success: true, message: "Lesson marked in-progress" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// GET /api/course/progress/:courseId — completed lesson IDs
router.get("/progress/:courseId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const progress = user.courseProgress.find(
      (c) => c.courseId.toString() === req.params.courseId
    );
    res.status(200).json((progress?.completedLessons || []).map(String));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/course/my-progress/:courseId — progress percentage
router.get("/my-progress/:courseId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: "User not found" });
    const progress = user.courseProgress.find(
      (c) => c.courseId.toString() === req.params.courseId
    );
    res.status(200).json({ progress: progress ? progress.progress : 0 });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching progress" });
  }
});

// GET /api/course/:courseId — single course (used by CoursePage)
router.get("/:courseId", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/course/:courseId — save from CourseEditor
router.put("/:courseId", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { title, description, subjectTag, backgroundColor, units } = req.body;

    // findByIdAndUpdate with runValidators:false avoids Mongoose re-validating
    // every deeply nested subdocument on save — the editor sanitises the data
    const updated = await Course.findByIdAndUpdate(
      req.params.courseId,
      {
        $set: {
          ...(title !== undefined       && { title }),
          ...(description !== undefined && { description }),
          ...(subjectTag !== undefined  && { subjectTag }),
          ...(backgroundColor !== undefined && { backgroundColor }),
          ...(units !== undefined       && { units }),
        },
      },
      { new: true, runValidators: false }
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error("PUT /course error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;