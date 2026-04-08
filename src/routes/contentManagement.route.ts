import express, { type NextFunction, type Request, type Response } from "express";
import multer, { MulterError } from "multer";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { heronAuthMiddlewareAdmin } from "../middlewares/heronAuth.middleware..js";
import { ContentManagementRepository } from "../repository/contentManagement.repository.js";
import { ContentManagementService } from "../services/contentManagement.service.js";
import { ContentManagementController } from "../controllers/contentManagement.controller.js";
import { AppError } from "../types/appError.type.js";
import { MAX_CONTENT_IMAGE_SIZE_BYTES } from "../utils/imageUpload.util.js";

const router = express.Router();

const contentImageUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: MAX_CONTENT_IMAGE_SIZE_BYTES },
});

function parseContentImageUpload(req: Request, res: Response, next: NextFunction): void {
	contentImageUpload.single("image")(req, res, (err: unknown) => {
		if (!err) {
			next();
			return;
		}

		if (err instanceof MulterError) {
			if (err.code === "LIMIT_FILE_SIZE") {
				next(new AppError(413, "IMAGE_FILE_TOO_LARGE", `Image file must not exceed ${MAX_CONTENT_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`, true));
				return;
			}

			if (err.code === "LIMIT_UNEXPECTED_FILE") {
				next(new AppError(400, "UNEXPECTED_IMAGE_FIELD", "Use multipart/form-data field name 'image'.", true));
				return;
			}

			if (err.code === "MISSING_FIELD_NAME") {
				next(new AppError(400, "INVALID_MULTIPART_FORM_DATA", "Malformed multipart form-data: field name is missing.", true));
				return;
			}

			next(new AppError(400, "INVALID_MULTIPART_FORM_DATA", err.message, true));
			return;
		}

		next(err as Error);
	});
}

const contentManagementRepository = new ContentManagementRepository();
const contentManagementService = new ContentManagementService(contentManagementRepository);
const contentManagementController = new ContentManagementController(contentManagementService);

/**
 * @openapi
 * /content-management:
 *   post:
 *     summary: Create promotional content
 *     description: |
 *       Creates a new promotional content record.
 *
 *       **Authorization Requirements:**
 *       - **Admins/Super Admins**: Allowed
 *       - **Counselors/Students**: Forbidden
 *
 *       **Image Input:**
 *       - Supports `multipart/form-data` image file upload via `image` field
 *       - Or accepts an `image` URL string in request body
 *     tags:
 *       - Content Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - headline
 *               - summary
 *             properties:
 *               title:
 *                 type: string
 *                 example: Academic Calendar Highlights
 *               headline:
 *                 type: string
 *                 example: Stay Updated This Semester
 *               summary:
 *                 type: string
 *                 example: Check important enrollment and advising dates.
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file upload.
 *     responses:
 *       "201":
 *         description: Content created successfully
 *       "400":
 *         description: Bad request - missing required fields or invalid field types
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "403":
 *         description: Forbidden - only admins can create content
 *       "413":
 *         description: Uploaded image file is too large
 *       "500":
 *         description: Internal server error
 */
router.post(
  "/content-management",
  heronAuthMiddlewareAdmin,
  parseContentImageUpload,
  asyncHandler(contentManagementController.handleCreateContent.bind(contentManagementController)),
);

/**
 * @openapi
 * /content-management:
 *   get:
 *     summary: Fetch all promotional content
 *     description: Retrieves all content management records.
 *     tags:
 *       - Content Management
 *     responses:
 *       "200":
 *         description: Content fetched successfully
 *       "400":
 *         description: Bad request - missing user info
 *       "500":
 *         description: Internal server error
 */
router.get(
  "/content-management",
  asyncHandler(contentManagementController.handleFetchAllContent.bind(contentManagementController)),
);

/**
 * @openapi
 * /content-management/{contentId}:
 *   patch:
 *     summary: Update promotional content
 *     description: |
 *       Updates an existing promotional content record.
 *
 *       **Authorization Requirements:**
 *       - **Admins/Super Admins**: Allowed
 *       - **Counselors/Students**: Forbidden
 *
 *       **Image Input:**
 *       - Supports `multipart/form-data` image file upload via `image` field
 *       - Or accepts an `image` URL string in request body
 *     tags:
 *       - Content Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content record ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Academic Calendar Highlights
 *               headline:
 *                 type: string
 *                 example: Updated Advising Schedule
 *               summary:
 *                 type: string
 *                 example: Updated enrollment and advising timeline.
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file upload.
 *     responses:
 *       "200":
 *         description: Content updated successfully
 *       "400":
 *         description: Bad request - invalid input fields or missing update data
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "403":
 *         description: Forbidden - only admins can update content
 *       "404":
 *         description: Content not found
 *       "413":
 *         description: Uploaded image file is too large
 *       "500":
 *         description: Internal server error
 */
router.patch(
  "/content-management/:contentId",
  heronAuthMiddlewareAdmin,
  parseContentImageUpload,
  asyncHandler(contentManagementController.handleUpdateContent.bind(contentManagementController)),
);

/**
 * @openapi
 * /content-management/{contentId}:
 *   delete:
 *     summary: Delete promotional content
 *     description: |
 *       Deletes an existing promotional content record.
 *
 *       **Authorization Requirements:**
 *       - **Admins/Super Admins**: Allowed
 *       - **Counselors/Students**: Forbidden
 *     tags:
 *       - Content Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content record ID to delete
 *     responses:
 *       "200":
 *         description: Content deleted successfully
 *       "400":
 *         description: Bad request - missing content ID or user info
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "403":
 *         description: Forbidden - only admins can delete content
 *       "404":
 *         description: Content not found
 *       "500":
 *         description: Internal server error
 */
router.delete(
  "/content-management/:contentId",
  heronAuthMiddlewareAdmin,
  asyncHandler(contentManagementController.handleDeleteContent.bind(contentManagementController)),
);

export default router;
