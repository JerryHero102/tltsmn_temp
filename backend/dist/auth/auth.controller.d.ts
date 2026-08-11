import type { Response } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: {
        id_system?: string;
        idSystem?: string;
        password?: string;
        pass?: string;
    }, res: Response): Promise<{
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
    getProfile(req: any): Promise<any>;
    logout(res: Response): Promise<{
        message: string;
    }>;
}
