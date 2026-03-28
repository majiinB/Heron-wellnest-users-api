import type { CollegeDepartmentRepository } from "../repository/collegeDepartment.repository.js";
import type { CollegeDepartment } from "../types/collegeDepartment.type.js";

export class CollegeDepartmentService {
  private collegeDepartmentRepository: CollegeDepartmentRepository;

  constructor(collegeDepartmentRepository: CollegeDepartmentRepository) {
    this.collegeDepartmentRepository = collegeDepartmentRepository;
  }

  /**
   * Get all active college departments
   * @returns Array of all college departments
   */
  public async getAllDepartments(): Promise<CollegeDepartment[]> {
    return this.collegeDepartmentRepository.findAll();
  }
}
