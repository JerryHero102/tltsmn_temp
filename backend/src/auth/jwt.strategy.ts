import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from '../database/database.service';
import { Request } from 'express';

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies && req.cookies['access_token']) {
    return req.cookies['access_token'];
  }
  if (req && req.headers && req.headers.cookie) {
    const match = req.headers.cookie.match(/access_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly dbService: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'TLTSMN_SECRET_KEY_2026',
    });
  }

  async validate(payload: any) {
    const res = await this.dbService.query(
      `SELECT a.id, a.id_system, a.phone_number, a.role, p.id as profile_id, p.fullname, p.email, p.gender, p.schedule, p.notes, p.birth_year
       FROM auth_sys a
       LEFT JOIN profile p ON p.id_auth = a.id
       WHERE a.id = $1`,
      [payload.sub],
    );

    if (res.rows.length === 0) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    return res.rows[0];
  }
}
