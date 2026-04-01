import { Controller, BadRequestException, NotFoundException, ForbiddenException, Get, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';
import { Group } from './groups.entity';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

    @UseGuards(AuthGuard)
    @Post('create')
    async create(@Req() req: IAuthInfoRequest, @Body() body: { name: string }) {
        if (!body || !body.name) {
            throw new BadRequestException('Le nom du groupe est requis');
        }
        
        // On s'assure que req.user existe et contient le username
        if (!req.user || !req.user.username) {
            throw new BadRequestException('Utilisateur non authentifié ou token invalide');
        }

        const groupData = {
            name: body.name,
            creator: req.user.username
        };
        
        return await this.groupsService.create(groupData);
    }

    @UseGuards(AuthGuard)
    @Post('delete')
    async delete(@Req() req: IAuthInfoRequest, @Body() body: { groupId: number }) {
        if (!body || !body.groupId) {
            throw new BadRequestException("L'ID du groupe est requis dans le corps de la requête");
        }
        
        const result = await this.groupsService.delete(body.groupId, req.user.username);
        
        if (typeof result === 'object' && 'error' in result) {
            if (result.error === "Le groupe n'existe pas") {
                throw new NotFoundException(result.error);
            }
            throw new ForbiddenException(result.error);
        }

        return { message: "Groupe supprimé avec succès" };
    }

    @UseGuards(AuthGuard)
    @Post('addUser')
    async addUser(@Body() body: { groupId: number, username: string }) {
        if (!body.groupId || !body.username) {
            throw new BadRequestException('ID du groupe et nom d\'utilisateur sont requis');
        }
        const result = await this.groupsService.addUserToGroup(body.groupId, body.username);
        if ('error' in result) {
            throw new BadRequestException(result.error);
        }
        return result;
    }
    
    @UseGuards(AuthGuard)
    @Get('allUserGroups')
    findAllByUser(@Req() req: IAuthInfoRequest) {
        return this.groupsService.findAllByUser(req.user.username);
    }

    @Get('group/:groupId')
    findOneGroup(@Req() req: IAuthInfoRequest, @Param('groupId') groupId: number) {
        return this.groupsService.findOneGroup(groupId);
    }
}
