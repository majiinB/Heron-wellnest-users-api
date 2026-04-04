import express from 'express'
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { UserController } from '../controllers/user.controller.js';
import { UserService } from '../services/user.service.js';
import { StudentClassificationRepository } from '../repository/studentClassification.repository.js';
import { heronAuthMiddleware, heronAuthMiddlewareStudent } from '../middlewares/heronAuth.middleware..js';
import { AdminRepository } from '../repository/admin.repository.js';
import { CounselorRepository } from '../repository/counselor.repository.js';

const router = express.Router();
const studentClassificationRepository = new StudentClassificationRepository();
const adminRepository = new AdminRepository();
const counselorRepository = new CounselorRepository();
const userService = new UserService(studentClassificationRepository, adminRepository, counselorRepository);
const userController = new UserController(userService);

/**
 * @openapi
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         code:
 *           type: string
 *           example: BAD_REQUEST
 *         message:
 *           type: string
 *           example: Invalid input data
 */

/**
 * @openapi
 * /students:
 *   get:
 *     summary: Fetch all students with classifications
 *     description: |
 *       Retrieves a paginated list of students with their most recent classification records.
 *       - **Counselors**: Can only see students from their assigned department
 *       - **Admins/Super Admins**: Can see students from all departments
 *       - Supports filtering by classification type, flagged status, and department
 *       - Uses cursor-based pagination for efficient data retrieval
 *       - Email addresses are anonymized (e.g., a****r@umak.edu.ph)
 *     tags:
 *       - Students
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classification
 *         schema:
 *           type: string
 *           enum: [Excelling, Thriving, Struggling, InCrisis]
 *         description: Filter students by classification type
 *         example: Struggling
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of records to return
 *         example: 20
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Classification ID of the last item from the previous page (for pagination)
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
 *                     classifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           classification_id:
 *                             type: string
 *                             format: uuid
 *                             example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                           student_id:
 *                             type: string
 *                             format: uuid
 *                             example: 7b9d5f8c-1234-5678-90ab-cdef12345678
 *                           classification:
 *                             type: string
 *                             enum: [Excelling, Thriving, Struggling, In-crisis]
 *                             example: Struggling
 *                           is_flagged:
 *                             type: boolean
 *                             example: true
 *                           classified_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-10-21T12:08:11.853Z
 *                           email:
 *                             type: string
 *                             description: Anonymized email address
 *                             example: j****e@umak.edu.ph
 *                           department_name:
 *                             type: string
 *                             example: Computer Science
 *                     hasMore:
 *                       type: boolean
 *                       description: Indicates if there are more records available
 *                       example: true
 *                     nextCursor:
 *                       type: string
 *                       format: uuid
 *                       description: Classification ID to use for fetching the next page
 *                       example: 8c3b6d9a-4321-8765-09ba-fedc87654321
 *             examples:
 *               successResponse:
 *                 value:
 *                   success: true
 *                   code: FETCHED_SUCCESSFULLY
 *                   message: Students fetched successfully.
 *                   data:
 *                     classifications:
 *                       - classification_id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                         student_id: 7b9d5f8c-1234-5678-90ab-cdef12345678
 *                         classification: Struggling
 *                         is_flagged: true
 *                         classified_at: 2025-10-21T12:08:11.853Z
 *                         email: j****e@umak.edu.ph
 *                         department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                       - classification_id: 9d6e4a2c-5678-1234-90ab-cdef87654321
 *                         student_id: 4f8b3c7d-9876-5432-10ba-fedc12345678
 *                         classification: Excelling
 *                         is_flagged: false
 *                         classified_at: 2025-10-20T08:30:00.000Z
 *                         email: j****h@umak.edu.ph
 *                         department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                     hasMore: true
 *                     nextCursor: 9d6e4a2c-5678-1234-90ab-cdef87654321
 *       "400":
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingRole:
 *                 value:
 *                   success: false
 *                   code: MISSING_USER_INFO
 *                   message: User role is required.
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 value:
 *                   success: false
 *                   code: UNAUTHORIZED
 *                   message: Invalid or missing authentication token.
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 value:
 *                   success: false
 *                   code: INTERNAL_SERVER_ERROR
 *                   message: Failed to fetch students
 */
router.get('/students', heronAuthMiddleware, asyncHandler(userController.handleFetchingAllStudents.bind(userController)));

/**
 * @openapi
 * /students/{studentId}:
 *   post:
 *     summary: Fetch detailed information for a specific student
 *     description: |
 *       Retrieves detailed information for a specific student including:
 *       - Latest classification record
 *       - Daily classifications for the last 7 days
 *       - Weekly classifications (latest 7 records)
 *       - Student profile (name, email, program, department)
 *       - 7 most recent mood check-ins (representing a week)
 *       
 *       **Authorization Requirements:**
 *       - **Admins/Super Admins**: Requires email and password in request body. Can access any student.
 *       - **Counselors**: Requires email and password in request body. Can only access students from their assigned department.
 *       
 *       **Note:** This endpoint requires additional credential verification for sensitive data access.
 *     tags:
 *       - Students
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier (user_id) of the student
 *         example: c81daef9-bc32-4624-a595-3cdb0f66d559
 *     requestBody:
 *       required: true
 *       description: Admin or counselor credentials for verification
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the admin or counselor making the request
 *                 example: admin@umak.edu.ph
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password of the admin or counselor
 *                 example: SecurePassword123!
 *           examples:
 *             adminCredentials:
 *               value:
 *                 email: admin@umak.edu.ph
 *                 password: SecurePassword123!
 *             counselorCredentials:
 *               value:
 *                 email: counselor@umak.edu.ph
 *                 password: CounselorPass456!
 *     responses:
 *       "200":
 *         description: Student information fetched successfully
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
 *                   example: Student fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     classification_id:
 *                       type: string
 *                       format: uuid
 *                       example: 539bc580-915c-49b7-a6f6-bf736e791595
 *                     student_id:
 *                       type: string
 *                       format: uuid
 *                       example: c81daef9-bc32-4624-a595-3cdb0f66d559
 *                     classification:
 *                       type: string
 *                       enum: [Excelling, Thriving, Struggling, InCrisis]
 *                       example: InCrisis
 *                     classification_probabilities:
 *                       type: object
 *                       properties:
 *                         InCrisis:
 *                           type: number
 *                           format: float
 *                           example: 0.8806940987301506
 *                         Thriving:
 *                           type: number
 *                           format: float
 *                           example: 0.010512432099127202
 *                         Excelling:
 *                           type: number
 *                           format: float
 *                           example: 0.0008382617480617205
 *                         Struggling:
 *                           type: number
 *                           format: float
 *                           example: 0.1079552074226604
 *                     classified_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-03-28T16:00:27.379Z
 *                     user_name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: Full email address (not anonymized for detailed view)
 *                       example: johndoe@example.com
 *                     department_id:
 *                       type: string
 *                       format: uuid
 *                       example: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                     program_name:
 *                       type: string
 *                       example: Bachelor of Science in Information Technology (Information and Network Security Elective Track)
 *                     department_name:
 *                       type: string
 *                       example: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                     mood_check_ins:
 *                       type: array
 *                       description: Array of the 7 most recent mood check-ins
 *                       items:
 *                         type: object
 *                         properties:
 *                           check_in_id:
 *                             type: string
 *                             format: uuid
 *                             example: 3e8815d1-c8ba-40f0-af09-575acf1ad67a
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                             example: c81daef9-bc32-4624-a595-3cdb0f66d559
 *                           mood_1:
 *                             type: string
 *                             example: calm
 *                           mood_2:
 *                             type: string
 *                             example: motivated
 *                           mood_3:
 *                             type: string
 *                             example: content
 *                           checked_in_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-10-22T10:57:55.653Z
 *                     daily_classifications:
 *                       type: array
 *                       description: Daily classifications in the last 7 days
 *                       items:
 *                         type: object
 *                         properties:
 *                           classification_id:
 *                             type: string
 *                             format: uuid
 *                             example: 5c164be4-0dd3-4964-b6ab-075b8ee955ef
 *                           student_id:
 *                             type: string
 *                             format: uuid
 *                             example: 699ab9b8-36a8-4735-bb0c-2d77cdb5a1b3
 *                           classification:
 *                             type: string
 *                             enum: [Excelling, Thriving, Struggling, InCrisis]
 *                             example: InCrisis
 *                           classification_probabilities:
 *                             type: object
 *                             properties:
 *                               InCrisis:
 *                                 type: number
 *                                 format: float
 *                                 example: 0.8806940987301506
 *                               Thriving:
 *                                 type: number
 *                                 format: float
 *                                 example: 0.010512432099127202
 *                               Excelling:
 *                                 type: number
 *                                 format: float
 *                                 example: 0.0008382617480617205
 *                               Struggling:
 *                                 type: number
 *                                 format: float
 *                                 example: 0.1079552074226604
 *                           classified_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-03-28T16:00:27.379Z
 *                     weekly_classifications:
 *                       type: array
 *                       description: Weekly classifications from student_weekly_classification
 *                       items:
 *                         type: object
 *                         properties:
 *                           weekly_classification_id:
 *                             type: string
 *                             format: uuid
 *                             example: 4ad53c43-7664-479f-8099-9438016066ff
 *                           student_id:
 *                             type: string
 *                             format: uuid
 *                             example: 699ab9b8-36a8-4735-bb0c-2d77cdb5a1b3
 *                           week_start:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-03-22T00:00:00.000Z
 *                           week_end:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-03-29T00:00:00.000Z
 *                           dominant_classification:
 *                             type: string
 *                             enum: [Excelling, Thriving, Struggling, InCrisis]
 *                             example: InCrisis
 *                           is_flagged:
 *                             type: boolean
 *                             example: false
 *                           classified_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-03-28T16:00:26.083Z
 *             examples:
 *               successResponse:
 *                 value:
 *                   success: true
 *                   code: FETCHED_SUCCESSFULLY
 *                   message: Student fetched successfully.
 *                   data:
 *                     classification_id: 5c164be4-0dd3-4964-b6ab-075b8ee955ef
 *                     student_id: 699ab9b8-36a8-4735-bb0c-2d77cdb5a1b3
 *                     classification: InCrisis
 *                     classification_probabilities:
 *                       InCrisis: 0.8806940987301506
 *                       Thriving: 0.010512432099127202
 *                       Excelling: 0.0008382617480617205
 *                       Struggling: 0.1079552074226604
 *                     classified_at: 2026-03-28T16:00:27.379Z
 *                     user_name: LEANN LOUISE ORILLE
 *                     email: lorille.9869@umak.edu.ph
 *                     department_id: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                     program_name: Bachelor of Science in Information Technology (Information and Network Security Elective Track)
 *                     department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                     mood_check_ins:
 *                       - check_in_id: 1e2f2f8f-66b2-4152-9125-a04fe7ee7abd
 *                         user_id: 699ab9b8-36a8-4735-bb0c-2d77cdb5a1b3
 *                         mood_1: restless
 *                         mood_2: hopeless
 *                         mood_3: sad
 *                         checked_in_at: 2026-03-28T13:34:35.389Z
 *                       - check_in_id: d1449ce3-6566-413b-9728-9774e7dae048
 *                         user_id: 699ab9b8-36a8-4735-bb0c-2d77cdb5a1b3
 *                         mood_1: hopeless
 *                         mood_2: exhausted
 *                         mood_3: anxious
 *                         checked_in_at: 2026-03-27T12:50:36.211Z
 *                     daily_classifications:
 *                       - classification_id: 5c164be4-0dd3-4964-b6ab-075b8ee955ef
 *                         student_id: 699ab9b8-36a8-4735-bb0c-2d77cdb5a1b3
 *                         classification: InCrisis
 *                         classification_probabilities:
 *                           InCrisis: 0.8806940987301506
 *                           Thriving: 0.010512432099127202
 *                           Excelling: 0.0008382617480617205
 *                           Struggling: 0.1079552074226604
 *                         classified_at: 2026-03-28T16:00:27.379Z
 *                     weekly_classifications:
 *                       - weekly_classification_id: 4ad53c43-7664-479f-8099-9438016066ff
 *                         student_id: 699ab9b8-36a8-4735-bb0c-2d77cdb5a1b3
 *                         week_start: 2026-03-22T00:00:00.000Z
 *                         week_end: 2026-03-29T00:00:00.000Z
 *                         dominant_classification: InCrisis
 *                         is_flagged: false
 *                         classified_at: 2026-03-28T16:00:26.083Z
 *       "400":
 *         description: Bad request - missing credentials or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingCredentials:
 *                 value:
 *                   success: false
 *                   code: MISSING_ADMIN_CREDENTIALS
 *                   message: This action requires proper credentials.
 *       "401":
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCredentials:
 *                 value:
 *                   success: false
 *                   code: INVALID_CREDENTIALS
 *                   message: Invalid credentials provided. please try again.
 *       "403":
 *         description: Forbidden - counselor attempting to access student from different department
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               forbiddenAccess:
 *                 value:
 *                   success: false
 *                   code: FORBIDDEN_ACCESS
 *                   message: You do not have permission to access this student's information.
 *       "404":
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notFound:
 *                 value:
 *                   success: false
 *                   code: STUDENT_NOT_FOUND
 *                   message: Student not found.
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 value:
 *                   success: false
 *                   code: INTERNAL_SERVER_ERROR
 *                   message: Failed to fetch student information
 */
router.post('/students/:studentId', heronAuthMiddleware, asyncHandler(userController.handleFetchingSpecificStudent.bind(userController)));

/**
 * @openapi
 * /departments/statistics:
 *   get:
 *     summary: Fetch department statistics for student classifications
 *     description: |
 *       Retrieves statistical data about student classifications per department.
 *       
 *       **Role-Based Access:**
 *       - **Admins/Super Admins**: Returns statistics for ALL departments
 *       - **Counselors**: Returns statistics ONLY for their assigned department
 *       
 *       **Statistics Include:**
 *       - Total number of students in the department
 *       - Count of students in each classification category (Excelling, Thriving, Struggling, InCrisis)
 *       - Count of students not yet classified
 *       - Percentage breakdown for each category
 *       - Weekly and monthly mood sentiment breakdowns
 *
 *       **Response Formats:**
 *       - `format=json` (default): standard API response wrapper
 *       - `format=raw`: raw JSON payload without the response wrapper
 *       - `format=csv`: CSV file download
 *       
 *       **Note:** Only counts the most recent classification per student. All percentages add up to 100%.
 *     tags:
 *       - Statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Department statistics fetched successfully
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
 *                   example: Department statistics fetched successfully.
 *                 data:
 *                   oneOf:
 *                     - type: object
 *                       description: Single department statistics (for counselors)
 *                       properties:
 *                         department_name:
 *                           type: string
 *                           example: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                         total_students:
 *                           type: integer
 *                           description: Total number of students in the department
 *                           example: 150
 *                         excelling_count:
 *                           type: integer
 *                           description: Number of students classified as Excelling
 *                           example: 45
 *                         thriving_count:
 *                           type: integer
 *                           description: Number of students classified as Thriving
 *                           example: 60
 *                         struggling_count:
 *                           type: integer
 *                           description: Number of students classified as Struggling
 *                           example: 25
 *                         in_crisis_count:
 *                           type: integer
 *                           description: Number of students classified as InCrisis
 *                           example: 10
 *                         not_classified_count:
 *                           type: integer
 *                           description: Number of students not yet classified
 *                           example: 10
 *                         excelling_percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage of students classified as Excelling
 *                           example: 30.00
 *                         thriving_percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage of students classified as Thriving
 *                           example: 40.00
 *                         struggling_percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage of students classified as Struggling
 *                           example: 16.67
 *                         in_crisis_percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage of students classified as InCrisis
 *                           example: 6.67
 *                         not_classified_percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage of students not yet classified
 *                           example: 6.67
 *                     - type: array
 *                       description: All departments statistics (for admins)
 *                       items:
 *                         type: object
 *                         properties:
 *                           department_name:
 *                             type: string
 *                             example: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                           total_students:
 *                             type: integer
 *                             example: 150
 *                           excelling_count:
 *                             type: integer
 *                             example: 45
 *                           thriving_count:
 *                             type: integer
 *                             example: 60
 *                           struggling_count:
 *                             type: integer
 *                             example: 25
 *                           in_crisis_count:
 *                             type: integer
 *                             example: 10
 *                           not_classified_count:
 *                             type: integer
 *                             example: 10
 *                           excelling_percentage:
 *                             type: number
 *                             format: float
 *                             example: 30.00
 *                           thriving_percentage:
 *                             type: number
 *                             format: float
 *                             example: 40.00
 *                           struggling_percentage:
 *                             type: number
 *                             format: float
 *                             example: 16.67
 *                           in_crisis_percentage:
 *                             type: number
 *                             format: float
 *                             example: 6.67
 *                           not_classified_percentage:
 *                             type: number
 *                             format: float
 *                             example: 6.67
 *             examples:
 *               counselorResponse:
 *                 summary: Counselor response (single department)
 *                 value:
 *                   success: true
 *                   code: FETCHED_SUCCESSFULLY
 *                   message: Department statistics fetched successfully.
 *                   data:
 *                     department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                     total_students: 1
 *                     excelling_count: 0
 *                     thriving_count: 0
 *                     struggling_count: 0
 *                     in_crisis_count: 1
 *                     not_classified_count: 0
 *                     excelling_percentage: 0
 *                     thriving_percentage: 0
 *                     struggling_percentage: 0
 *                     in_crisis_percentage: 100
 *                     not_classified_percentage: 0
 *               adminResponse:
 *                 summary: Admin response (all departments)
 *                 value:
 *                   success: true
 *                   code: FETCHED_SUCCESSFULLY
 *                   message: Department statistics fetched successfully.
 *                   data:
 *                     - department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                       total_students: 150
 *                       excelling_count: 45
 *                       thriving_count: 60
 *                       struggling_count: 25
 *                       in_crisis_count: 10
 *                       not_classified_count: 10
 *                       excelling_percentage: 30.00
 *                       thriving_percentage: 40.00
 *                       struggling_percentage: 16.67
 *                       in_crisis_percentage: 6.67
 *                       not_classified_percentage: 6.67
 *                     - department_name: COLLEGE OF ENGINEERING
 *                       total_students: 200
 *                       excelling_count: 50
 *                       thriving_count: 80
 *                       struggling_count: 40
 *                       in_crisis_count: 20
 *                       not_classified_count: 10
 *                       excelling_percentage: 25.00
 *                       thriving_percentage: 40.00
 *                       struggling_percentage: 20.00
 *                       in_crisis_percentage: 10.00
 *                       not_classified_percentage: 5.00
 *                     - department_name: COLLEGE OF BUSINESS ADMINISTRATION
 *                       total_students: 180
 *                       excelling_count: 60
 *                       thriving_count: 70
 *                       struggling_count: 30
 *                       in_crisis_count: 10
 *                       not_classified_count: 10
 *                       excelling_percentage: 33.33
 *                       thriving_percentage: 38.89
 *                       struggling_percentage: 16.67
 *                       in_crisis_percentage: 5.56
 *                       not_classified_percentage: 5.56
 *       "400":
 *         description: Bad request - missing required information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingDepartment:
 *                 value:
 *                   success: false
 *                   code: MISSING_DEPARTMENT_INFO
 *                   message: Department information is required.
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 value:
 *                   success: false
 *                   code: UNAUTHORIZED
 *                   message: Invalid or missing authentication token.
 *       "404":
 *         description: Department not found (counselor's department has no data)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notFound:
 *                 value:
 *                   success: false
 *                   code: DEPARTMENT_NOT_FOUND
 *                   message: No statistics found for the specified department.
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 value:
 *                   success: false
 *                   code: INTERNAL_SERVER_ERROR
 *                   message: Failed to fetch department statistics
 */
router.get('/departments/statistics', heronAuthMiddleware, asyncHandler(userController.handleFetchingDepartmentStatistics.bind(userController)));

/**
 * @openapi
 * /departments/counselors:
 *   get:
 *     summary: Fetch counselors from a department
 *     description: |
 *       Retrieves a list of counselors based on the user's role and department.
 *       
 *       **Role-Based Access:**
 *       - **Admins/Super Admins**: Returns ALL counselors from all departments
 *       - **Counselors**: Returns counselors ONLY from their assigned department (with limited information)
 *       - **Students**: Returns counselors ONLY from their assigned department (with limited information)
 *       
 *       **Data Privacy:**
 *       - Students and counselors receive sanitized data (no password, is_deleted, created_at, updated_at fields)
 *       - Admins receive complete counselor information
 *     tags:
 *       - Counselors
 *     security:
 *       - bearerAuth: []
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
 *                   oneOf:
 *                     - type: array
 *                       description: Full counselor data (for admins)
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                             example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                           user_name:
 *                             type: string
 *                             example: Dr. Jane Smith
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: janesmith@umak.edu.ph
 *                           is_deleted:
 *                             type: boolean
 *                             example: false
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
 *                             example: 2024-01-15T08:30:00.000Z
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-10-20T14:45:00.000Z
 *                     - type: array
 *                       description: Limited counselor data (for students and counselors)
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                             example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                           user_name:
 *                             type: string
 *                             example: Dr. Jane Smith
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: janesmith@umak.edu.ph
 *                           department_id:
 *                             type: string
 *                             format: uuid
 *                             example: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                           department_name:
 *                             type: string
 *                             example: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *             examples:
 *               adminResponse:
 *                 summary: Admin response (all departments, full data)
 *                 value:
 *                   success: true
 *                   code: FETCHED_SUCCESSFULLY
 *                   message: Counselors fetched successfully.
 *                   data:
 *                     - user_id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                       user_name: Dr. Jane Smith
 *                       email: janesmith@umak.edu.ph
 *                       is_deleted: false
 *                       department_id: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                       department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                       created_at: 2024-01-15T08:30:00.000Z
 *                       updated_at: 2024-10-20T14:45:00.000Z
 *                     - user_id: 7b9d5f8c-1234-5678-90ab-cdef12345678
 *                       user_name: Dr. John Doe
 *                       email: johndoe@umak.edu.ph
 *                       is_deleted: false
 *                       department_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *                       department_name: COLLEGE OF ENGINEERING
 *                       created_at: 2024-02-10T09:15:00.000Z
 *                       updated_at: 2024-10-21T16:30:00.000Z
 *               studentOrCounselorResponse:
 *                 summary: Student/Counselor response (single department, limited data)
 *                 value:
 *                   success: true
 *                   code: FETCHED_SUCCESSFULLY
 *                   message: Counselors fetched successfully.
 *                   data:
 *                     - user_id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                       user_name: Dr. Jane Smith
 *                       email: janesmith@umak.edu.ph
 *                       department_id: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                       department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *                     - user_id: 9d6e4a2c-5678-1234-90ab-cdef87654321
 *                       user_name: Dr. Maria Garcia
 *                       email: mgarcia@umak.edu.ph
 *                       department_id: e2c087e6-e7ec-4f34-a215-b8a67b3a9d92
 *                       department_name: COLLEGE OF COMPUTING AND INFORMATION SCIENCES
 *       "400":
 *         description: Bad request - missing required information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingUserInfo:
 *                 value:
 *                   success: false
 *                   code: MISSING_USER_INFO
 *                   message: User role is required.
 *               missingDepartment:
 *                 value:
 *                   success: false
 *                   code: MISSING_DEPARTMENT_INFO
 *                   message: College department information is required.
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 value:
 *                   success: false
 *                   code: UNAUTHORIZED
 *                   message: Invalid or missing authentication token.
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               serverError:
 *                 value:
 *                   success: false
 *                   code: INTERNAL_SERVER_ERROR
 *                   message: Failed to fetch counselors
 */
router.get('/departments/counselors', heronAuthMiddlewareStudent, asyncHandler(userController.handleFetchingAllDepartmentCounselors.bind(userController)));

export default router;