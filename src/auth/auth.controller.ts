import {
  BadRequestException,
  NotFoundException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Post,
  Request,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { MessageResponseDto } from 'src/common/dto/message-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Creer un compte utilisateur' })
  @ApiResponse({ status: 201, description: 'Compte cree' })
  @Post('register')
  async register(@Body() user: RegisterDto) {
    return this.usersService.create(user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer le compte connecte' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur supprime',
    type: MessageResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: any,
    @Body() body: { newPassword: string }
  ) {
    await this.usersService.updatePassword(Number(req.user.sub), body.newPassword);
    return { message: 'Mot de passe mis à jour' };
  }

  @ApiOperation({ summary: 'Connecter un utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion reussie' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: LoginDto) {
    if (!signInDto.username || !signInDto.password) {
      throw new BadRequestException(
        "Nom d'utilisateur et mot de passe sont requis",
      );
    }
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recuperer le profil depuis le token' })
  @ApiResponse({ status: 200, description: 'Payload du token retourne' })
  @ApiResponse({ status: 401, description: 'Token manquant ou invalide' })
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deconnecter l utilisateur courant' })
  @ApiResponse({ status: 201, description: 'Deconnexion effectuee' })
  @ApiResponse({ status: 401, description: 'Token manquant ou invalide' })
  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Request() req: any) {
    return this.authService.logout(req.user);
  }

  @ApiOperation({ summary: 'Trouver un compte par email' })
  @ApiResponse({ status: 200, description: 'Compte trouvé' })
  @ApiResponse({ status: 404, description: 'Aucun compte trouvé' })
  @Post('find-by-email')
  async findByEmail(@Body() body: { mail: string }) {
    const user = await this.usersService.findByMail(body.mail);
    if (!user) throw new NotFoundException('Aucun compte trouvé');
    return { id: user.id, username: user.username };
  }

  @ApiOperation({ summary: 'Réinitialiser le mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe mis à jour' })
  @Post('reset-password')
  async resetPassword(@Body() body: { userId: number; newPassword: string }) {
    await this.usersService.updatePassword(body.userId, body.newPassword);
    return { message: 'Mot de passe mis à jour' };
  }
}