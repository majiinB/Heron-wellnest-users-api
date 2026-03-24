import express from "express";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { heronAuthMiddleware } from "../middlewares/heronAuth.middleware..js";
import { CounselorRepository } from "../repository/counselor.repository.js";
import { StudentRepository } from "../repository/student.repository.js";
import { UserManagementService } from "../services/userManagement.service.js";
import { UserManagementController } from "../controllers/userManagement.controller.js";

const router = express.Router();

const counselorRepository = new CounselorRepository();
const studentRepository = new StudentRepository();
const userManagementService = new UserManagementService(counselorRepository, studentRepository);
const userManagementController = new UserManagementController(userManagementService);

router.get(
	"/counselors",
	heronAuthMiddleware,
	asyncHandler(userManagementController.handleFetchPaginatedCounselors.bind(userManagementController)),
);

/**
 * @openapi
 * /management/students:
 *   get:
 *     summary: Fetch all students for user management
 *     description: |
 *       Retrieves a paginated list of students for admin user management.
 *
 *       **Authorization Requirements:**
 *       - **Admins/Super Admins**: Allowed
 *       - **Counselors/Students**: Forbidden
 *
 *       **Pagination:**
 *       - Uses cursor-based pagination with `limit` and `cursor`
 *       - `nextCursor` contains the `user_id` of the last student in the current page
 *     tags:
 *       - User Management
 *       - Students
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of student records to return
 *         example: 10
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student user_id of the last item from the previous page
 *         example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *     responses:
 *       "200":
 *         description: Students fetched successfully
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
 *                   example: Students fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                             example: c81daef9-bc32-4624-a595-3cdb0f66d559
 *                           user_name:
 *                             type: string
 *                             example: John Doe
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: johndoe@umak.edu.ph
 *                           is_deleted:
 *                             type: boolean
 *                             example: false
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-02-14T08:30:00.000Z
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-10-20T14:45:00.000Z
 *                           finished_onboarding:
 *                             type: boolean
 *                             example: true
 *                           program_id:
 *                             type: string
 *                             format: uuid
 *                             example: 8c3b6d9a-4321-8765-09ba-fedc87654321
 *                           cor_school_year:
 *                             type: string
 *                             example: 2025-2026
 *                           year_level:
 *                             type: string
 *                             example: 3
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *                     nextCursor:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                       example: 7b9d5f8c-1234-5678-90ab-cdef12345678
 *             examples:
 *               successResponse:
 *                 value:
 *                   success: true
 *                   code: FETCHED_SUCCESSFULLY
 *                   message: Students fetched successfully.
 *                   data:
 *                     students:
 *                       - user_id: c81daef9-bc32-4624-a595-3cdb0f66d559
 *                         user_name: John Doe
 *                         email: johndoe@umak.edu.ph
 *                         is_deleted: false
 *                         created_at: 2025-02-14T08:30:00.000Z
 *                         updated_at: 2025-10-20T14:45:00.000Z
 *                         finished_onboarding: true
 *                         program_id: 8c3b6d9a-4321-8765-09ba-fedc87654321
 *                         cor_school_year: 2025-2026
 *                         year_level: "3"
 *                     hasMore: true
 *                     nextCursor: 7b9d5f8c-1234-5678-90ab-cdef12345678
 *       "400":
 *         description: Bad request - invalid query parameters or missing user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: string
 *                 message:
 *                   type: string
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: string
 *                 message:
 *                   type: string
 *       "403":
 *         description: Forbidden - only admins can access this resource
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: string
 *                 message:
 *                   type: string
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.get(
	"/students",
	heronAuthMiddleware,
	asyncHandler(userManagementController.handleFetchPaginatedStudents.bind(userManagementController)),
);

export default router;
