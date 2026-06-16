import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskValidation } from './task-validation.entity';
import { TaskValidationService } from './task-validation.service';
import { TaskValidationController } from './task-validation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskValidation]), ScheduleModule.forRoot()],
  controllers: [TaskValidationController],
  providers: [TaskValidationService],
})
export class TaskValidationModule {}