import {
  BadRequestException,
  Controller,
  NotFoundException,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Param,
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
async create(@Req() req: IAuthInfoRequest, @Body() body: any) {
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
    frequency: body.frequency,
    deadline: body.deadline ? `${body.deadline} 12:00:00` : null,
    reminderTime: body.reminderTime,
    groupId: body.groupId ? Number(body.groupId) : undefined,
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
  @ApiOperation({ summary: 'Lister les taches acceptees par l utilisateur connecte' })
  @ApiResponse({ status: 200, description: 'Liste des taches' })
  @UseGuards(AuthGuard)
  @Get('my-tasks')
  async getMyTasks(@Req() req: IAuthInfoRequest) {
    return this.tasksService.getUserTasks(req.user.username);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les taches d un groupe' })
  @ApiResponse({ status: 200, description: 'Liste des taches du groupe' })
  @UseGuards(AuthGuard)
  @Get('group/:groupId')
  async getGroupTasks(@Param('groupId') groupId: number) {
    return this.tasksService.getGroupTasks(Number(groupId));
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rappels du jour pour l utilisateur connecte' })
  @ApiResponse({ status: 200, description: 'Liste des rappels' })
  @UseGuards(AuthGuard)
  @Get('reminders')
  async getReminders(@Req() req: IAuthInfoRequest) {
    return this.tasksService.getPendingReminders(Number(req.user.sub));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('admin/daily-mission')
  async createDailyMission(@Req() req: IAuthInfoRequest, @Body() body: any) {
    if (!body.title || !body.description || !body.targetSteps || !body.date) {
      throw new BadRequestException('title, description, targetSteps et date sont requis');
    }
    const result = await this.tasksService.createDailyMission(Number(req.user.sub), {
      title: body.title,
      description: body.description,
      points: body.points ? Number(body.points) : 0,
      targetSteps: Number(body.targetSteps),
      date: body.date,
    });
    if ('error' in result) throw new BadRequestException(result.error);
    return result;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('daily-mission/today')
  async getTodayDailyMission(@Req() req: IAuthInfoRequest) {
    return this.tasksService.getTodayDailyMission(Number(req.user.sub));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':taskId/submit-steps')
  async submitSteps(
    @Param('taskId') taskId: number,
    @Req() req: IAuthInfoRequest,
    @Body() body: { steps: number },
  ) {
    if (body.steps === undefined) throw new BadRequestException('steps est requis');
    const result = await this.tasksService.submitSteps(Number(taskId), Number(req.user.sub), Number(body.steps));
    if ('error' in result) throw new BadRequestException(result.error);
    return result;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('daily-mission/history')
  async getDailyMissionHistory(@Req() req: IAuthInfoRequest) {
    return this.tasksService.getDailyMissionHistory(Number(req.user.sub));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('admin/daily-missions')
  async getAllDailyMissions() {
    return this.tasksService.getAllDailyMissions();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('daily-mission/streak')
  async getDailyMissionStreak(@Req() req: IAuthInfoRequest) {
    return this.tasksService.getDailyMissionStreak(Number(req.user.sub));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('progression-stats')
  async getProgressionStats(@Req() req: IAuthInfoRequest) {
    return this.tasksService.getProgressionStats(Number(req.user.sub));
  }
}