import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfoSheet } from './infoSheet.entity';

@Injectable()
export class InfoSheetService {
  constructor(
    @InjectRepository(InfoSheet)
    private repo: Repository<InfoSheet>,
  ) {}

  async findByUser(userId: number) {
    return this.repo.find({ where: { user: { id: userId } }, order: { creationDate: 'DESC' } });
  }

  async upsert(userId: number, data: { weight: number; height: number }) {
    const existing = await this.repo.findOne({ where: { user: { id: userId } } });
    if (existing) {
      await this.repo.update(existing.id, data);
      return this.repo.findOne({ where: { id: existing.id } });
    }
    const entry = this.repo.create({ ...data, user: { id: userId } as any });
    return this.repo.save(entry);
  }
}