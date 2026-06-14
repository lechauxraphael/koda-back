import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './friendship.entity';
import { Users } from '../users/user.entity';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship, Users])],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}