import express from "express";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { heronAuthMiddleware, heronAuthMiddlewareAll } from "../middlewares/heronAuth.middleware..js";
import { CollegeDepartmentRepository } from "../repository/collegeDepartment.repository.js";
import { CollegeDepartmentService } from "../services/collegeDepartment.service.js";
import { CollegeDepartmentController } from "../controllers/collegeDepartment.controller.js";

const router = express.Router();

const collegeDepartmentRepository = new CollegeDepartmentRepository();
const collegeDepartmentService = new CollegeDepartmentService(collegeDepartmentRepository);
const collegeDepartmentController = new CollegeDepartmentController(collegeDepartmentService);

/**
 * @openapi
 * /management/departments:
 *   get:
 *     summary: Fetch all college departments
 *     description: |
 *       Retrieves a list of all active college departments.
 *
 *       **Authorization Requirements:**
 *       - Requires valid authentication token
 *
 *       **Data Includes:**
 *       - department_id: Unique identifier for department
 *       - department_name: Name of the department
 *       - is_deleted: Whether the department is deleted
 *       - created_at: When the department was created
 *       - updated_at: When the department was last updated
 *     tags:
 *       - College Departments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: College departments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: FETCHED_SUCCESSFULLY
 *                 message:
 *                   type: string
 *                   example: College departments fetched successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       department_id:
 *                         type: string
 *                         format: uuid
 *                         example: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                       department_name:
 *                         type: string
 *                         example: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                       is_deleted:
 *                         type: boolean
 *                         example: false
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-01-15T08:30:00.000Z
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-10-20T14:45:00.000Z
 *             examples:
 *               successResponse:
 *                 value:
 *                   success: true
 *                   code: FETCHED_SUCCESSFULLY
 *                   message: College departments fetched successfully.
 *                   data:
 *                     - department_id: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                       department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                       is_deleted: false
 *                       created_at: 2025-01-15T08:30:00.000Z
 *                       updated_at: 2025-10-20T14:45:00.000Z
 *                     - department_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *                       department_name: COLLEGE OF ENGINEERING
 *                       is_deleted: false
 *                       created_at: 2025-02-10T09:15:00.000Z
 *                       updated_at: 2025-10-21T16:30:00.000Z
 *                     - department_id: f1e2d3c4-b5a6-7890-abcd-ef1234567890
 *                       department_name: COLLEGE OF BUSINESS ADMINISTRATION
 *                       is_deleted: false
 *                       created_at: 2025-03-05T10:45:00.000Z
 *                       updated_at: 2025-10-22T11:20:00.000Z
 *       "400":
 *         description: Bad request - missing required information
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "500":
 *         description: Internal server error
 */
router.get(
  "/departments",
  heronAuthMiddlewareAll,
  asyncHandler(collegeDepartmentController.handleFetchAllDepartments.bind(collegeDepartmentController)),
);

export default router;
