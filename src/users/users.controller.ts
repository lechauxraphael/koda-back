import {
  Controller,
  BadRequestException,
  NotFoundException,
  Body,
  Post,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Lister tous les utilisateurs' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  @Get('allUsers')
  findAll() {
    return this.usersService.findAll();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recuperer le profil de l utilisateur connecte' })
  @ApiResponse({ status: 200, description: 'Utilisateur connecte' })
  @ApiResponse({ status: 401, description: 'Token manquant ou invalide' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @UseGuards(AuthGuard)
  @Get('me')
  async getProfile(@Req() req: IAuthInfoRequest) {
    const user = await this.usersService.findOnePlayer(req.user.sub);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      CreationDate: user.CreationDate,
      LastConnectionDate: user.LastConnectionDate,
    };
  }

  @ApiOperation({ summary: 'Recuperer un utilisateur par son identifiant' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Utilisateur trouve' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @Get(':userId')
  async getUser(@Param('userId') userId: number) {
    const user = await this.usersService.findOnePlayer(Number(userId));
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      CreationDate: user.CreationDate,
      LastConnectionDate: user.LastConnectionDate,
    };
  }
}
