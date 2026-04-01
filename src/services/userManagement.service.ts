import type { CounselorRepository } from "../repository/counselor.repository.js";
import type { StudentRepository } from "../repository/student.repository.js";
import type { AdminRepository } from "../repository/admin.repository.js";
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

  constructor(
    counselorRepository: CounselorRepository,
    studentRepository: StudentRepository,
    adminRepository: AdminRepository
  ) {
    this.counselorRepository = counselorRepository;
    this.studentRepository = studentRepository;
    this.adminRepository = adminRepository;
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
    return this.adminRepository.create(user_name, email, password, is_super_admin);
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
}
