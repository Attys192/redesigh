import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ParserModule } from '../parser/parser.module';
import { News } from '../entities/news.entity';
import { NewsImage } from '../entities/news-image.entity';
import { Staff } from '../entities/staff.entity';
import { StaffPosition } from '../entities/staff-position.entity';
import { Document } from '../entities/document.entity';
import { DocumentCategory } from '../entities/document-category.entity';
import { Company } from '../entities/company.entity';
import { Vacancy } from '../entities/vacancy.entity';
import { Schedule } from '../entities/schedule.entity';
import { Group } from '../entities/group.entity';
import { Specialty } from '../entities/specialty.entity';
import { Campus } from '../entities/campus.entity';
import { Subject } from '../entities/subject.entity';
import { Room } from '../entities/room.entity';
import { Department } from '../entities/department.entity';
import { AdmissionRecord } from '../entities/admission-record.entity';
import { AdmissionService } from '../admission/admission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      News,
      NewsImage,
      Staff,
      StaffPosition,
      Document,
      DocumentCategory,
      Company,
      Vacancy,
      Schedule,
      Group,
      Specialty,
      Campus,
      Subject,
      Room,
      Department,
      AdmissionRecord,
    ]),
    ParserModule,
  ],
  controllers: [ApiController],
  providers: [ApiService, AdmissionService],
})
export class ApiModule {}
