import {
  Controller,
  NotFoundException,
  ForbiddenException,
  Body,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${extname(file.originalname)}`);
  },
});

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
  @ApiOperation({ summary: "Recuperer le profil de l'utilisateur connecte" })
  @ApiResponse({ status: 200, description: 'Utilisateur connecte' })
  @ApiResponse({ status: 401, description: 'Token manquant ou invalide' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @UseGuards(AuthGuard)
  @Get('me')
  async getProfile(@Req() req: IAuthInfoRequest) {
    const user = await this.usersService.findOnePlayer(req.user.sub);

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return {
      id: user.id,
      username: user.username,
      mail: user.mail,
      role: user.role,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      tags: user.tags,
      firstname: user.firstname,
      lastname: user.lastname,
      CreationDate: user.CreationDate,
      LastConnectionDate: user.LastConnectionDate,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Modifier le profil de l'utilisateur connecte" })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @ApiResponse({ status: 401, description: 'Token manquant ou invalide' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @UseGuards(AuthGuard)
  @Patch('me')
  async updateProfile(
    @Req() req: IAuthInfoRequest,
    @Body() body: { username?: string; mail?: string; bio?: string; tags?: string; firstname?: string; lastname?: string },
  ) {
    return this.usersService.update(Number(req.user.sub), body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Modifier la photo de profil" })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Avatar mis à jour' })
  @ApiResponse({ status: 401, description: 'Token manquant ou invalide' })
  @UseGuards(AuthGuard)
  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadAvatar(
    @Req() req: IAuthInfoRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = `/uploads/${file.filename}`;
    await this.usersService.update(Number(req.user.sub), { avatar: url });
    return { url };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Modifier la photo de bannière" })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Bannière mise à jour' })
  @ApiResponse({ status: 401, description: 'Token manquant ou invalide' })
  @UseGuards(AuthGuard)
  @Patch('me/banner')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadBanner(
    @Req() req: IAuthInfoRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = `/uploads/${file.filename}`;
    await this.usersService.update(Number(req.user.sub), { banner: url });
    return { url };
  }

  @ApiOperation({ summary: 'Recuperer un utilisateur par son identifiant' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Utilisateur trouve' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @Get(':userId')
  async getUser(@Param('userId') userId: number) {
    const user = await this.usersService.findOnePlayer(Number(userId));

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return {
      id: user.id,
      username: user.username,
      mail: user.mail,
      role: user.role,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      tags: user.tags,
      firstname: user.firstname,
      lastname: user.lastname,
      CreationDate: user.CreationDate,
      LastConnectionDate: user.LastConnectionDate,
    };
  }

  @UseGuards(AuthGuard)
  @Get('admin/all')
  async adminGetAll(@Req() req: IAuthInfoRequest) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Patch('admin/:id/active')
  async adminSetActive(
    @Req() req: IAuthInfoRequest,
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    await this.usersService.setActive(Number(id), body.isActive);
    return { message: 'Statut mis à jour' };
  }
}