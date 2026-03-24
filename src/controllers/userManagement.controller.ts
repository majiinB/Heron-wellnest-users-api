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
}
