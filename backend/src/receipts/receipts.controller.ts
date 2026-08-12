import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReceiptsService } from './receipts.service';

@UseGuards(JwtAuthGuard)
@Controller('api/receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get()
  findAll() {
    return this.receiptsService.findAll();
  }

  @Get('matrix')
  getMatrix() {
    return this.receiptsService.getTuitionMatrix();
  }

  @Post('upload')
  async uploadImage(@Body('image') base64Image: string) {
    const url = await this.receiptsService.uploadImage(base64Image);
    return { url };
  }

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
