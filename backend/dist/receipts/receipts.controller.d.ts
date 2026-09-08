import { ReceiptsService } from './receipts.service';
export declare class ReceiptsController {
    private readonly receiptsService;
    constructor(receiptsService: ReceiptsService);
    findAll(location?: string): Promise<any[]>;
    getMatrix(location?: string): Promise<{
        stt: number;
        id_profile: any;
        fullname: any;
        schedule: any;
        phone_number: any;
        date_of_join: any;
        location: any;
        months: Record<number, any>;
    }[]>;
    uploadImage(base64Image: string): Promise<{
        url: string;
    }>;
    create(body: {
        id_profile: string;
        payer_name: string;
        month: number;
        receipt_date: string;
        amount?: number;
        payment_content?: string;
        schedule_note?: string;
        image_url?: string;
        base64Image?: string;
    }): Promise<any>;
}
