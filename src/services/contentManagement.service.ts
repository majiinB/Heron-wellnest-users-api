import type { ContentManagementRepository } from "../repository/contentManagement.repository.js";
import type {
  ContentManagementItem,
  CreateContentManagementPayload,
  UpdateContentManagementPayload,
  ContentManagementImageInput,
  ImageUploadResponse,
} from "../types/contentManagement.type.js";
import { AppError } from "../types/appError.type.js";
import {
  MAX_CONTENT_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  detectImageMimeType,
  extensionFromMimeType,
  generateImageHash,
} from "../utils/imageUpload.util.js";
import { uploadBufferToGcs, objectExistsInGcs, getPublicUrl } from "../config/cloudStorage.config.js";

export class ContentManagementService {
  private contentManagementRepository: ContentManagementRepository;

  constructor(contentManagementRepository: ContentManagementRepository) {
    this.contentManagementRepository = contentManagementRepository;
  }

  public async createContent(payload: CreateContentManagementPayload): Promise<ContentManagementItem> {
    return this.contentManagementRepository.create(payload);
  }

  public async getAllContent(): Promise<ContentManagementItem[]> {
    return this.contentManagementRepository.findAll();
  }

  public async updateContent(contentId: string, payload: UpdateContentManagementPayload): Promise<ContentManagementItem> {
    const existing = await this.contentManagementRepository.findById(contentId);

    if (!existing) {
      throw new AppError(404, "CONTENT_NOT_FOUND", "Content not found.", true);
    }

    const updated = await this.contentManagementRepository.update(contentId, payload);

    if (!updated) {
      throw new AppError(500, "UPDATE_FAILED", "Failed to update content.", true);
    }

    return updated;
  }

  public async deleteContent(contentId: string): Promise<ContentManagementItem> {
    const existing = await this.contentManagementRepository.findById(contentId);

    if (!existing) {
      throw new AppError(404, "CONTENT_NOT_FOUND", "Content not found.", true);
    }

    const deleted = await this.contentManagementRepository.delete(contentId);

    if (!deleted) {
      throw new AppError(500, "DELETE_FAILED", "Failed to delete content.", true);
    }

    return deleted;
  }

  public async uploadContentImage(imageFile: ContentManagementImageInput): Promise<ImageUploadResponse> {
    // Validate image buffer
    if (!imageFile?.buffer || imageFile.buffer.length === 0) {
      throw new AppError(
        400,
        "IMAGE_FILE_MISSING",
        "Image file is required for content upload.",
        true,
      );
    }

    // Validate image size
    const imageSize = imageFile.size ?? imageFile.buffer.length;
    if (imageSize > MAX_CONTENT_IMAGE_SIZE_BYTES) {
      throw new AppError(
        413,
        "IMAGE_FILE_TOO_LARGE",
        `Image file must not exceed ${MAX_CONTENT_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`,
        true,
      );
    }

    // Validate MIME type from request
    if (!imageFile.mimetype || !ALLOWED_IMAGE_MIME_TYPES.includes(imageFile.mimetype)) {
      throw new AppError(
        400,
        "INVALID_IMAGE_MIMETYPE",
        `Uploaded file must be one of: ${ALLOWED_IMAGE_MIME_TYPES.join(", ")}.`,
        true,
      );
    }

    // Detect MIME type from file signature
    const detectedMimeType = detectImageMimeType(imageFile.buffer);
    if (!detectedMimeType) {
      throw new AppError(
        400,
        "INVALID_IMAGE_FILE",
        "Uploaded file is not a valid image format.",
        true,
      );
    }

    // Verify detected MIME type matches allowed types
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(detectedMimeType)) {
      throw new AppError(
        400,
        "UNSUPPORTED_IMAGE_FORMAT",
        `Detected image format is not supported.`,
        true,
      );
    }

    // Generate image hash
    const imageHash = generateImageHash(imageFile.buffer);
    const extension = extensionFromMimeType(detectedMimeType);
    const objectPath = `promotional-content-images/${imageHash}.${extension}`;

    // Check if image already exists
    const imageAlreadyUploaded = await objectExistsInGcs(objectPath);
    if (imageAlreadyUploaded) {
      const publicUrl = getPublicUrl(objectPath);
      return {
        success: true,
        code: "CONTENT_IMAGE_ALREADY_UPLOADED",
        message: "This image was already uploaded.",
        data: {
          image_url: publicUrl,
          content_type: detectedMimeType,
          size_bytes: imageSize,
          duplicate: true,
        },
      };
    }

    // Upload image to GCS
    await uploadBufferToGcs({
      buffer: imageFile.buffer,
      destination: objectPath,
      contentType: detectedMimeType,
      metadata: {
        metadata: {
          upload_purpose: "content_management_image",
          image_hash_sha256: imageHash,
          source_file_name: imageFile.originalName ?? "unknown",
        },
      },
    });

    // Get public URL for the uploaded image
    const publicUrl = getPublicUrl(objectPath);

    return {
      success: true,
      code: "CONTENT_IMAGE_UPLOADED",
      message: "Content image uploaded successfully.",
      data: {
        image_url: publicUrl,
        content_type: detectedMimeType,
        size_bytes: imageSize,
        duplicate: false,
      },
    };
  }
}
