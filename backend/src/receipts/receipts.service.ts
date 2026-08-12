import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { DatabaseService } from '../database/database.service';

function formatCloudinaryOptimizedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('/image/upload/') && !url.includes('/f_auto')) {
    return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
  }
  return url;
}

@Injectable()
export class ReceiptsService {
  constructor(private readonly dbService: DatabaseService) {
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

    cloudinary.config({
      ...configObj,
      secure: true,
    });
  }

  async uploadImage(fileBase64: string): Promise<string> {
    if (!fileBase64) return '';

    try {
      const res = await cloudinary.uploader.upload(fileBase64, {
        folder: 'tltsmn_receipts',
      });
      return formatCloudinaryOptimizedUrl(res.secure_url);
    } catch (err: any) {
      console.warn('Cloudinary upload warning:', err.message || err);
      if (fileBase64.startsWith('data:image')) {
        return fileBase64;
      }
      return fileBase64;
    }
  }

  async findAll() {
    const res = await this.dbService.query(
      `SELECT 
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
       ORDER BY r.receipt_date DESC, r.created_at DESC`,
    );
    return res.rows.map((row) => ({
      ...row,
      image_url: formatCloudinaryOptimizedUrl(row.image_url),
    }));
  }

  async getTuitionMatrix() {
    const profilesRes = await this.dbService.query(
      `SELECT p.id, p.fullname, p.schedule, p.phone_number
       FROM profile p
       WHERE p.id_auth IS NULL
       ORDER BY p.fullname ASC`,
    );

    const receiptsRes = await this.dbService.query(
      `SELECT pr.id_profile, r.id as receipt_id, r.month, r.amount, TO_CHAR(r.receipt_date, 'YYYY-MM-DD') as receipt_date, r.image_url
       FROM profile_receipts pr
       JOIN receipts r ON r.id = pr.id_receipt`,
    );

    const receiptsMap = new Map<string, Record<number, any>>();

    for (const r of receiptsRes.rows) {
      if (!receiptsMap.has(r.id_profile)) {
        receiptsMap.set(r.id_profile, {});
      }
      receiptsMap.get(r.id_profile)![r.month] = {
        receipt_id: r.receipt_id,
        amount: r.amount,
        receipt_date: r.receipt_date,
        image_url: formatCloudinaryOptimizedUrl(r.image_url),
      };
    }

    const matrix = profilesRes.rows.map((p, index) => {
      const months: Record<number, any> = {};
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
        months,
      };
    });

    return matrix;
  }

  async create(dto: {
    id_profile: string;
    payer_name: string;
    month: number;
    receipt_date: string;
    amount?: number;
    payment_content?: string;
    schedule_note?: string;
    image_url?: string;
    base64Image?: string;
  }) {
    const client = await this.dbService.getPool().connect();
    try {
      await client.query('BEGIN');

      let rawImage = dto.image_url || dto.base64Image || '';

      // Upload base64 image to Cloudinary if not already uploaded
      if (rawImage && (rawImage.startsWith('data:image') || rawImage.length > 500)) {
        try {
          rawImage = await this.uploadImage(rawImage);
        } catch (uploadErr) {
          console.error('Lỗi khi tải ảnh lên Cloudinary:', uploadErr);
        }
      }

      const formattedUrl = formatCloudinaryOptimizedUrl(rawImage);

      // Check if a receipt already exists for this student and month
      const existingRes = await client.query(
        `SELECT r.id
         FROM receipts r
         JOIN profile_receipts pr ON pr.id_receipt = r.id
         WHERE pr.id_profile = $1 AND r.month = $2`,
        [dto.id_profile, dto.month],
      );

      let receipt: any;

      if (existingRes.rows.length > 0) {
        // Update existing receipt (upsert logic to prevent duplicates)
        const existingId = existingRes.rows[0].id;
        const updateRes = await client.query(
          `UPDATE receipts
           SET amount = $1,
               receipt_date = $2,
               payer_name = $3,
               payment_content = $4,
               schedule_note = $5,
               image_url = $6
           WHERE id = $7
           RETURNING *`,
          [
            dto.amount || 300000,
            dto.receipt_date,
            dto.payer_name,
            dto.payment_content || `Học phí tháng ${dto.month}`,
            dto.schedule_note || '',
            formattedUrl || '',
            existingId,
          ],
        );
        receipt = updateRes.rows[0];
      } else {
        // Insert new receipt
        const receiptRes = await client.query(
          `INSERT INTO receipts (amount, receipt_date, month, payer_name, payment_content, schedule_note, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            dto.amount || 300000,
            dto.receipt_date,
            dto.month,
            dto.payer_name,
            dto.payment_content || `Học phí tháng ${dto.month}`,
            dto.schedule_note || '',
            formattedUrl || '',
          ],
        );

        receipt = receiptRes.rows[0];

        await client.query(
          `INSERT INTO profile_receipts (id_profile, id_receipt)
           VALUES ($1, $2)`,
          [dto.id_profile, receipt.id],
        );
      }

      await client.query('COMMIT');
      return {
        ...receipt,
        image_url: formattedUrl,
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw new BadRequestException('Lỗi tạo biên lai: ' + (err.detail || err.message));
    } finally {
      client.release();
    }
  }
}
