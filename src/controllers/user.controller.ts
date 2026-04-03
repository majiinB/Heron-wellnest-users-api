import type {Response, NextFunction } from "express";
import { UserService } from "../services/user.service.js";
import type { AuthenticatedRequest } from "../interface/authRequest.interface.js";
import type { ClassificationEnum } from "../types/studentClassification.type.js";
import type { ApiResponse } from "../types/apiResponse.type.js";
import { AppError } from "../types/appError.type.js";
import type { DepartmentStatistics } from "../types/departmentStatistics.type.js";

type DepartmentStatisticsFormat = "json" | "raw" | "csv";

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  private escapeCsvValue(value: unknown): string {
    const stringValue = value === null || value === undefined ? "" : String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  private serializeDepartmentStatisticsToCsv(statistics: DepartmentStatistics | DepartmentStatistics[]): string {
    const rows = Array.isArray(statistics) ? statistics : [statistics];
    const headers = [
      "department_name",
      "total_students",
      "excelling_count",
      "thriving_count",
      "struggling_count",
      "in_crisis_count",
      "not_classified_count",
      "excelling_percentage",
      "thriving_percentage",
      "struggling_percentage",
      "in_crisis_percentage",
      "not_classified_percentage",
      "weekly_sentiments",
      "monthly_sentiments"
    ];

    const lines = [headers.join(",")];

    for (const row of rows) {
      lines.push([
        this.escapeCsvValue(row.department_name),
        this.escapeCsvValue(row.total_students),
        this.escapeCsvValue(row.excelling_count),
        this.escapeCsvValue(row.thriving_count),
        this.escapeCsvValue(row.struggling_count),
        this.escapeCsvValue(row.in_crisis_count),
        this.escapeCsvValue(row.not_classified_count),
        this.escapeCsvValue(row.excelling_percentage),
        this.escapeCsvValue(row.thriving_percentage),
        this.escapeCsvValue(row.struggling_percentage),
        this.escapeCsvValue(row.in_crisis_percentage),
        this.escapeCsvValue(row.not_classified_percentage),
        this.escapeCsvValue(JSON.stringify(row.weekly_sentiments ?? [])),
        this.escapeCsvValue(JSON.stringify(row.monthly_sentiments ?? []))
      ].join(","));
    }

    return lines.join("\n");
  }

  public async handleFetchingAllStudents(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const { role, college_department } = req.user ?? {};

    if (!role) {
      throw new AppError(400, "MISSING_USER_INFO", "User role is required.");
    }

    // Get query parameters
    const classification = req.query.classification as ClassificationEnum | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const cursor = req.query.cursor as string | undefined;

    // Counselors can only see their department, admins/super_admins see all
    const departmentFilter = (role === 'counselor' && college_department) ? college_department : undefined;

    const result = await this.userService.getStudents(
      departmentFilter,
      classification,
      limit,
      cursor,
    );

    const response : ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Students fetched successfully.",
      data: result
    }

    res.status(200).json(response);
  }

  public async handleFetchingSpecificStudent(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const studentId = req.params.studentId;
    const { email, password } = req.body ?? {};
    const { role } = req.user ?? {};

    if (!email || !password) {
      throw new AppError(
        400,
        "MISSING_ADMIN_CREDENTIALS",
        "This action requires proper credentials.",
        true
      ) // Stop execution if missing
    }

    const result = await this.userService.getStudentById(email, password, role!, studentId);

    const response : ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Student fetched successfully.",
      data: result
    }

    res.status(200).json(response);
  }

  public async handleFetchingDepartmentStatistics(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const role = req.user?.role;
    let result : DepartmentStatistics | DepartmentStatistics[] | null = null;
    const format = String(req.query.format ?? "json").toLowerCase() as DepartmentStatisticsFormat;

    if (role === "admin" || role === "super_admin") {
      result = await this.userService.getAllDepartmentStatistics();
    } else if (role === "counselor") {
      const departmentName = req.user?.college_department;
      if (!departmentName) {
        throw new AppError(400, "MISSING_DEPARTMENT_INFO", "Department information is required.");
      }
      result = await this.userService.getDepartmentStatistics(departmentName);
    } else {
      throw new AppError(403, "FORBIDDEN_ACCESS", "You do not have permission to access department statistics.");
    }

    if (format === "csv") {
      const csv = this.serializeDepartmentStatisticsToCsv(result ?? []);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=department-statistics.csv");
      res.status(200).send(csv);
      return;
    }

    if (format === "raw") {
      res.status(200).json(result);
      return;
    }

    const response : ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Department statistics fetched successfully.",
      data: result!
    }

    res.status(200).json(response);
  }

  public async handleFetchingAllDepartmentCounselors(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const userRole = req.user?.role;
    const department = req.user?.college_department;

    if (!userRole) {
      throw new AppError(
        400,
        "MISSING_USER_INFO",
        "User role is required.",
        true
      );
    }

    let response : ApiResponse = {
      success: true,
      code: "FETCHED_SUCCESSFULLY",
      message: "Counselors fetched successfully.",
      data: []
    };

    if (userRole === "admin" || userRole === "super_admin") {
      const result = await this.userService.getAllCounselors();
      response = {
        success: true,
        code: "FETCHED_SUCCESSFULLY",
        message: "Counselors fetched successfully.",
        data: result
      };

      res.status(200).json(response);
    }

    if (!department) {
      throw new AppError(
        400,
        "MISSING_DEPARTMENT_INFO",
        "College department information is required.",
        true
      );
    }

    const result = await this.userService.getCounselorByDepartment(department);

    if(userRole === "counselor" || userRole === "student") {
      response = {
        success: true,
        code: "FETCHED_SUCCESSFULLY",
        message: "Counselors fetched successfully.",
        data: result !== null ? result.map(counselor => {
          const counselorWithoutPassword = { ...counselor };
          delete (counselorWithoutPassword as Record<string, unknown>).is_deleted;
          delete (counselorWithoutPassword as Record<string, unknown>).created_at;
          delete (counselorWithoutPassword as Record<string, unknown>).updated_at;
          return counselorWithoutPassword;
        }) : []
      };
    }
    
    res.status(200).json(response);
  }
}