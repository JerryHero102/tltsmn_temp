import { StudentsService } from './students.service';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    findAll(location?: string): Promise<any[]>;
    findOne(id: string): Promise<any>;
    create(createStudentDto: {
        fullname: string;
        birth_year: number;
        phone_number?: string;
        gender?: string;
        schedule?: string;
        notes?: string;
        email?: string;
        location?: string;
        current_address?: string;
        date_of_join?: string;
        current_level?: number | string;
    }): Promise<any>;
    update(id: string, updateStudentDto: {
        fullname?: string;
        birth_year?: number;
        phone_number?: string;
        gender?: string;
        schedule?: string;
        notes?: string;
        email?: string;
        location?: string;
        current_address?: string;
        date_of_join?: string;
        current_level?: number | string;
    }): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
