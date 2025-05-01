const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignDepartmentHead,  // Add this
  getDepartmentHead     // Add this
} = require('../controllers/departmentController');

// Department routes
router.route('/')
  .get(getAllDepartments)
  .post(protect, authorize('admin'), createDepartment);

router.route('/:id')
  .get(getDepartmentById)
  .put(protect, authorize('admin'), updateDepartment)
  .delete(protect, authorize('admin'), deleteDepartment);

// Department head management routes
router.route('/:id/head')
  .get(getDepartmentHead)
  .put(protect, authorize('admin'), assignDepartmentHead);

module.exports = router;
