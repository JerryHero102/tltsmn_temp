import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(id_system_or_phone: string, pass: string): Promise<any> {
    const res = await this.dbService.query(
      `SELECT a.id, a.id_system, a.phone_number, a.password_hash, a.role, p.id as profile_id, p.fullname, p.email, p.gender, p.schedule, p.notes, p.birth_year
       FROM auth_sys a
       LEFT JOIN profile p ON p.id_auth = a.id
       WHERE a.id_system = $1 OR a.phone_number = $1`,
      [id_system_or_phone],
    );

    if (res.rows.length === 0) {
      throw new UnauthorizedException('Mã người dùng hoặc mật khẩu không chính xác');
    }

    const user = res.rows[0];
    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Mã người dùng hoặc mật khẩu không chính xác');
    }

    const { password_hash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      id_system: user.id_system,
      phone_number: user.phone_number,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        id_system: user.id_system,
        phone_number: user.phone_number,
        role: user.role,
        profile: {
          id: user.profile_id,
          fullname: user.fullname || 'Người dùng',
          email: user.email,
          gender: user.gender,
          schedule: user.schedule,
          notes: user.notes,
          birth_year: user.birth_year,
        },
      },
    };
  }

  async getProfile(userId: string) {
    const res = await this.dbService.query(
      `SELECT a.id, a.id_system, a.phone_number, a.role, p.id as profile_id, p.fullname, p.email, p.gender, p.schedule, p.notes, p.birth_year
       FROM auth_sys a
       LEFT JOIN profile p ON p.id_auth = a.id
       WHERE a.id = $1`,
      [userId],
    );

    if (res.rows.length === 0) {
      throw new UnauthorizedException('Không tìm thấy thông tin tài khoản');
    }

    const user = res.rows[0];
    return {
      id: user.id,
      id_system: user.id_system,
      phone_number: user.phone_number,
      role: user.role,
      profile: {
        id: user.profile_id,
        fullname: user.fullname || 'Người dùng',
        email: user.email,
        gender: user.gender,
        schedule: user.schedule,
        notes: user.notes,
        birth_year: user.birth_year,
      },
    };
  }
}
