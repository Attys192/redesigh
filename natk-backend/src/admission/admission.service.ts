import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdmissionRecord } from '../entities/admission-record.entity';
import { Specialty } from '../entities/specialty.entity';

@Injectable()
export class AdmissionService implements OnModuleInit {
  private readonly logger = new Logger(AdmissionService.name);

  constructor(
    @InjectRepository(AdmissionRecord) private admissionRepo: Repository<AdmissionRecord>,
    @InjectRepository(Specialty) private specialtyRepo: Repository<Specialty>,
  ) {}

  async onModuleInit() {
    const count = await this.admissionRepo.count();
    if (count === 0) {
      await this.generateMockData();
    }
  }

  async generateMockData() {
    const specialties = await this.specialtyRepo.find();
    if (specialties.length === 0) {
      this.logger.warn('Специальности не найдены, симуляция рейтинга пропущена.');
      return;
    }

    const records: AdmissionRecord[] = [];
    let serial = 1;

    for (const specialty of specialties) {
      const applicantsCount = this.randomInt(40, 100);

      for (let i = 0; i < applicantsCount; i++) {
        records.push(
          this.admissionRepo.create({
            registrationCode: `НАТК-2026-${String(serial).padStart(4, '0')}`,
            specialtyCode: specialty.code,
            score: this.randomScore(3.5, 5.0),
            hasOriginal: Math.random() < 0.62,
          }),
        );
        serial++;
      }
    }

    await this.admissionRepo.save(records);
    this.logger.log(`Сгенерировано ${records.length} симулированных записей приемной кампании.`);
  }

  async getAdmissionStatusByCode(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    const record = await this.admissionRepo.findOne({
      where: { registrationCode: normalizedCode },
    });

    if (!record) {
      throw new NotFoundException(`Регистрационный код ${normalizedCode} не найден`);
    }

    const allBySpecialty = await this.admissionRepo.find({
      where: { specialtyCode: record.specialtyCode },
      order: { score: 'DESC' },
    });

    const yourPosition = allBySpecialty.findIndex((item) => item.id === record.id) + 1;
    const totalApplicants = allBySpecialty.length;

    const specialties = await this.specialtyRepo.find({
      where: { code: record.specialtyCode },
    });
    const budgetPlaces =
      specialties.reduce((sum, specialty) => sum + (specialty.budgetPlaces || 0), 0) || 25;

    return {
      registrationCode: record.registrationCode,
      specialtyCode: record.specialtyCode,
      score: record.score,
      hasOriginal: record.hasOriginal,
      yourPosition,
      totalApplicants,
      budgetPlaces,
      isPassing: yourPosition <= budgetPlaces,
    };
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomScore(min: number, max: number): number {
    const raw = Math.random() * (max - min) + min;
    return Number(raw.toFixed(3));
  }
}
