import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':groupId')
  async getMessages(@Param('groupId') groupId: number) {
    return this.chatService.getMessages(Number(groupId));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':groupId')
  async sendMessage(
    @Param('groupId') groupId: number,
    @Req() req: IAuthInfoRequest,
    @Body() body: { message: string },
  ) {
    return this.chatService.sendMessage(Number(groupId), Number(req.user.sub), body.message);
  }
}