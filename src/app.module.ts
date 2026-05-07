import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { Users } from './users/user.entity';
import { Groups } from 'src/groups/groups.entity';
import { Chat } from './chat/chat.entity';
import { GroupsModule } from './groups/groups.module';
import { Subscription } from './subscription/subscription.entity';
import { SubscriptionType } from './subscriptionType/subscriptionType.entity';
import { GroupUser } from './group-user/group-user.entity';
import { Tasks } from './tasks/tasks.entity';
import { UsersTasks } from './users-tasks/users-tasks.entity';
import { InfoSheet } from './info_sheet/infoSheet.entity';
import { Mascot } from './mascot/mascot.entity';
import { Rewards } from './rewards/rewards.entity';
import { Partners } from './partners/partners.entity';
import { TasksModule } from './tasks/tasks.module';


@Module({
  imports: [
    ConfigModule.forRoot({
       isGlobal: true 
    }),    
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [Users, Groups, GroupUser, Chat, Subscription, SubscriptionType, 
                  Tasks, UsersTasks, InfoSheet, Mascot, Rewards, Partners],
        synchronize: true, // Only for development!
      }),
    }),
    AuthModule, UsersModule, GroupsModule, TasksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
