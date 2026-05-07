import {
  BadRequestException,
  Controller,
  NotFoundException,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(AuthGuard)
  @Post('create')
  async create(
    @Req() req: IAuthInfoRequest,
    @Body() body: { title: string; description: string },
  ) {
    if (!body || !body.title || !body.description) {
      throw new BadRequestException('Le title et la description sont requis');
    }

    if (!req.user || !req.user.username) {
      throw new BadRequestException('Utilisateur non authentifié ou token invalide');
    }

    const result = await this.tasksService.create({
      title: body.title,
      description: body.description,
      username: req.user.username,
    });

    if ('error' in result) {
      if (result.error === 'L\'utilisateur n\'existe pas') {
        throw new NotFoundException(result.error);
      }

      throw new BadRequestException(result.error);
    }

    return result;
  }
}
