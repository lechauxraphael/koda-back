import { Controller, BadRequestException, NotFoundException, ForbiddenException, Get, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';
import { Groups } from './groups.entity';

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
    async delete(@Req() req: IAuthInfoRequest, @Body() body: { id: number }) {
        if (!body || !body.id) {
            throw new BadRequestException("L'ID du groupe est requis dans le corps de la requête");
        }
        
        const result = await this.groupsService.delete(body.id, req.user.username);
        
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
    async addUser(@Body() body: { id: number, username: string }) {
        if (!body.id || !body.username) {
            throw new BadRequestException('ID du groupe et nom d\'utilisateur sont requis');
        }
        const result = await this.groupsService.addUserToGroup(body.id, body.username);
        if ('error' in result) {
            throw new BadRequestException(result.error);
        }
        return result;
    }

    // @UseGuards(AuthGuard)
    // @Post('joinGroup')
    // async joinGroup(@Req() req: IAuthInfoRequest, @Body() body: { id: number }) {
    //     if (!body.id) {
    //         throw new BadRequestException('ID du groupe est requis');
    //     }
    //     const result = await this.groupsService.joinGroup(body.id, req.user.username);
    //     if ('error' in result) {
    //         throw new BadRequestException(result.error);
    //     }
    //     return result;
    // }
    
    @UseGuards(AuthGuard)
    @Get('allUserGroups')
    findAllByUser(@Req() req: IAuthInfoRequest) {
        return this.groupsService.findAllByUser(req.user.username);
    }

    @Get('group/:id')
    findOneGroup(@Req() req: IAuthInfoRequest, @Param('id') id: number) {
        return this.groupsService.findOneGroup(id);
    }
}
