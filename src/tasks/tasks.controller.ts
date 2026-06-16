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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TasksService } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';
import { CreateTaskDto, TaskIdDto } from './dto/tasks.dto';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${extname(file.originalname)}`);
  },
});

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
      deadline: body.deadline ? new Date(body.deadline) : null,
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
  @ApiOperation({ summary: 'Valider une tache avec une photo' })
  @ApiResponse({ status: 201, description: 'Tache validee' })
  @UseGuards(AuthGuard)
  @Post(':taskId/validate')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async validateTask(
    @Param('taskId') taskId: number,
    @Req() req: IAuthInfoRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Une photo est requise pour valider la mission');
    const proofUrl = `/uploads/${file.filename}`;
    const result = await this.tasksService.validateTask(Number(taskId), Number(req.user.sub), proofUrl);
    if ('error' in result) throw new BadRequestException(result.error);
    return result;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rappels du jour pour l utilisateur connecte' })
  @ApiResponse({ status: 200, description: 'Liste des rappels' })
  @UseGuards(AuthGuard)
  @Get('reminders')
  async getReminders(@Req() req: IAuthInfoRequest) {
    return this.tasksService.getPendingReminders(Number(req.user.sub));
  }
}