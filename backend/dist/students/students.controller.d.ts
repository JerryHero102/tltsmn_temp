import { StudentsService } from './students.service';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
    create(createStudentDto: {
        fullname: string;
        birth_year: number;
        phone_number?: string;
        gender?: string;
        schedule?: string;
        notes?: string;
        email?: string;
        current_address?: string;
    }): Promise<any>;
    update(id: string, updateStudentDto: {
        fullname?: string;
        birth_year?: number;
        phone_number?: string;
        gender?: string;
        schedule?: string;
        notes?: string;
        email?: string;
        current_address?: string;
    }): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
