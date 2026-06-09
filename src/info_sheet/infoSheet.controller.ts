import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InfoSheetService } from './infoSheet.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';

@ApiTags('InfoSheet')
@Controller('info-sheet')
export class InfoSheetController {
  constructor(private readonly service: InfoSheetService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  getMySheet(@Req() req: IAuthInfoRequest) {
    return this.service.findByUser(Number(req.user.sub));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('me')
  saveMySheet(@Req() req: IAuthInfoRequest, @Body() body: { weight: number; height: number }) {
    return this.service.upsert(Number(req.user.sub), body);
  }
}