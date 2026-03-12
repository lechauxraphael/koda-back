import { Controller, BadRequestException, NotFoundException, Body, Dependencies, Post, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';
import { ParseIntPipe } from '@nestjs/common';

@Controller('users')
@Dependencies(UsersService)
export class UsersController {
    usersService: UsersService;
    constructor(usersService: UsersService) {
        this.usersService = usersService;
    }

    @UseGuards(AuthGuard)
    @Get('me')
    async getProfile(@Req() req: IAuthInfoRequest) {
        const user = await this.usersService.findOnePlayer(req.user.sub);
                if (!user) throw new NotFoundException('Utilisateur non trouvé');
        return {
            userId: user.userId,
            username: user.username,
            mail: user.mail,
            role: user.role,
        };
    }

    @UseGuards(AuthGuard)
    @Get('allUsers')
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':userId')
    async getUser(@Param('userId', ParseIntPipe) userId: number) {
        const user = await this.usersService.findOnePlayer(userId);
        if (!user) throw new NotFoundException('Utilisateur non trouvé');
        return {
            userId: user.userId,
            username: user.username,
            mail: user.mail,
            role: user.role,
        };
    }
}