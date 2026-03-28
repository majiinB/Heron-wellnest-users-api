import type { CollegeProgramRepository } from "../repository/collegeProgram.repository.js";
import type { CollegeProgram } from "../types/collegeProgram.type.js";

export class CollegeProgramService {
  private collegeProgramRepository: CollegeProgramRepository;

  constructor(collegeProgramRepository: CollegeProgramRepository) {
    this.collegeProgramRepository = collegeProgramRepository;
  }

  /**
   * Get all active college programs
   * @returns Array of all college programs
   */
  public async getAllPrograms(): Promise<CollegeProgram[]> {
    return this.collegeProgramRepository.findAll();
  }

  /**
   * Get all active college programs under a specific department
   * @param departmentId - The department ID to filter programs by
   * @returns Array of programs in the specified department
   */
  public async getProgramsByDepartment(departmentId: string): Promise<CollegeProgram[]> {
    return this.collegeProgramRepository.findByDepartment(departmentId);
  }
}
