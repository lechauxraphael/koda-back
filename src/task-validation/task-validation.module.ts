import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskValidation } from './task-validation.entity';
import { TaskValidationService } from './task-validation.service';
import { TaskValidationController } from './task-validation.controller';
import { UsersTasks } from 'src/users-tasks/users-tasks.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskValidation, UsersTasks]), ScheduleModule.forRoot()],
  controllers: [TaskValidationController],
  providers: [TaskValidationService],
})
export class TaskValidationModule {}