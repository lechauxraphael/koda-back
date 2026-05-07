import {
  Controller,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';
import {
  AddUserToGroupDto,
  CreateGroupDto,
  GroupIdDto,
} from './dto/groups.dto';
import { MessageResponseDto } from 'src/common/dto/message-response.dto';

@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creer un groupe' })
  @ApiResponse({ status: 201, description: 'Groupe cree' })
  @ApiResponse({ status: 400, description: 'Requete invalide' })
  @ApiResponse({ status: 401, description: 'Token manquant ou invalide' })
  @UseGuards(AuthGuard)
  @Post('create')
  async create(@Req() req: IAuthInfoRequest, @Body() body: CreateGroupDto) {
    if (!body || !body.name) {
      throw new BadRequestException('Le nom du groupe est requis');
    }

    if (!req.user || !req.user.username) {
      throw new BadRequestException(
        'Utilisateur non authentifié ou token invalide',
      );
    }

    const groupData = {
      name: body.name,
      creator: req.user.username,
    };

    return this.groupsService.create(groupData);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un groupe' })
  @ApiResponse({
    status: 201,
    description: 'Groupe supprime',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Action interdite' })
  @ApiResponse({ status: 404, description: 'Groupe introuvable' })
  @UseGuards(AuthGuard)
  @Post('delete')
  async delete(@Req() req: IAuthInfoRequest, @Body() body: GroupIdDto) {
    if (!body || !body.id) {
      throw new BadRequestException(
        "L'ID du groupe est requis dans le corps de la requête",
      );
    }

    const result = await this.groupsService.delete(body.id, req.user.username);

    if (typeof result === 'object' && 'error' in result) {
      if (result.error === "Le groupe n'existe pas") {
        throw new NotFoundException(result.error);
      }

      throw new ForbiddenException(result.error);
    }

    return { message: 'Groupe supprimé avec succès' };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inviter un utilisateur dans un groupe' })
  @ApiResponse({ status: 201, description: 'Invitation creee' })
  @ApiResponse({ status: 403, description: 'Action interdite' })
  @ApiResponse({ status: 404, description: 'Groupe introuvable' })
  @UseGuards(AuthGuard)
  @Post('addUser')
  async addUser(@Req() req: IAuthInfoRequest, @Body() body: AddUserToGroupDto) {
    if (!body.id || !body.username) {
      throw new BadRequestException(
        "ID du groupe et nom d'utilisateur sont requis",
      );
    }

    const result = await this.groupsService.addUserToGroup(
      body.id,
      body.username,
      req.user.username,
    );

    if ('error' in result) {
      if (result.error === "Le groupe n'existe pas") {
        throw new NotFoundException(result.error);
      }

      if (
        result.error ===
        'Seul le créateur du groupe peut inviter un utilisateur'
      ) {
        throw new ForbiddenException(result.error);
      }

      throw new BadRequestException(result.error);
    }

    return result;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accepter une invitation a rejoindre un groupe' })
  @ApiResponse({ status: 201, description: 'Invitation acceptee' })
  @ApiResponse({ status: 404, description: 'Groupe introuvable' })
  @UseGuards(AuthGuard)
  @Post('acceptInvitation')
  async acceptInvitation(
    @Req() req: IAuthInfoRequest,
    @Body() body: GroupIdDto,
  ) {
    if (!body.id) {
      throw new BadRequestException('ID du groupe requis');
    }

    const result = await this.groupsService.acceptInvitation(
      body.id,
      req.user.username,
    );

    if ('error' in result) {
      if (result.error === "Le groupe n'existe pas") {
        throw new NotFoundException(result.error);
      }

      throw new BadRequestException(result.error);
    }

    return result;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les groupes de l utilisateur connecte' })
  @ApiResponse({ status: 200, description: 'Liste des groupes' })
  @UseGuards(AuthGuard)
  @Get('allUserGroups')
  findAllByUser(@Req() req: IAuthInfoRequest) {
    return this.groupsService.findAllByUser(req.user.username);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les invitations de groupe en attente' })
  @ApiResponse({ status: 200, description: 'Liste des invitations' })
  @UseGuards(AuthGuard)
  @Get('pendingInvitations')
  findPendingInvitations(@Req() req: IAuthInfoRequest) {
    return this.groupsService.findPendingInvitations(req.user.username);
  }

  @ApiOperation({ summary: 'Recuperer un groupe par son identifiant' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Groupe trouve' })
  @Get('group/:id')
  findOneGroup(@Param('id') id: number) {
    return this.groupsService.findOneGroup(id);
  }
}
