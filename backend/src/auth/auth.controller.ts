import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { id_system?: string; idSystem?: string; password?: string; pass?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const idSys = body.id_system || body.idSystem || '';
    const pass = body.password || body.pass || '';

    const user = await this.authService.validateUser(idSys, pass);
    const data = await this.authService.login(user);

    // Cross-origin HttpOnly cookie settings for Vercel -> Cloudflare Tunnel (sameSite: 'none', secure: true, maxAge: 24h)
    res.cookie('access_token', data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return data;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    return req.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    return { message: 'Đã đăng xuất thành công' };
  }
}
