import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StudentsService } from './students.service';

@UseGuards(JwtAuthGuard)
@Controller('api/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  create(
    @Body()
    createStudentDto: {
      fullname: string;
      birth_year: number;
      phone_number?: string;
      gender?: string;
      schedule?: string;
      notes?: string;
      email?: string;
      current_address?: string;
    },
  ) {
    return this.studentsService.create(createStudentDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
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
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
