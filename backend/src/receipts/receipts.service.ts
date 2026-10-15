import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseService } from '../database/database.service';

const RECEIPTS_DIR = '/home/maivankhanh/Documents/saved_reciepts';

@Injectable()
export class ReceiptsService {
  constructor(private readonly dbService: DatabaseService) {
    if (!fs.existsSync(RECEIPTS_DIR)) {
      try {
        fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
      } catch (err: any) {
        console.error('Không thể tạo thư mục saved_reciepts:', err.message);
      }
    }
  }

  async saveImageLocally(fileBase64: string): Promise<string> {
    if (!fileBase64) return '';

    // Nếu đã là đường dẫn hoặc link URL thì giữ nguyên
    if (
      !fileBase64.startsWith('data:image') &&
      !fileBase64.startsWith('/9j/') &&
      fileBase64.length < 500
    ) {
      return fileBase64;
    }

    try {
      if (!fs.existsSync(RECEIPTS_DIR)) {
        fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
      }

      let extension = 'jpg';
      let base64Data = fileBase64;

      const matches = fileBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        const mimeSubtype = matches[1].toLowerCase();
        if (mimeSubtype.includes('png')) extension = 'png';
        else if (mimeSubtype.includes('webp')) extension = 'webp';
        else if (mimeSubtype.includes('gif')) extension = 'gif';
        else extension = 'jpg';
        base64Data = matches[2];
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
      const filePath = path.join(RECEIPTS_DIR, filename);

      await fs.promises.writeFile(filePath, buffer);
      return `/api/receipts/image/${filename}`;
    } catch (err: any) {
      console.error('Lỗi khi lưu ảnh vào ổ đĩa:', err.message || err);
      return fileBase64;
    }
  }

  async uploadImage(fileBase64: string): Promise<string> {
    return this.saveImageLocally(fileBase64);
  }

  async findAll(location?: string) {
    let query = `
      SELECT 
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
        pr.id_profile,
        p.location
       FROM receipts r
       LEFT JOIN profile_receipts pr ON pr.id_receipt = r.id
       LEFT JOIN profile p ON p.id = pr.id_profile
    `;
    const params: any[] = [];
    if (location === 'tsn') {
      query += ` WHERE p.location = 'tsn'`;
    } else if (location === 'mn') {
      query += ` WHERE (p.location = 'mn' OR p.location IS NULL)`;
    } else if (location) {
      params.push(location);
      query += ` WHERE p.location = $1`;
    }
    query += ` ORDER BY r.receipt_date DESC, r.created_at DESC`;

    const res = await this.dbService.query(query, params);
    return res.rows.map((row) => ({
      ...row,
      image_url: row.image_url || '',
    }));
  }

  async getTuitionMatrix(location?: string) {
    let profileQuery = `
      SELECT p.id, p.fullname, p.schedule, p.phone_number, p.location, TO_CHAR(p.date_of_join, 'YYYY-MM-DD') as date_of_join
      FROM profile p
      WHERE p.id_auth IS NULL
    `;
    const params: any[] = [];
    if (location === 'tsn') {
      profileQuery += ` AND p.location = 'tsn'`;
    } else if (location === 'mn') {
      profileQuery += ` AND (p.location = 'mn' OR p.location IS NULL)`;
    } else if (location) {
      params.push(location);
      profileQuery += ` AND p.location = $1`;
    }
    profileQuery += ` ORDER BY p.fullname ASC`;

    const profilesRes = await this.dbService.query(profileQuery, params);

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
        image_url: r.image_url || '',
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
        date_of_join: p.date_of_join,
        location: p.location || 'mn',
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

      // Lưu ảnh base64 trực tiếp vào ổ đĩa máy tính
      if (rawImage && (rawImage.startsWith('data:image') || rawImage.length > 500)) {
        try {
          rawImage = await this.saveImageLocally(rawImage);
        } catch (uploadErr) {
          console.error('Lỗi khi lưu ảnh vào ổ đĩa:', uploadErr);
        }
      }

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
            rawImage || '',
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
            rawImage || '',
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
        image_url: rawImage,
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw new BadRequestException('Lỗi tạo biên lai: ' + (err.detail || err.message));
    } finally {
      client.release();
    }
  }
}
