import { Controller, Get, Post, Body, Param, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${extname(file.originalname)}`);
  },
});

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

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':groupId/image')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async sendImage(
    @Param('groupId') groupId: number,
    @Req() req: IAuthInfoRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = `/uploads/${file.filename}`;
    return this.chatService.sendImage(Number(groupId), Number(req.user.sub), imageUrl);
  }
}