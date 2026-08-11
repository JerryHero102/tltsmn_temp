import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
export declare class AuthService {
    private readonly dbService;
    private readonly jwtService;
    constructor(dbService: DatabaseService, jwtService: JwtService);
    validateUser(id_system_or_phone: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            id_system: any;
            phone_number: any;
            role: any;
            profile: {
                id: any;
                fullname: any;
                email: any;
                gender: any;
                schedule: any;
                notes: any;
                birth_year: any;
            };
        };
    }>;
    getProfile(userId: string): Promise<{
        id: any;
        id_system: any;
        phone_number: any;
        role: any;
        profile: {
            id: any;
            fullname: any;
            email: any;
            gender: any;
            schedule: any;
            notes: any;
            birth_year: any;
        };
    }>;
}
