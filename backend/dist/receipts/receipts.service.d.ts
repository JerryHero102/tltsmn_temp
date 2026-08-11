import { DatabaseService } from '../database/database.service';
export declare class ReceiptsService {
    private readonly dbService;
    constructor(dbService: DatabaseService);
    uploadImage(fileBase64: string): Promise<string>;
    findAll(): Promise<any[]>;
    getTuitionMatrix(): Promise<{
        stt: number;
        id_profile: any;
        fullname: any;
        schedule: any;
        phone_number: any;
        months: Record<number, any>;
    }[]>;
    create(dto: {
        id_profile: string;
        payer_name: string;
        month: number;
        receipt_date: string;
        amount?: number;
        payment_content?: string;
        schedule_note?: string;
        image_url: string;
    }): Promise<any>;
}
