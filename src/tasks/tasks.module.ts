import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Tasks } from './tasks.entity';
import { Users } from 'src/users/user.entity';
import { GroupUser } from 'src/group-user/group-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tasks, Users, GroupUser])],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
