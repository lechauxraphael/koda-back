import { Controller, Get, Post, Param, Req, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';

@ApiTags('Friends')
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('search')
  async search(@Query('username') username: string) {
    return this.friendsService.searchUser(username);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('request/:userId')
  async sendRequest(@Req() req: IAuthInfoRequest, @Param('userId') userId: string) {
    return this.friendsService.sendRequest(Number(req.user.sub), Number(userId));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('accept/:userId')
  async acceptRequest(@Req() req: IAuthInfoRequest, @Param('userId') userId: string) {
    return this.friendsService.acceptRequest(Number(req.user.sub), Number(userId));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('pending')
  async getPending(@Req() req: IAuthInfoRequest) {
    return this.friendsService.getPending(Number(req.user.sub));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('pending/count')
  async getPendingCount(@Req() req: IAuthInfoRequest) {
    const count = await this.friendsService.getPendingCount(Number(req.user.sub));
    return { count };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('list')
  async getFriends(@Req() req: IAuthInfoRequest) {
    return this.friendsService.getFriends(Number(req.user.sub));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('my-pending')
  async getMyPending(@Req() req: IAuthInfoRequest) {
    return this.friendsService.getMyPending(Number(req.user.sub));
  }
}