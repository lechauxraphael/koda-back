import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { Users } from './users/user.entity';
import { Groups } from 'src/groups/groups.entity';
import { GroupsController } from './groups/groups.controller';
import { GroupsModule } from './groups/groups.module';



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
        entities: [Users, Groups],
        synchronize: true, // Only for development!
      }),
    }),
    AuthModule, UsersModule, GroupsModule],
  controllers: [AppController, AuthController, GroupsController],
  providers: [AppService],
})
export class AppModule {}
