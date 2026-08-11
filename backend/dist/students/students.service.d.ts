import { DatabaseService } from '../database/database.service';
export declare class StudentsService {
    private readonly dbService;
    constructor(dbService: DatabaseService);
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
