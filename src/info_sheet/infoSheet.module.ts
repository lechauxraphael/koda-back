import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfoSheet } from './infoSheet.entity';
import { InfoSheetService } from './infoSheet.service';
import { InfoSheetController } from './infoSheet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InfoSheet])],
  controllers: [InfoSheetController],
  providers: [InfoSheetService],
})
export class InfoSheetModule {}