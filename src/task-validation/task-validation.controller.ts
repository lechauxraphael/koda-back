import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TaskValidationService } from './task-validation.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';

@ApiTags('TaskValidation')
@Controller('task-validation')
export class TaskValidationController {
  constructor(private readonly service: TaskValidationService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':taskId/submit')
  async submit(@Param('taskId') taskId: number, @Req() req: IAuthInfoRequest) {
    return this.service.submitValidation(Number(taskId), Number(req.user.sub));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':taskId/vote/:requesterId')
  async vote(
    @Param('taskId') taskId: number,
    @Param('requesterId') requesterId: number,
    @Req() req: IAuthInfoRequest,
    @Body() body: { vote: string },
  ) {
    return this.service.vote(Number(taskId), Number(requesterId), Number(req.user.sub), body.vote);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':taskId/votes/:requesterId')
  async getVotes(
    @Param('taskId') taskId: number,
    @Param('requesterId') requesterId: number,
    @Req() req: IAuthInfoRequest,
  ) {
    return this.service.getVotes(Number(taskId), Number(requesterId), Number(req.user.sub));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('group/:groupId/pending')
  async getPending(@Param('groupId') groupId: number) {
    return this.service.getPendingForGroup(Number(groupId));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('group/:groupId/resolve')
  async resolveGroup() {
    return this.service.resolveExpiredValidations();
  }
}