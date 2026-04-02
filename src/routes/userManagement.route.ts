import express from "express";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { heronAuthMiddleware, heronAuthMiddlewareAdmin, heronAuthMiddlewareSuperAdmin } from "../middlewares/heronAuth.middleware..js";
import { AdminRepository } from "../repository/admin.repository.js";
import { CollegeDepartmentRepository } from "../repository/collegeDepartment.repository.js";
import { CounselorRepository } from "../repository/counselor.repository.js";
import { StudentRepository } from "../repository/student.repository.js";
import { UserManagementService } from "../services/userManagement.service.js";
import { UserManagementController } from "../controllers/userManagement.controller.js";

const router = express.Router();

const adminRepository = new AdminRepository();
const counselorRepository = new CounselorRepository();
const studentRepository = new StudentRepository();
const collegeDepartmentRepository = new CollegeDepartmentRepository();
const userManagementService = new UserManagementService(
	counselorRepository,
	studentRepository,
	adminRepository,
	collegeDepartmentRepository,
);
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
 *       Updates an admin's basic information (username and/or email).
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *                 description: New username (at least one field required)
 *                 example: Jane Updated
 *               email:
 *                 type: string
 *                 format: email
 *                 description: New email address (at least one field required)
 *                 example: jane.updated@wellnest.com
 *     responses:
 *       "200":
 *         description: Admin information updated successfully
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
 *                   example: UPDATED_SUCCESSFULLY
 *                 message:
 *                   type: string
 *                   example: Admin information updated successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                       user_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       is_super_admin:
 *                         type: boolean
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
 *                   code: UPDATED_SUCCESSFULLY
 *                   message: Admin information updated successfully.
 *                   data:
 *                     - user_id: 27acfd01-6db6-4157-a648-61b33c33a4e5
 *                       user_name: Nomar Maestro
 *                       email: nomarmaestro@gmail.com
 *                       is_super_admin: false
 *                       is_deleted: false
 *                       created_at: "2026-04-01T15:35:43.983Z"
 *                       updated_at: "2026-04-01T15:55:54.328Z"
 *       "400":
 *         description: Bad request - missing update fields or invalid field types
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "403":
 *         description: Forbidden - only admins can update admin info
 *       "404":
 *         description: Admin not found
 *       "500":
 *         description: Internal server error
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
 *       - **Admin**: Can only update their own password and MUST provide previous_password for verification
 *       - **Super Admin updating own password**: Must provide previous_password for verification
 *       - **Super Admin updating another admin's password**: No previous_password required (can be admin or non-super-admin only)
 *       - **Super Admin cannot update other Super Admin passwords**
 *
 *       Note: Super-admin initiated password changes for other admins will trigger a notification event.
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
 *               - new_password
 *             properties:
 *               new_password:
 *                 type: string
 *                 format: password
 *                 description: The new password for the admin
 *                 example: NewSecurePass123!
 *               previous_password:
 *                 type: string
 *                 format: password
 *                 description: Required when admin is updating their own password or super admin is updating their own password. Not required when super admin is updating another admin's password.
 *                 example: OldPass123!
 *     responses:
 *       "200":
 *         description: Admin password updated successfully
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
 *                   example: UPDATED_SUCCESSFULLY
 *                 message:
 *                   type: string
 *                   example: Admin password updated successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                       user_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       is_super_admin:
 *                         type: boolean
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
 *                   code: UPDATED_SUCCESSFULLY
 *                   message: Admin password updated successfully.
 *                   data:
 *                     - user_id: 27acfd01-6db6-4157-a648-61b33c33a4e5
 *                       user_name: Nomar Maestro 1
 *                       email: nomarmaestro@gmail.com
 *                       is_super_admin: false
 *                       is_deleted: false
 *                       created_at: "2026-04-01T15:35:43.983Z"
 *                       updated_at: "2026-04-02T00:51:03.956Z"
 *       "400":
 *         description: Bad request - missing new_password, invalid field types, or previous_password required but not provided
 *       "401":
 *         description: Unauthorized - invalid authentication token or incorrect previous_password
 *       "403":
 *         description: Forbidden - insufficient permissions or attempting to update another super admin
 *       "404":
 *         description: Admin not found
 *       "500":
 *         description: Internal server error - failed to update password
 */
router.patch(
	"/admins/:adminId/password",
	heronAuthMiddlewareAdmin,
	asyncHandler(userManagementController.handleUpdateAdminPassword.bind(userManagementController)),
);

/**
 * @openapi
 * /management/counselors/{counselorId}:
 *   patch:
 *     summary: Update counselor basic information
 *     description: |
 *       Updates a counselor's basic information.
 *
 *       **Authorization Rules:**
 *       - **Counselor**: Can only update their own info
 *       - **Admin/Super Admin**: Can update any counselor info
 *       - For department updates, provide `department_id` from the database
 *
 *       Note: Admin-initiated updates include a placeholder notification event.
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
 *             properties:
 *               user_name:
 *                 type: string
 *                 description: New counselor username (at least one field required)
 *                 example: Guest Account 67
 *               email:
 *                 type: string
 *                 format: email
 *                 description: New counselor email (at least one field required)
 *                 example: guestaccount67@gmail.com
 *               department_id:
 *                 type: string
 *                 format: uuid
 *                 description: New department ID (at least one field required)
 *                 example: 2fcf458f-6d18-40a0-8a4d-b16a70560259
 *     responses:
 *       "200":
 *         description: Counselor information updated successfully
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
 *                   example: UPDATED_SUCCESSFULLY
 *                 message:
 *                   type: string
 *                   example: Counselor information updated successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                       user_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       is_deleted:
 *                         type: boolean
 *                       department_id:
 *                         type: string
 *                         format: uuid
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
 *                   code: UPDATED_SUCCESSFULLY
 *                   message: Counselor information updated successfully.
 *                   data:
 *                     - user_id: 35a59635-aba5-48c1-b75f-df75a4c3271e
 *                       user_name: Guest Account 67
 *                       email: guestaccount67@gmail.com
 *                       is_deleted: false
 *                       department_id: 2fcf458f-6d18-40a0-8a4d-b16a70560259
 *                       created_at: "2026-04-01T15:40:12.238Z"
 *                       updated_at: "2026-04-02T02:24:11.015Z"
 *       "400":
 *         description: Bad request - missing update fields or invalid field types
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "403":
 *         description: Forbidden - insufficient permission to update target counselor
 *       "404":
 *         description: Counselor not found
 *       "500":
 *         description: Internal server error
 */
router.patch(
	"/counselors/:counselorId",
	heronAuthMiddleware,
	asyncHandler(userManagementController.handleUpdateCounselor.bind(userManagementController)),
);

/**
 * @openapi
 * /management/counselors/{counselorId}/password:
 *   patch:
 *     summary: Update counselor password
 *     description: |
 *       Updates a counselor password.
 *
 *       **Authorization Rules:**
 *       - **Counselor**: Can only update their own password and must provide previous_password
 *       - **Admin/Super Admin**: Can update any counselor password without previous_password
 *
 *       Note: Admin-initiated password changes include a placeholder notification event.
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
 *               - new_password
 *             properties:
 *               new_password:
 *                 type: string
 *                 format: password
 *                 description: New counselor password
 *                 example: NewSecurePass123!
 *               previous_password:
 *                 type: string
 *                 format: password
 *                 description: Required when a counselor updates their own password. Not required for admin/super_admin initiated updates.
 *                 example: OldPass123!
 *     responses:
 *       "200":
 *         description: Counselor password updated successfully
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
 *                   example: UPDATED_SUCCESSFULLY
 *                 message:
 *                   type: string
 *                   example: Counselor password updated successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                       user_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       is_deleted:
 *                         type: boolean
 *                       department_id:
 *                         type: string
 *                         format: uuid
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
 *                   code: UPDATED_SUCCESSFULLY
 *                   message: Counselor password updated successfully.
 *                   data:
 *                     - user_id: 35a59635-aba5-48c1-b75f-df75a4c3271e
 *                       user_name: Guest Account 67
 *                       email: guestaccount67@gmail.com
 *                       is_deleted: false
 *                       department_id: 2fcf458f-6d18-40a0-8a4d-b16a70560259
 *                       created_at: "2026-04-01T15:40:12.238Z"
 *                       updated_at: "2026-04-02T02:54:23.270Z"
 *       "400":
 *         description: Bad request - missing new_password, invalid field types, or previous_password required but not provided
 *       "401":
 *         description: Unauthorized - invalid authentication token or incorrect previous_password
 *       "403":
 *         description: Forbidden - insufficient permission to update target counselor password
 *       "404":
 *         description: Counselor not found
 *       "500":
 *         description: Internal server error - failed to update password
 */
router.patch(
	"/counselors/:counselorId/password",
	heronAuthMiddleware,
	asyncHandler(userManagementController.handleUpdateCounselorPassword.bind(userManagementController)),
);

/**
 * @openapi
 * /management/counselors/{counselorId}:
 *   delete:
 *     summary: Soft delete counselor
 *     description: |
 *       Soft deletes a counselor account by setting `is_deleted` to `true`.
 *
 *       **Authorization Rules:**
 *       - **Admin/Super Admin**: Allowed
 *       - **Counselor/Student**: Forbidden
 *
 *       Note: Admin-initiated deletions include a placeholder notification event.
 *     tags:
 *       - User Management
 *       - Counselors
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Counselor deleted successfully
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
 *                   example: DELETED_SUCCESSFULLY
 *                 message:
 *                   type: string
 *                   example: Counselor deleted successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                       user_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       is_deleted:
 *                         type: boolean
 *                         example: true
 *                       department_id:
 *                         type: string
 *                         format: uuid
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
 *                   code: DELETED_SUCCESSFULLY
 *                   message: Counselor deleted successfully.
 *                   data:
 *                     - user_id: 35a59635-aba5-48c1-b75f-df75a4c3271e
 *                       user_name: Guest Account 67
 *                       email: guestaccount67@gmail.com
 *                       is_deleted: true
 *                       department_id: 2fcf458f-6d18-40a0-8a4d-b16a70560259
 *                       created_at: "2026-04-01T15:40:12.238Z"
 *                       updated_at: "2026-04-02T03:11:16.970Z"
 *       "400":
 *         description: Bad request - missing user info or counselor ID
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "403":
 *         description: Forbidden - only admins can delete counselors
 *       "404":
 *         description: Counselor not found
 *       "500":
 *         description: Internal server error
 */
router.delete(
	"/counselors/:counselorId",
	heronAuthMiddlewareAdmin,
	asyncHandler(userManagementController.handleDeleteCounselor.bind(userManagementController)),
);

export default router;
