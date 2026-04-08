/**
 * Content management data shape
 * @file contentManagement.type.ts
 */
export type ContentManagementItem = {
  content_id: string;
  title: string;
  headline: string;
  image: string;
  summary: string;
  created_at: Date;
};

export type CreateContentManagementPayload = {
  title: string;
  headline: string;
  image: string;
  summary: string;
};

export type UpdateContentManagementPayload = {
  title?: string;
  headline?: string;
  image?: string;
  summary?: string;
};

/**
 * Input type for image file upload
 */
export type ContentManagementImageInput = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalName: string;
};

/**
 * Response type for image upload operation
 */
export type ImageUploadResponse = {
  success: boolean;
  code: string;
  message: string;
  data: {
    image_url: string;
    content_type: string;
    size_bytes: number;
    duplicate?: boolean;
  };
};


