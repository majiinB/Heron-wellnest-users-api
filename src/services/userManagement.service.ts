import type { CounselorRepository } from "../repository/counselor.repository.js";
import type { StudentRepository } from "../repository/student.repository.js";
import type { PaginatedCounselors } from "../types/counselor.type.js";
import type { PaginatedStudents } from "../types/student.type.js";

export class UserManagementService {
  private counselorRepository: CounselorRepository;
  private studentRepository: StudentRepository;

  constructor(counselorRepository: CounselorRepository, studentRepository: StudentRepository) {
    this.counselorRepository = counselorRepository;
    this.studentRepository = studentRepository;
  }

  public async getPaginatedCounselors(limit = 10, cursor?: string): Promise<PaginatedCounselors> {
    return this.counselorRepository.findAllWithoutPasswordPaginated(limit, cursor);
  }

  public async getPaginatedStudents(limit = 10, cursor?: string): Promise<PaginatedStudents> {
    return this.studentRepository.findAllPaginated(limit, cursor);
  }
}
