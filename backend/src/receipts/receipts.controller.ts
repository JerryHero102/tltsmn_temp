import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReceiptsService } from './receipts.service';

const RECEIPTS_DIR = '/home/maivankhanh/Documents/saved_reciepts';

@Controller('api/receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  // Route phục vụ hình ảnh công khai cho thẻ <img> trên trình duyệt mà không cần cookie/token
  @Get('image/:filename')
  serveImage(@Param('filename') filename: string, @Res() res: Response) {
    const safeFilename = path.basename(filename);
    const filePath = path.join(RECEIPTS_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Hình ảnh biên lai không tồn tại');
    }

    return res.sendFile(filePath);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('location') location?: string) {
    return this.receiptsService.findAll(location);
  }

  @UseGuards(JwtAuthGuard)
  @Get('matrix')
  getMatrix(@Query('location') location?: string) {
    return this.receiptsService.getTuitionMatrix(location);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  async uploadImage(@Body('image') base64Image: string) {
    const url = await this.receiptsService.uploadImage(base64Image);
    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body()
    body: {
      id_profile: string;
      payer_name: string;
      month: number;
      receipt_date: string;
      amount?: number;
      payment_content?: string;
      schedule_note?: string;
      image_url?: string;
      base64Image?: string;
    },
  ) {
    return this.receiptsService.create(body);
  }
}
