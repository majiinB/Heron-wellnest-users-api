import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../interface/authRequest.interface.js";
import type { ApiResponse } from "../types/apiResponse.type.js";
import { AppError } from "../types/appError.type.js";
import { CollegeProgramService } from "../services/collegeProgram.service.js";

export class CollegeProgramController {
  private collegeProgramService: CollegeProgramService;

  constructor(collegeProgramService: CollegeProgramService) {
    this.collegeProgramService = collegeProgramService;
  }

  /**
   * Fetch all college programs
   */
  public async handleFetchAllPrograms(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    const result = await this.collegeProgramService.getAllPrograms();

    const response: ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "College programs fetched successfully.",
      data: result,
    };

    res.status(200).json(response);
  }

  /**
   * Fetch college programs under a specific department
   */
  public async handleFetchProgramsByDepartment(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.", true);
    }

    const departmentId = req.params.departmentId as string | undefined;

    if (!departmentId) {
      throw new AppError(400, "MISSING_DEPARTMENT_ID", "Department ID is required.", true);
    }

    const result = await this.collegeProgramService.getProgramsByDepartment(departmentId);

    const response: ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "College programs fetched successfully.",
      data: result,
    };

    res.status(200).json(response);
  }
}
