import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../interface/authRequest.interface.js";
import type { ApiResponse } from "../types/apiResponse.type.js";
import { AppError } from "../types/appError.type.js";
import { UserManagementService } from "../services/userManagement.service.js";

export class UserManagementController {
  private userManagementService: UserManagementService;

  constructor(userManagementService: UserManagementService) {
    this.userManagementService = userManagementService;
  }

  public async handleFetchPaginatedCounselors(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    if (role !== "admin" && role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only admins can access this resource.", true);
    }

    const rawLimit = req.query.limit as string | undefined;
    const limit = rawLimit ? Number.parseInt(rawLimit, 10) : 10;

    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      throw new AppError(400, "INVALID_LIMIT", "Limit must be a number between 1 and 100.", true);
    }

    const cursor = req.query.cursor as string | undefined;

    const result = await this.userManagementService.getPaginatedCounselors(limit, cursor);

    const response: ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Counselors fetched successfully.",
      data: result,
    };

    res.status(200).json(response);
  }

  public async handleFetchPaginatedStudents(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    if (role !== "admin" && role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only admins can access this resource.", true);
    }

    const rawLimit = req.query.limit as string | undefined;
    const limit = rawLimit ? Number.parseInt(rawLimit, 10) : 10;

    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      throw new AppError(400, "INVALID_LIMIT", "Limit must be a number between 1 and 100.", true);
    }

    const cursor = req.query.cursor as string | undefined;

    const result = await this.userManagementService.getPaginatedStudents(limit, cursor);

    const response: ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Students fetched successfully.",
      data: result,
    };

    res.status(200).json(response);
  }

  public async handleFetchPaginatedAdmins(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    if (role !== "admin" && role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only admins can access this resource.", true);
    }

    const rawLimit = req.query.limit as string | undefined;
    const limit = rawLimit ? Number.parseInt(rawLimit, 10) : 10;

    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      throw new AppError(400, "INVALID_LIMIT", "Limit must be a number between 1 and 100.", true);
    }

    const cursor = req.query.cursor as string | undefined;

    const result = await this.userManagementService.getPaginatedAdmins(limit, cursor);

    const response: ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Admins fetched successfully.",
      data: result,
    };

    res.status(200).json(response);
  }

  public async handleCreateAdmin(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    if (role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only super admins can create admins.", true);
    }

    const { user_name, email, password, is_super_admin } = req.body ?? {};

    if (!user_name || !email || !password) {
      throw new AppError(400, "MISSING_REQUIRED_FIELDS", "user_name, email, and password are required.", true);
    }

    if (typeof user_name !== "string" || typeof email !== "string" || typeof password !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "user_name, email, and password must be strings.", true);
    }

    if (is_super_admin !== undefined && typeof is_super_admin !== "boolean") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "is_super_admin must be a boolean when provided.", true);
    }

    const result = await this.userManagementService.addAdmin(
      user_name.trim(),
      email.trim().toLowerCase(),
      password,
      is_super_admin ?? false,
    );

    const response: ApiResponse = {
      success: true,
      code: "CREATED_SUCCESSFULLY",
      message: "Admin created successfully.",
      data: result,
    };

    res.status(201).json(response);
  }

  public async handleCreateCounselor(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    if (role !== "admin" && role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only admins can create counselors.", true);
    }

    const { user_name, email, password, department_id } = req.body ?? {};

    if (!user_name || !email || !password || !department_id) {
      throw new AppError(400, "MISSING_REQUIRED_FIELDS", "user_name, email, password, and department_id are required.", true);
    }

    if (
      typeof user_name !== "string"
      || typeof email !== "string"
      || typeof password !== "string"
      || typeof department_id !== "string"
    ) {
      throw new AppError(400, "INVALID_FIELD_TYPES", "user_name, email, password, and department_id must be strings.", true);
    }

    const result = await this.userManagementService.addCounselor(
      user_name.trim(),
      email.trim().toLowerCase(),
      password,
      department_id.trim(),
    );

    const response: ApiResponse = {
      success: true,
      code: "CREATED_SUCCESSFULLY",
      message: "Counselor created successfully.",
      data: result,
    };

    res.status(201).json(response);
  }

  public async handleUpdateAdmin(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const actorRole = req.user?.role;
    const actorId = req.user?.sub;

    if (!actorRole || !actorId) {
      throw new AppError(400, "MISSING_USER_INFO", "Authenticated user info is required.", true);
    }

    const targetAdminId = req.params.adminId;
    if (!targetAdminId) {
      throw new AppError(400, "MISSING_ADMIN_ID", "Admin ID is required in the route params.", true);
    }

    const { user_name, email } = req.body ?? {};

    if (user_name === undefined && email === undefined) {
      throw new AppError(400, "MISSING_UPDATE_FIELDS", "At least one field must be provided: user_name or email.", true);
    }

    if (user_name !== undefined && typeof user_name !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "user_name must be a string when provided.", true);
    }

    if (email !== undefined && typeof email !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "email must be a string when provided.", true);
    }

    const result = await this.userManagementService.updateAdminBasicInfo(
      actorId,
      actorRole,
      targetAdminId,
      {
        ...(user_name !== undefined ? { user_name: user_name.trim() } : {}),
        ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
      },
    );

    const response: ApiResponse = {
      success: true,
      code: "UPDATED_SUCCESSFULLY",
      message: "Admin information updated successfully.",
      data: result,
    };

    res.status(200).json(response);
  }

  public async handleUpdateAdminPassword(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const actorRole = req.user?.role;
    const actorId = req.user?.sub;

    if (!actorRole || !actorId) {
      throw new AppError(400, "MISSING_USER_INFO", "Authenticated user info is required.", true);
    }

    const targetAdminId = req.params.adminId;
    if (!targetAdminId) {
      throw new AppError(400, "MISSING_ADMIN_ID", "Admin ID is required in the route params.", true);
    }

    const { previous_password, new_password } = req.body ?? {};

    if (!new_password || typeof new_password !== "string") {
      throw new AppError(400, "MISSING_REQUIRED_FIELDS", "new_password is required and must be a string.", true);
    }

    if (previous_password !== undefined && typeof previous_password !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "previous_password must be a string when provided.", true);
    }

    const result = await this.userManagementService.updateAdminPassword(
      actorId,
      actorRole,
      targetAdminId,
      new_password,
      previous_password,
    );

    const response: ApiResponse = {
      success: true,
      code: "UPDATED_SUCCESSFULLY",
      message: "Admin password updated successfully.",
      data: result,
    };

    res.status(200).json(response);
  }

  public async handleUpdateCounselor(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const actorRole = req.user?.role;
    const actorId = req.user?.sub;

    if (!actorRole || !actorId) {
      throw new AppError(400, "MISSING_USER_INFO", "Authenticated user info is required.", true);
    }

    const targetCounselorId = req.params.counselorId;
    if (!targetCounselorId) {
      throw new AppError(400, "MISSING_COUNSELOR_ID", "Counselor ID is required in the route params.", true);
    }

    const { user_name, email, department_id } = req.body ?? {};

    if (user_name === undefined && email === undefined && department_id === undefined) {
      throw new AppError(
        400,
        "MISSING_UPDATE_FIELDS",
        "At least one field must be provided: user_name, email, or department_id.",
        true,
      );
    }

    if (user_name !== undefined && typeof user_name !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "user_name must be a string when provided.", true);
    }

    if (email !== undefined && typeof email !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "email must be a string when provided.", true);
    }

    if (department_id !== undefined && typeof department_id !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "department_id must be a string when provided.", true);
    }

    const result = await this.userManagementService.updateCounselorBasicInfo(
      actorId,
      actorRole,
      targetCounselorId,
      {
        ...(user_name !== undefined ? { user_name: user_name.trim() } : {}),
        ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
        ...(department_id !== undefined ? { department_id: department_id.trim() } : {}),
      },
    );

    const response: ApiResponse = {
      success: true,
      code: "UPDATED_SUCCESSFULLY",
      message: "Counselor information updated successfully.",
      data: result,
    };

    res.status(200).json(response);
  }

  public async handleUpdateCounselorPassword(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const actorRole = req.user?.role;
    const actorId = req.user?.sub;

    if (!actorRole || !actorId) {
      throw new AppError(400, "MISSING_USER_INFO", "Authenticated user info is required.", true);
    }

    const targetCounselorId = req.params.counselorId;
    if (!targetCounselorId) {
      throw new AppError(400, "MISSING_COUNSELOR_ID", "Counselor ID is required in the route params.", true);
    }

    const { previous_password, new_password } = req.body ?? {};

    if (!new_password || typeof new_password !== "string") {
      throw new AppError(400, "MISSING_REQUIRED_FIELDS", "new_password is required and must be a string.", true);
    }

    if (previous_password !== undefined && typeof previous_password !== "string") {
      throw new AppError(400, "INVALID_FIELD_TYPES", "previous_password must be a string when provided.", true);
    }

    const result = await this.userManagementService.updateCounselorPassword(
      actorId,
      actorRole,
      targetCounselorId,
      new_password,
      previous_password,
    );

    const response: ApiResponse = {
      success: true,
      code: "UPDATED_SUCCESSFULLY",
      message: "Counselor password updated successfully.",
      data: result,
    };

    res.status(200).json(response);
  }

  public async handleDeleteCounselor(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const actorRole = req.user?.role;
    const actorId = req.user?.sub;

    if (!actorRole || !actorId) {
      throw new AppError(400, "MISSING_USER_INFO", "Authenticated user info is required.", true);
    }

    const targetCounselorId = req.params.counselorId;
    if (!targetCounselorId) {
      throw new AppError(400, "MISSING_COUNSELOR_ID", "Counselor ID is required in the route params.", true);
    }

    const result = await this.userManagementService.deleteCounselor(
      actorId,
      actorRole,
      targetCounselorId,
    );

    const response: ApiResponse = {
      success: true,
      code: "DELETED_SUCCESSFULLY",
      message: "Counselor deleted successfully.",
      data: result,
    };

    res.status(200).json(response);
  }
}
