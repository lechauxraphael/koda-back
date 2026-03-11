import { Controller, BadRequestException, NotFoundException, Body, Dependencies, Post, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';
import { register } from 'module';


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
            role: user.role,
            dateCreation: user.dateCreation,
            dateDerniereConnexion: user.dateDerniereConnexion,
        };
    }

    
    @Post('register')
    async register(@Body() user: { username: string; password: string; mail: string }) {
        return this.usersService.create(user);
    }

    @Get(':userId')
    async getUser(@Param('userId') userId: number) {
        const user = await this.usersService.findOnePlayer(Number(userId));
        if (!user) throw new NotFoundException('Utilisateur non trouvé');
        return {
            userId: user.userId,
            username: user.username,
            role: user.role,
            dateCreation: user.dateCreation,
            dateDerniereConnexion: user.dateDerniereConnexion,
        };
    }

    @UseGuards(AuthGuard)
    @Get()
    findAll() {
        return this.usersService.findAll();
    }
}