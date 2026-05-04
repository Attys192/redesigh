import { Controller, Get, Post, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiService } from './api.service';
import { ParserService } from '../parser/parser.service';
import { AdmissionService } from '../admission/admission.service';
import { SyncQueryDto, ScheduleQueryDto, DocumentQueryDto, StaffSearchDto } from './dto';

@Controller('api')
export class ApiController {
  constructor(
    private readonly apiService: ApiService,
    private readonly parserService: ParserService,
    private readonly admissionService: AdmissionService,
  ) {}

  @Post('sync')
  runSync(@Query() query: SyncQueryDto) {
    return this.parserService.runFullSync(query.type);
  }

  @Get('sync/status')
  getSyncStatus() {
    return this.parserService.getParsingStatus();
  }

  @Get('schedule/groups')
  findUniqueGroups() {
    return this.apiService.findUniqueGroups();
  }

  @Get('schedule')
  findAllSchedule(@Query() query: ScheduleQueryDto) {
    return this.apiService.findAllSchedule(query.group, query.teacher);
  }

  @Get('news')
  findAllNews() {
    return this.apiService.findAllNews();
  }

  @Get('staff/find')
  findStaffByName(@Query() query: StaffSearchDto) {
    return this.apiService.findStaffByName(query.name);
  }

  @Get('staff/:id')
  findOneStaff(@Param('id', ParseIntPipe) id: number) {
    return this.apiService.findOneStaff(id);
  }

  @Get('staff')
  findAllStaff() {
    return this.apiService.findAllStaff();
  }

  @Get('documents')
  findAllDocuments(@Query() query: DocumentQueryDto) {
    return this.apiService.findAllDocuments(query.category);
  }

  @Get('documents/admission')
  findAdmissionDocuments() {
    return this.apiService.findAdmissionDocuments();
  }

  @Get('vacancies')
  findAllVacancies() {
    return this.apiService.findAllVacancies();
  }

  @Get('specialties')
  findAllSpecialties() {
    return this.apiService.findAllSpecialties();
  }

  @Get('specialty-profiles/:code')
  findSpecialtyProfile(@Param('code') code: string) {
    return this.apiService.findSpecialtyProfile(code);
  }

  @Get('specialty-profiles')
  findSpecialtyProfiles() {
    return this.apiService.findSpecialtyProfiles();
  }

  @Get('admission/campaigns')
  findAdmissionCampaigns() {
    return this.apiService.findAdmissionCampaigns();
  }

  @Get('admission/plans')
  findAdmissionPlans(@Query('year') year?: string) {
    return this.apiService.findAdmissionPlans(year ? Number(year) : undefined);
  }

  @Get('admission/results')
  findAdmissionResults(@Query('year') year?: string) {
    return this.apiService.findAdmissionResults(year ? Number(year) : undefined);
  }

  @Get('campuses')
  findAllCampuses() {
    return this.apiService.findAllCampuses();
  }

  @Get('groups')
  findAllGroups() {
    return this.apiService.findAllGroups();
  }

  @Get('departments')
  findAllDepartments() {
    return this.apiService.findAllDepartments();
  }

  @Get('admission/status/:code')
  getAdmissionStatus(@Param('code') code: string) {
    return this.admissionService.getAdmissionStatusByCode(code);
  }
}
