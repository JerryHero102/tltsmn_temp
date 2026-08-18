"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptsService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
const database_service_1 = require("../database/database.service");
function formatCloudinaryOptimizedUrl(url) {
    if (!url)
        return '';
    if (url.includes('/image/upload/') && !url.includes('/f_auto')) {
        return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
    }
    return url;
}
let ReceiptsService = class ReceiptsService {
    dbService;
    constructor(dbService) {
        this.dbService = dbService;
        const rawUrl = process.env.CLOUDINARY_URL || 'cloudinary://244577781153212:cAZDShDf1I95YSzdJjvb5jdbSgU@sxotasqj';
        let configObj = {
            cloud_name: 'sxotasqj',
            api_key: '244577781153212',
            api_secret: 'cAZDShDf1I95YSzdJjvb5jdbSgU',
        };
        const match = rawUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
        if (match) {
            configObj = {
                api_key: match[1],
                api_secret: match[2],
                cloud_name: match[3],
            };
        }
        cloudinary_1.v2.config({
            ...configObj,
            secure: true,
        });
    }
    async uploadImage(fileBase64) {
        if (!fileBase64)
            return '';
        try {
            const res = await cloudinary_1.v2.uploader.upload(fileBase64, {
                folder: 'tltsmn_receipts',
            });
            return formatCloudinaryOptimizedUrl(res.secure_url);
        }
        catch (err) {
            console.warn('Cloudinary upload warning:', err.message || err);
            if (fileBase64.startsWith('data:image')) {
                return fileBase64;
            }
            return fileBase64;
        }
    }
    async findAll() {
        const res = await this.dbService.query(`SELECT 
        r.id,
        r.amount,
        TO_CHAR(r.receipt_date, 'YYYY-MM-DD') as receipt_date,
        r.month,
        r.payer_name,
        r.phone_number,
        r.payment_content,
        r.schedule_note,
        r.image_url,
        r.created_at,
        pr.id_profile
       FROM receipts r
       LEFT JOIN profile_receipts pr ON pr.id_receipt = r.id
       ORDER BY r.receipt_date DESC, r.created_at DESC`);
        return res.rows.map((row) => ({
            ...row,
            image_url: formatCloudinaryOptimizedUrl(row.image_url),
        }));
    }
    async getTuitionMatrix() {
        const profilesRes = await this.dbService.query(`SELECT p.id, p.fullname, p.schedule, p.phone_number, TO_CHAR(p.date_of_join, 'YYYY-MM-DD') as date_of_join
       FROM profile p
       WHERE p.id_auth IS NULL
       ORDER BY p.fullname ASC`);
        const receiptsRes = await this.dbService.query(`SELECT pr.id_profile, r.id as receipt_id, r.month, r.amount, TO_CHAR(r.receipt_date, 'YYYY-MM-DD') as receipt_date, r.image_url
       FROM profile_receipts pr
       JOIN receipts r ON r.id = pr.id_receipt`);
        const receiptsMap = new Map();
        for (const r of receiptsRes.rows) {
            if (!receiptsMap.has(r.id_profile)) {
                receiptsMap.set(r.id_profile, {});
            }
            receiptsMap.get(r.id_profile)[r.month] = {
                receipt_id: r.receipt_id,
                amount: r.amount,
                receipt_date: r.receipt_date,
                image_url: formatCloudinaryOptimizedUrl(r.image_url),
            };
        }
        const matrix = profilesRes.rows.map((p, index) => {
            const months = {};
            const pReceipts = receiptsMap.get(p.id) || {};
            for (let m = 1; m <= 12; m++) {
                months[m] = pReceipts[m] || null;
            }
            return {
                stt: index + 1,
                id_profile: p.id,
                fullname: p.fullname,
                schedule: p.schedule,
                phone_number: p.phone_number,
                date_of_join: p.date_of_join,
                months,
            };
        });
        return matrix;
    }
    async create(dto) {
        const client = await this.dbService.getPool().connect();
        try {
            await client.query('BEGIN');
            let rawImage = dto.image_url || dto.base64Image || '';
            if (rawImage && (rawImage.startsWith('data:image') || rawImage.length > 500)) {
                try {
                    rawImage = await this.uploadImage(rawImage);
                }
                catch (uploadErr) {
                    console.error('Lỗi khi tải ảnh lên Cloudinary:', uploadErr);
                }
            }
            const formattedUrl = formatCloudinaryOptimizedUrl(rawImage);
            const existingRes = await client.query(`SELECT r.id
         FROM receipts r
         JOIN profile_receipts pr ON pr.id_receipt = r.id
         WHERE pr.id_profile = $1 AND r.month = $2`, [dto.id_profile, dto.month]);
            let receipt;
            if (existingRes.rows.length > 0) {
                const existingId = existingRes.rows[0].id;
                const updateRes = await client.query(`UPDATE receipts
           SET amount = $1,
               receipt_date = $2,
               payer_name = $3,
               payment_content = $4,
               schedule_note = $5,
               image_url = $6
           WHERE id = $7
           RETURNING *`, [
                    dto.amount || 300000,
                    dto.receipt_date,
                    dto.payer_name,
                    dto.payment_content || `Học phí tháng ${dto.month}`,
                    dto.schedule_note || '',
                    formattedUrl || '',
                    existingId,
                ]);
                receipt = updateRes.rows[0];
            }
            else {
                const receiptRes = await client.query(`INSERT INTO receipts (amount, receipt_date, month, payer_name, payment_content, schedule_note, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`, [
                    dto.amount || 300000,
                    dto.receipt_date,
                    dto.month,
                    dto.payer_name,
                    dto.payment_content || `Học phí tháng ${dto.month}`,
                    dto.schedule_note || '',
                    formattedUrl || '',
                ]);
                receipt = receiptRes.rows[0];
                await client.query(`INSERT INTO profile_receipts (id_profile, id_receipt)
           VALUES ($1, $2)`, [dto.id_profile, receipt.id]);
            }
            await client.query('COMMIT');
            return {
                ...receipt,
                image_url: formattedUrl,
            };
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw new common_1.BadRequestException('Lỗi tạo biên lai: ' + (err.detail || err.message));
        }
        finally {
            client.release();
        }
    }
};
exports.ReceiptsService = ReceiptsService;
exports.ReceiptsService = ReceiptsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ReceiptsService);
//# sourceMappingURL=receipts.service.js.map