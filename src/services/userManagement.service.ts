import type { CounselorRepository } from "../repository/counselor.repository.js";
import type { StudentRepository } from "../repository/student.repository.js";
import type { AdminRepository } from "../repository/admin.repository.js";
import type { CollegeDepartmentRepository } from "../repository/collegeDepartment.repository.js";
import type { PaginatedCounselors } from "../types/counselor.type.js";
import type { PaginatedStudents } from "../types/student.type.js";
import type { PaginatedAdmins } from "../types/admin.type.js";
import type { Admin } from "../types/admin.type.js";
import type { Counselor } from "../types/counselor.type.js";
import { AppError } from "../types/appError.type.js";
import { comparePassword, hashPassword } from "../utils/crypt.util.js";
import { logger } from "../utils/logger.util.js";

export class UserManagementService {
  private counselorRepository: CounselorRepository;
  private studentRepository: StudentRepository;
  private adminRepository: AdminRepository;
  private collegeDepartmentRepository: CollegeDepartmentRepository;

  constructor(
    counselorRepository: CounselorRepository,
    studentRepository: StudentRepository,
    adminRepository: AdminRepository,
    collegeDepartmentRepository: CollegeDepartmentRepository
  ) {
    this.counselorRepository = counselorRepository;
    this.studentRepository = studentRepository;
    this.adminRepository = adminRepository;
    this.collegeDepartmentRepository = collegeDepartmentRepository;
  }

  public async getPaginatedCounselors(limit = 10, cursor?: string): Promise<PaginatedCounselors> {
    return this.counselorRepository.findAllWithoutPasswordPaginated(limit, cursor);
  }

  public async getPaginatedStudents(limit = 10, cursor?: string): Promise<PaginatedStudents> {
    return this.studentRepository.findAllPaginated(limit, cursor);
  }

  public async getPaginatedAdmins(limit = 10, cursor?: string): Promise<PaginatedAdmins> {
    return this.adminRepository.findAllWithoutPasswordPaginated(limit, cursor);
  }

  /**
   * Add a new admin
   * @param user_name - Admin's name
   * @param email - Admin's email
   * @param password - Plain text password (will be hashed)
   * @param is_super_admin - Whether this admin should be a super admin
   * @returns The created admin without password
   */
  public async addAdmin(
    user_name: string,
    email: string,
    password: string,
    is_super_admin: boolean = false
  ): Promise<Omit<Admin, 'password'> | null> {
    try {
      return this.adminRepository.create(user_name, email, password, is_super_admin);
    } catch (error) {
      if (error instanceof AppError && error.code === "EMAIL_ALREADY_EXISTS") {
        throw error; // Re-throw known AppError for email conflict
      }
      logger.error("Failed to create admin", { error });
      throw new AppError(500, "ADMIN_CREATION_FAILED", "Failed to create admin due to an internal error.", true);
    }
  }

  /**
   * Add a new counselor
   * @param user_name - Counselor's name
   * @param email - Counselor's email
   * @param password - Plain text password (will be hashed)
   * @param department_id - The department ID the counselor belongs to
   * @returns The created counselor without password
   */
  public async addCounselor(
    user_name: string,
    email: string,
    password: string,
    department_id: string
  ): Promise<Omit<Counselor, 'password'> | null> {
    return this.counselorRepository.create(user_name, email, password, department_id);
  }

  public async updateAdminBasicInfo(
    actorId: string,
    actorRole: string,
    targetAdminId: string,
    payload: {
      user_name?: string;
      email?: string;
    }
  ): Promise<Omit<Admin, 'password'> | null> {
    if (actorRole !== "admin" && actorRole !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only admins can update admin information.", true);
    }

    const targetAdmin = await this.adminRepository.findByIdWithoutPassword(targetAdminId);
    if (!targetAdmin) {
      throw new AppError(404, "ADMIN_NOT_FOUND", "Admin not found.", true);
    }

    if (actorRole === "admin" && actorId !== targetAdminId) {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Admins can only edit their own information.", true);
    }

    if (actorRole === "super_admin" && actorId !== targetAdminId && targetAdmin.is_super_admin) {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Super admins cannot edit other super admins.", true);
    }

    if (payload.email) {
      const existingAdmin = await this.adminRepository.findByEmailWithoutPassword(payload.email);
      if (existingAdmin && existingAdmin.user_id !== targetAdminId) {
        throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email is already in use by another admin.", true);
      }
    }

    const updated = await this.adminRepository.updateBasicInfo(targetAdminId, payload);
    if (!updated) {
      throw new AppError(500, "UPDATE_FAILED", "Failed to update admin information.", true);
    }

    return updated;
  }

  public async updateAdminPassword(
    actorId: string,
    actorRole: string,
    targetAdminId: string,
    newPassword: string,
    previousPassword?: string
  ): Promise<Omit<Admin, 'password'> | null> {
    if (actorRole !== "admin" && actorRole !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only admins can update admin passwords.", true);
    }

    const targetAdmin = await this.adminRepository.findById(targetAdminId);
    if (!targetAdmin) {
      throw new AppError(404, "ADMIN_NOT_FOUND", "Admin not found.", true);
    }

    if (actorRole === "admin") {
      if (actorId !== targetAdminId) {
        throw new AppError(403, "FORBIDDEN_ACCESS", "Admins can only change their own password.", true);
      }

      if (!previousPassword) {
        throw new AppError(400, "PREVIOUS_PASSWORD_REQUIRED", "Previous password is required.", true);
      }

      const isPreviousPasswordValid = await comparePassword(previousPassword, targetAdmin.password);
      if (!isPreviousPasswordValid) {
        throw new AppError(401, "INVALID_PREVIOUS_PASSWORD", "Previous password is incorrect.", true);
      }
    }

    if (actorRole === "super_admin" && actorId !== targetAdminId && targetAdmin.is_super_admin) {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Super admins cannot change other super admins' passwords.", true);
    }

    const hashedPassword = await hashPassword(newPassword);
    const updated = await this.adminRepository.updatePassword(targetAdminId, hashedPassword);

    if (!updated) {
      throw new AppError(500, "PASSWORD_UPDATE_FAILED", "Failed to update admin password.", true);
    }

    if (actorRole === "super_admin" && actorId !== targetAdminId) {
      // TODO: Push a message to Pub/Sub notification worker for admin password change alert.
      logger.info("Placeholder: notify admin of super-admin initiated password change", {
        actorId,
        targetAdminId,
      });
    }

    return updated;
  }

  public async updateCounselorBasicInfo(
    actorId: string,
    actorRole: string,
    targetCounselorId: string,
    payload: {
      user_name?: string;
      email?: string;
      department_id?: string;
    }
  ): Promise<Omit<Counselor, 'password'> | null> {
    if (actorRole !== "counselor" && actorRole !== "admin" && actorRole !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only counselors and admins can update counselor information.", true);
    }

    const targetCounselor = await this.counselorRepository.findByIdWithoutPassword(targetCounselorId);
    if (!targetCounselor) {
      throw new AppError(404, "COUNSELOR_NOT_FOUND", "Counselor not found.", true);
    }

    if (actorRole === "counselor" && actorId !== targetCounselorId) {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Counselors can only edit their own information.", true);
    }

    if (payload.email) {
      const existingCounselor = await this.counselorRepository.findByEmailWithoutPassword(payload.email);
      if (existingCounselor && existingCounselor.user_id !== targetCounselorId) {
        throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email is already in use by another counselor.", true);
      }
    }

    if (payload.department_id) {
      const departmentExists = await this.collegeDepartmentRepository.existsById(payload.department_id);
      if (!departmentExists) {
        throw new AppError(400, "INVALID_DEPARTMENT_ID", "department_id does not exist.", true);
      }
    }

    const updated = await this.counselorRepository.updateBasicInfo(targetCounselorId, payload);
    if (!updated) {
      throw new AppError(500, "UPDATE_FAILED", "Failed to update counselor information.", true);
    }

    if ((actorRole === "admin" || actorRole === "super_admin") && actorId !== targetCounselorId) {
      // TODO: Push a message to Pub/Sub notification worker for counselor info change alert.
      logger.info("Placeholder: notify counselor of admin-initiated profile change", {
        actorId,
        actorRole,
        targetCounselorId,
      });
    }

    return updated;
  }

  public async updateCounselorPassword(
    actorId: string,
    actorRole: string,
    targetCounselorId: string,
    newPassword: string,
    previousPassword?: string
  ): Promise<Omit<Counselor, 'password'> | null> {
    if (actorRole !== "counselor" && actorRole !== "admin" && actorRole !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only counselors and admins can update counselor passwords.", true);
    }

    if (actorRole === "counselor" && actorId !== targetCounselorId) {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Counselors can only change their own password.", true);
    }

    const targetCounselor = await this.counselorRepository.findById(targetCounselorId);
    if (!targetCounselor) {
      throw new AppError(404, "COUNSELOR_NOT_FOUND", "Counselor not found.", true);
    }

    if (actorRole === "counselor") {
      if (!previousPassword) {
        throw new AppError(400, "PREVIOUS_PASSWORD_REQUIRED", "Previous password is required.", true);
      }

      const isPreviousPasswordValid = await comparePassword(previousPassword, targetCounselor.password);
      if (!isPreviousPasswordValid) {
        throw new AppError(401, "INVALID_PREVIOUS_PASSWORD", "Previous password is incorrect.", true);
      }
    }

    const hashedPassword = await hashPassword(newPassword);
    const updated = await this.counselorRepository.updatePassword(targetCounselorId, hashedPassword);

    if (!updated) {
      throw new AppError(500, "PASSWORD_UPDATE_FAILED", "Failed to update counselor password.", true);
    }

    if ((actorRole === "admin" || actorRole === "super_admin") && actorId !== targetCounselorId) {
      // TODO: Push a message to Pub/Sub notification worker for counselor password change alert.
      logger.info("Placeholder: notify counselor of admin-initiated password change", {
        actorId,
        actorRole,
        targetCounselorId,
      });
    }

    return updated;
  }

  public async deleteCounselor(
    actorId: string,
    actorRole: string,
    targetCounselorId: string
  ): Promise<Omit<Counselor, 'password'> | null> {
    if (actorRole !== "admin" && actorRole !== "super_admin") {
      throw new AppError(403, "FORBIDDEN_ACCESS", "Only admins can delete counselors.", true);
    }

    const targetCounselor = await this.counselorRepository.findByIdWithoutPassword(targetCounselorId);
    if (!targetCounselor) {
      throw new AppError(404, "COUNSELOR_NOT_FOUND", "Counselor not found.", true);
    }

    const deleted = await this.counselorRepository.softDeleteById(targetCounselorId);
    if (!deleted) {
      throw new AppError(500, "DELETE_FAILED", "Failed to delete counselor.", true);
    }

    // TODO: Push a message to Pub/Sub notification worker for counselor account deletion alert.
    logger.info("Placeholder: notify counselor of admin-initiated account deletion", {
      actorId,
      actorRole,
      targetCounselorId,
    });

    return deleted;
  }
}
