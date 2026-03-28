import type { CounselorRepository } from "../repository/counselor.repository.js";
import type { StudentRepository } from "../repository/student.repository.js";
import type { AdminRepository } from "../repository/admin.repository.js";
import type { PaginatedCounselors } from "../types/counselor.type.js";
import type { PaginatedStudents } from "../types/student.type.js";
import type { Admin } from "../types/admin.type.js";
import type { Counselor } from "../types/counselor.type.js";

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
}
