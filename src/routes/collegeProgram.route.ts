import express from "express";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { heronAuthMiddleware, heronAuthMiddlewareAll } from "../middlewares/heronAuth.middleware..js";
import { CollegeProgramRepository } from "../repository/collegeProgram.repository.js";
import { CollegeProgramService } from "../services/collegeProgram.service.js";
import { CollegeProgramController } from "../controllers/collegeProgram.controller.js";

const router = express.Router();

const collegeProgramRepository = new CollegeProgramRepository();
const collegeProgramService = new CollegeProgramService(collegeProgramRepository);
const collegeProgramController = new CollegeProgramController(collegeProgramService);

/**
 * @openapi
 * /management/programs:
 *   get:
 *     summary: Fetch all college programs
 *     description: |
 *       Retrieves a list of all active college programs.
 *
 *       **Authorization Requirements:**
 *       - Requires valid authentication token
 *
 *       **Data Includes:**
 *       - program_id: Unique identifier for program
 *       - program_name: Name of the program
 *       - college_department_id: Department ID the program belongs to
 *       - department_name: Name of the department
 *     tags:
 *       - College Programs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: College programs fetched successfully
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
 *                   example: College programs fetched successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       program_id:
 *                         type: string
 *                         format: uuid
 *                         example: 8c3b6d9a-4321-8765-09ba-fedc87654321
 *                       program_name:
 *                         type: string
 *                         example: Bachelor of Science in Computer Science
 *                       college_department_id:
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
 *                   message: College programs fetched successfully.
 *                   data:
 *                     - program_id: 8c3b6d9a-4321-8765-09ba-fedc87654321
 *                       program_name: Bachelor of Science in Computer Science
 *                       college_department_id: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                       department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                       is_deleted: false
 *                       created_at: 2025-01-15T08:30:00.000Z
 *                       updated_at: 2025-10-20T14:45:00.000Z
 *                     - program_id: 7b9d5f8c-1234-5678-90ab-cdef12345678
 *                       program_name: Bachelor of Science in Information Technology
 *                       college_department_id: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                       department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                       is_deleted: false
 *                       created_at: 2025-02-10T09:15:00.000Z
 *                       updated_at: 2025-10-21T16:30:00.000Z
 *       "400":
 *         description: Bad request - missing required information
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "500":
 *         description: Internal server error
 */
router.get(
  "/programs",
  heronAuthMiddlewareAll,
  asyncHandler(collegeProgramController.handleFetchAllPrograms.bind(collegeProgramController)),
);

/**
 * @openapi
 * /management/programs/department/{departmentId}:
 *   get:
 *     summary: Fetch college programs by department
 *     description: |
 *       Retrieves all active college programs under a specific department.
 *
 *       **Authorization Requirements:**
 *       - Requires valid authentication token
 *
 *       **Data Includes:**
 *       - program_id: Unique identifier for program
 *       - program_name: Name of the program
 *       - college_department_id: Department ID the program belongs to
 *       - department_name: Name of the department
 *     tags:
 *       - College Programs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier (department_id) of the department
 *         example: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *     responses:
 *       "200":
 *         description: College programs for the department fetched successfully
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
 *                   example: College programs fetched successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       program_id:
 *                         type: string
 *                         format: uuid
 *                       program_name:
 *                         type: string
 *                       college_department_id:
 *                         type: string
 *                         format: uuid
 *                       department_name:
 *                         type: string
 *                       is_deleted:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *             examples:
 *               successResponse:
 *                 value:
 *                   success: true
 *                   code: FETCHED_SUCCESSFULLY
 *                   message: College programs fetched successfully.
 *                   data:
 *                     - program_id: 8c3b6d9a-4321-8765-09ba-fedc87654321
 *                       program_name: Bachelor of Science in Computer Science
 *                       college_department_id: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                       department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                       is_deleted: false
 *                       created_at: 2025-01-15T08:30:00.000Z
 *                       updated_at: 2025-10-20T14:45:00.000Z
 *                     - program_id: 7b9d5f8c-1234-5678-90ab-cdef12345678
 *                       program_name: Bachelor of Science in Information Technology
 *                       college_department_id: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                       department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                       is_deleted: false
 *                       created_at: 2025-02-10T09:15:00.000Z
 *                       updated_at: 2025-10-21T16:30:00.000Z
 *       "400":
 *         description: Bad request - missing department ID
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "500":
 *         description: Internal server error
 */
router.get(
  "/programs/department/:departmentId",
  heronAuthMiddlewareAll,
  asyncHandler(collegeProgramController.handleFetchProgramsByDepartment.bind(collegeProgramController)),
);

export default router;
