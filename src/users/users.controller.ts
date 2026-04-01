import { Controller, BadRequestException, NotFoundException, Body, Post, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';


@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('allUsers')
    findAll() {
        return this.usersService.findAll();
    }

    @UseGuards(AuthGuard)
    @Get('me')
    async getProfile(@Req() req: IAuthInfoRequest) {
        const user = await this.usersService.findOnePlayer(req.user.sub);
        if (!user) throw new NotFoundException('Utilisateur non trouvé');
        return {
            userId: user.userId,
            username: user.username,
            role: user.role,
            CreationDate: user.CreationDate,
            LastConnectionDate: user.LastConnectionDate,
        };
    }

    @Get(':userId')
    async getUser(@Param('userId') userId: number) {
        const user = await this.usersService.findOnePlayer(Number(userId));
        if (!user) throw new NotFoundException('Utilisateur non trouvé');
        return {
            userId: user.userId,
            username: user.username,
            role: user.role,
            CreationDate: user.CreationDate,
            LastConnectionDate: user.LastConnectionDate,
        };
    }
}