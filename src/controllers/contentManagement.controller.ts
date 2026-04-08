import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest, AuthenticatedRequestWithFile } from "../interface/authRequest.interface.js";
import type { ApiResponse } from "../types/apiResponse.type.js";
import { AppError } from "../types/appError.type.js";
import { ContentManagementService } from "../services/contentManagement.service.js";

export class ContentManagementController {
  private contentManagementService: ContentManagementService;

  constructor(contentManagementService: ContentManagementService) {
    this.contentManagementService = contentManagementService;
  }

  public async handleCreateContent(req: AuthenticatedRequestWithFile, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    if (role !== "admin" && role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only admins can create content.", true);
    }

    const { title, headline, image, summary } = req.body ?? {};

    if (!title || !headline || !summary) {
      throw new AppError(400, "MISSING_REQUIRED_FIELDS", "title, headline, and summary are required.", true);
    }

    if (
      typeof title !== "string"
      || typeof headline !== "string"
      || typeof summary !== "string"
    ) {
      throw new AppError(400, "INVALID_FIELD_TYPES", "title, headline, and summary must be strings.", true);
    }

    // Handle image: either from file upload or string URL
    let imageUrl = "";

    if (req.file) {
      // Upload image file to GCS
      const uploadResponse = await this.contentManagementService.uploadContentImage({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        size: req.file.size,
        originalName: req.file.originalname,
      });
      imageUrl = uploadResponse.data.image_url;
    } else if (image && typeof image === "string") {
      // Use provided image URL string
      imageUrl = image.trim();
    } else {
      throw new AppError(
        400,
        "MISSING_IMAGE",
        "Please provide either an image file or an image URL.",
        true,
      );
    }

    const result = await this.contentManagementService.createContent({
      title: title.trim(),
      headline: headline.trim(),
      image: imageUrl,
      summary: summary.trim(),
    });

    const response: ApiResponse = {
      success: true,
      code: "CREATED_SUCCESSFULLY",
      message: "Content created successfully.",
      data: result,
    };

    res.status(201).json(response);
  }

  public async handleFetchAllContent(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {

    const result = await this.contentManagementService.getAllContent();

    const response: ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Content fetched successfully.",
      data: result,
    };

    res.status(200).json(response);
  }

  public async handleUpdateContent(req: AuthenticatedRequestWithFile, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    if (role !== "admin" && role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only admins can update content.", true);
    }

    const contentId = req.params.contentId;
    if (!contentId) {
      throw new AppError(400, "MISSING_CONTENT_ID", "Content ID is required in the route params.", true);
    }

    const { title, headline, image, summary } = req.body ?? {};

    if (
      title === undefined
      && headline === undefined
      && image === undefined
      && summary === undefined
      && !req.file
    ) {
      throw new AppError(
        400,
        "MISSING_REQUIRED_FIELDS",
        "At least one of title, headline, image, summary must be provided, or an image file must be uploaded.",
        true,
      );
    }

    if (title !== undefined && typeof title !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "title must be a string when provided.", true);
    }

    if (headline !== undefined && typeof headline !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "headline must be a string when provided.", true);
    }

    if (image !== undefined && typeof image !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "image must be a string when provided.", true);
    }

    if (summary !== undefined && typeof summary !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "summary must be a string when provided.", true);
    }

    // Handle image: either from file upload or string URL
    let imageUrl: string | undefined;

    if (req.file) {
      // Upload image file to GCS
      const uploadResponse = await this.contentManagementService.uploadContentImage({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        size: req.file.size,
        originalName: req.file.originalname,
      });
      imageUrl = uploadResponse.data.image_url;
    } else if (image !== undefined && typeof image === "string") {
      // Use provided image URL string
      imageUrl = image.trim();
    }

    const result = await this.contentManagementService.updateContent(contentId, {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(headline !== undefined ? { headline: headline.trim() } : {}),
      ...(imageUrl !== undefined ? { image: imageUrl } : {}),
      ...(summary !== undefined ? { summary: summary.trim() } : {}),
    });

    const response: ApiResponse = {
      success: true,
      code: "UPDATED_SUCCESSFULLY",
      message: "Content updated successfully.",
      data: result,
    };

    res.status(200).json(response);
  }

  public async handleDeleteContent(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    if (role !== "admin" && role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only admins can delete content.", true);
    }

    const contentId = req.params.contentId;
    if (!contentId) {
      throw new AppError(400, "MISSING_CONTENT_ID", "Content ID is required in the route params.", true);
    }

    const result = await this.contentManagementService.deleteContent(contentId);

    const response: ApiResponse = {
      success: true,
      code: "DELETED_SUCCESSFULLY",
      message: "Content deleted successfully.",
      data: result,
    };

    res.status(200).json(response);
  }

  public async handleUploadContentImage(
    req: AuthenticatedRequestWithFile,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    if (role !== "admin" && role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only admins can upload content images.", true);
    }

    if (!req.file) {
      throw new AppError(
        400,
        "IMAGE_FILE_MISSING",
        "Please provide an image file in the request.",
        true,
      );
    }

    const response = await this.contentManagementService.uploadContentImage({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      size: req.file.size,
      originalName: req.file.originalname,
    });

    res.status(200).json(response);
  }
}
