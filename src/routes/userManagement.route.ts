import express from "express";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { heronAuthMiddleware, heronAuthMiddlewareAdmin, heronAuthMiddlewareSuperAdmin } from "../middlewares/heronAuth.middleware..js";
import { AdminRepository } from "../repository/admin.repository.js";
import { CounselorRepository } from "../repository/counselor.repository.js";
import { StudentRepository } from "../repository/student.repository.js";
import { UserManagementService } from "../services/userManagement.service.js";
import { UserManagementController } from "../controllers/userManagement.controller.js";

const router = express.Router();

const adminRepository = new AdminRepository();
const counselorRepository = new CounselorRepository();
const studentRepository = new StudentRepository();
const userManagementService = new UserManagementService(counselorRepository, studentRepository, adminRepository);
const userManagementController = new UserManagementController(userManagementService);

/**
 * @openapi
 * /management/counselors:
 *   get:
 *     summary: Fetch all counselors for user management
 *     description: |
 *       Retrieves a paginated list of counselors for admin user management.
 *
 *       **Authorization Requirements:**
 *       - **Admins/Super Admins**: Allowed
 *       - **Counselors/Students**: Forbidden
 *
 *       **Pagination:**
 *       - Uses cursor-based pagination with `limit` and `cursor`
 *       - `nextCursor` contains the `user_id` of the last counselor in the current page
 *     tags:
 *       - User Management
 *       - Counselors
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
 *         description: Maximum number of counselor records to return
 *         example: 10
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Counselor user_id of the last item from the previous page
 *         example: ac57c94e-f6c8-4e10-b7ac-c364538195dc
 *     responses:
 *       "200":
 *         description: Counselors fetched successfully
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
 *                   example: Counselors fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     counselors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                             example: ac57c94e-f6c8-4e10-b7ac-c364538195dc
 *                           user_name:
 *                             type: string
 *                             example: Dr. Jane Smith
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: counselor@wellnest.com
 *                           department_id:
 *                             type: string
 *                             format: uuid
 *                             example: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                           department_name:
 *                             type: string
 *                             example: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-10-17T21:19:32.713Z
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-10-17T21:19:32.713Z
 *                     hasMore:
 *                       type: boolean
 *                       example: false
 *                     nextCursor:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                       example: null
 *             examples:
 *               successResponse:
 *                 value:
 *                   success: true
 *                   code: FETCHED_SUCCESSFULLY
 *                   message: Counselors fetched successfully.
 *                   data:
 *                     counselors:
 *                       - user_id: ac57c94e-f6c8-4e10-b7ac-c364538195dc
 *                         user_name: Dr. Jane Smith
 *                         email: counselor@wellnest.com
 *                         department_id: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                         department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                         created_at: 2025-10-17T21:19:32.713Z
 *                         updated_at: 2025-10-17T21:19:32.713Z
 *                     hasMore: false
 *                     nextCursor: null
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

/**
 * @openapi
 * /management/admins:
 *   get:
 *     summary: Fetch all admins for user management
 *     description: |
 *       Retrieves a paginated list of admins for admin user management.
 *
 *       **Authorization Requirements:**
 *       - **Admins/Super Admins**: Allowed
 *       - **Counselors/Students**: Forbidden
 *
 *       **Pagination:**
 *       - Uses cursor-based pagination with `limit` and `cursor`
 *       - `nextCursor` contains the `user_id` of the last admin in the current page
 *     tags:
 *       - User Management
 *       - Admins
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
 *         description: Maximum number of admin records to return
 *         example: 10
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Admin user_id of the last item from the previous page
 *         example: ac57c94e-f6c8-4e10-b7ac-c364538195dc
 *     responses:
 *       "200":
 *         description: Admins fetched successfully
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
 *                   example: Admins fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     admins:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                             example: ac57c94e-f6c8-4e10-b7ac-c364538195dc
 *                           user_name:
 *                             type: string
 *                             example: Jane Admin
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: admin@wellnest.com
 *                           is_super_admin:
 *                             type: boolean
 *                             example: false
 *                           is_deleted:
 *                             type: boolean
 *                             example: false
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-10-17T21:19:32.713Z
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-10-17T21:19:32.713Z
 *                     hasMore:
 *                       type: boolean
 *                       example: false
 *                     nextCursor:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                       example: null
 *       "400":
 *         description: Bad request - invalid query parameters or missing user info
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "403":
 *         description: Forbidden - only admins can access this resource
 *       "500":
 *         description: Internal server error
 */
router.get(
	"/admins",
	heronAuthMiddlewareAdmin,
	asyncHandler(userManagementController.handleFetchPaginatedAdmins.bind(userManagementController)),
);

/**
 * @openapi
 * /management/admins:
 *   post:
 *     summary: Create a new admin user
 *     description: |
 *       Creates a new admin account.
 *
 *       **Authorization Requirements:**
 *       - **Super Admins**: Allowed
 *       - **Admins/Counselors/Students**: Forbidden
 *     tags:
 *       - User Management
 *       - Admins
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_name
 *               - email
 *               - password
 *             properties:
 *               user_name:
 *                 type: string
 *                 example: Jane Admin
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.admin@wellnest.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *               is_super_admin:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *     responses:
 *       "201":
 *         description: Admin created successfully
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
 *                   example: CREATED_SUCCESSFULLY
 *                 message:
 *                   type: string
 *                   example: Admin created successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     user_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     is_super_admin:
 *                       type: boolean
 *                     is_deleted:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       "400":
 *         description: Bad request - missing required fields or invalid field types
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "403":
 *         description: Forbidden - only super admins can create admins
 *       "500":
 *         description: Internal server error
 */
router.post(
	"/admins",
	heronAuthMiddlewareSuperAdmin,
	asyncHandler(userManagementController.handleCreateAdmin.bind(userManagementController)),
);

/**
 * @openapi
 * /management/counselors:
 *   post:
 *     summary: Create a new counselor user
 *     description: |
 *       Creates a new counselor account and assigns it to a department.
 *
 *       **Authorization Requirements:**
 *       - **Admins/Super Admins**: Allowed
 *       - **Counselors/Students**: Forbidden
 *     tags:
 *       - User Management
 *       - Counselors
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_name
 *               - email
 *               - password
 *               - department_id
 *             properties:
 *               user_name:
 *                 type: string
 *                 example: Dr. John Counselor
 *               email:
 *                 type: string
 *                 format: email
 *                 example: counselor@wellnest.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *               department_id:
 *                 type: string
 *                 format: uuid
 *                 example: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *     responses:
 *       "201":
 *         description: Counselor created successfully
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
 *                   example: CREATED_SUCCESSFULLY
 *                 message:
 *                   type: string
 *                   example: Counselor created successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     user_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     is_deleted:
 *                       type: boolean
 *                     department_id:
 *                       type: string
 *                       format: uuid
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       "400":
 *         description: Bad request - missing required fields or invalid field types
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "403":
 *         description: Forbidden - only admins can create counselors
 *       "500":
 *         description: Internal server error
 */
router.post(
	"/counselors",
	heronAuthMiddlewareAdmin,
	asyncHandler(userManagementController.handleCreateCounselor.bind(userManagementController)),
);

/**
 * @openapi
 * /management/admins/{adminId}:
 *   patch:
 *     summary: Update admin basic information
 *     description: |
 *       Updates an admin's basic information.
 *
 *       **Authorization Rules:**
 *       - **Admin**: Can only update their own info
 *       - **Super Admin**: Can update own info and non-super-admin accounts
 *       - **Super Admin cannot update other Super Admin accounts**
 *     tags:
 *       - User Management
 *       - Admins
 *     security:
 *       - bearerAuth: []
 */
router.patch(
	"/admins/:adminId",
	heronAuthMiddlewareAdmin,
	asyncHandler(userManagementController.handleUpdateAdmin.bind(userManagementController)),
);

/**
 * @openapi
 * /management/admins/{adminId}/password:
 *   patch:
 *     summary: Update admin password
 *     description: |
 *       Updates an admin password.
 *
 *       **Authorization Rules:**
 *       - **Admin**: Can only update their own password and must provide previous_password
 *       - **Super Admin**: Can update own password and non-super-admin passwords
 *       - **Super Admin cannot update other Super Admin passwords**
 *
 *       Note: Super-admin initiated password changes for other admins will notify the user.
 *     tags:
 *       - User Management
 *       - Admins
 *     security:
 *       - bearerAuth: []
 */
router.patch(
	"/admins/:adminId/password",
	heronAuthMiddlewareAdmin,
	asyncHandler(userManagementController.handleUpdateAdminPassword.bind(userManagementController)),
);

export default router;
