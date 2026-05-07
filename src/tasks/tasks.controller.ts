import {
  BadRequestException,
  Controller,
  NotFoundException,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';
import { CreateTaskDto, TaskIdDto } from './dto/tasks.dto';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer une tache dans le groupe de l utilisateur' })
  @ApiResponse({ status: 201, description: 'Tache creee' })
  @ApiResponse({ status: 400, description: 'Requete invalide' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @UseGuards(AuthGuard)
  @Post('create')
  async create(@Req() req: IAuthInfoRequest, @Body() body: CreateTaskDto) {
    if (!body || !body.title || !body.description) {
      throw new BadRequestException('Le title et la description sont requis');
    }

    if (!req.user || !req.user.username) {
      throw new BadRequestException(
        'Utilisateur non authentifié ou token invalide',
      );
    }

    const result = await this.tasksService.create({
      title: body.title,
      description: body.description,
      username: req.user.username,
    });

    if ('error' in result) {
      if (result.error === "L'utilisateur n'existe pas") {
        throw new NotFoundException(result.error);
      }

      throw new BadRequestException(result.error);
    }

    return result;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accepter une invitation de tache' })
  @ApiResponse({ status: 201, description: 'Invitation de tache acceptee' })
  @ApiResponse({ status: 404, description: 'Invitation introuvable' })
  @UseGuards(AuthGuard)
  @Post('accept')
  async acceptTask(@Req() req: IAuthInfoRequest, @Body() body: TaskIdDto) {
    if (!body || !body.id) {
      throw new BadRequestException("L'ID de la tâche est requis");
    }

    const result = await this.tasksService.acceptTaskInvitation(
      body.id,
      req.user.username,
    );

    if ('error' in result) {
      if (result.error === 'Invitation de tâche introuvable') {
        throw new NotFoundException(result.error);
      }
      throw new BadRequestException(result.error);
    }

    return { message: 'Tâche acceptée avec succès', task: result };
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lister les taches acceptees par l utilisateur connecte',
  })
  @ApiResponse({ status: 200, description: 'Liste des taches' })
  @UseGuards(AuthGuard)
  @Get('my-tasks')
  async getMyTasks(@Req() req: IAuthInfoRequest) {
    return this.tasksService.getUserTasks(req.user.username);
  }
}
