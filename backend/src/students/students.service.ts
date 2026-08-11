import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class StudentsService {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll() {
    // Student profiles are info-only records created by Admin (id_auth IS NULL)
    const res = await this.dbService.query(
      `SELECT 
        p.id as profile_id,
        p.fullname,
        p.birth_year,
        p.gender,
        p.schedule,
        p.phone_number,
        p.email,
        p.location,
        p.current_address,
        p.permanent_address,
        p.notes,
        p.date_of_join,
        a.id_system
       FROM profile p
       LEFT JOIN auth_sys a ON a.id = p.id_auth
       WHERE p.id_auth IS NULL
       ORDER BY p.fullname ASC`,
    );
    return res.rows;
  }

  async findOne(id: string) {
    const res = await this.dbService.query(
      `SELECT 
        p.id as profile_id,
        p.fullname,
        p.birth_year,
        p.gender,
        p.schedule,
        p.phone_number,
        p.email,
        p.location,
        p.current_address,
        p.permanent_address,
        p.notes,
        p.date_of_join,
        a.id_system
       FROM profile p
       LEFT JOIN auth_sys a ON a.id = p.id_auth
       WHERE p.id = $1`,
      [id],
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Không tìm thấy thông tin học viên');
    }

    return res.rows[0];
  }

  async create(createStudentDto: {
    fullname: string;
    birth_year: number;
    phone_number?: string;
    gender?: string;
    schedule?: string;
    notes?: string;
    email?: string;
    current_address?: string;
  }) {
    // Save ALL student profile info into PostgreSQL DB profile table
    const res = await this.dbService.query(
      `INSERT INTO profile (fullname, birth_year, phone_number, gender, schedule, notes, email, current_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *, id as profile_id`,
      [
        createStudentDto.fullname,
        createStudentDto.birth_year || 2000,
        createStudentDto.phone_number || '',
        createStudentDto.gender || 'Nam',
        createStudentDto.schedule || '2-4-6',
        createStudentDto.notes || '',
        createStudentDto.email || '',
        createStudentDto.current_address || '',
      ],
    );

    return res.rows[0];
  }

  async update(
    id: string,
    updateStudentDto: {
      fullname?: string;
      birth_year?: number;
      phone_number?: string;
      gender?: string;
      schedule?: string;
      notes?: string;
      email?: string;
      current_address?: string;
    },
  ) {
    const res = await this.dbService.query(
      `UPDATE profile
       SET fullname = COALESCE($1, fullname),
           birth_year = COALESCE($2, birth_year),
           phone_number = COALESCE($3, phone_number),
           gender = COALESCE($4, gender),
           schedule = COALESCE($5, schedule),
           notes = COALESCE($6, notes),
           email = COALESCE($7, email),
           current_address = COALESCE($8, current_address)
       WHERE id = $9
       RETURNING *, id as profile_id`,
      [
        updateStudentDto.fullname,
        updateStudentDto.birth_year,
        updateStudentDto.phone_number,
        updateStudentDto.gender,
        updateStudentDto.schedule,
        updateStudentDto.notes,
        updateStudentDto.email,
        updateStudentDto.current_address,
        id,
      ],
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Không tìm thấy học viên để cập nhật');
    }

    return res.rows[0];
  }

  async remove(id: string) {
    const res = await this.dbService.query(
      `DELETE FROM profile WHERE id = $1 RETURNING id`,
      [id],
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Không tìm thấy học viên để xóa');
    }

    return { message: 'Đã xóa học viên thành công' };
  }
}
