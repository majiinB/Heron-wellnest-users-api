import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../interface/authRequest.interface.js";
import type { ApiResponse } from "../types/apiResponse.type.js";
import { AppError } from "../types/appError.type.js";
import { CollegeDepartmentService } from "../services/collegeDepartment.service.js";

export class CollegeDepartmentController {
  private collegeDepartmentService: CollegeDepartmentService;

  constructor(collegeDepartmentService: CollegeDepartmentService) {
    this.collegeDepartmentService = collegeDepartmentService;
  }

  /**
   * Fetch all college departments
   */
  public async handleFetchAllDepartments(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    const result = await this.collegeDepartmentService.getAllDepartments();

    const response: ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "College departments fetched successfully.",
      data: result,
    };

    res.status(200).json(response);
  }
}
