import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  @ApiResponse({ status: 401, description: 'Token manquant ou invalide' })
  @UseGuards(AuthGuard)
  @Delete('delete')
  async deleteUser(@Request() req: any) {
    // Dans le payload JWT, l'ID est stocké dans la propriété 'sub'
    await this.usersService.delete(Number(req.user.sub));
    return { message: 'Utilisateur supprimé avec succès' };
  }

  @ApiOperation({ summary: 'Connecter un utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion reussie' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: LoginDto) {
    // On vérifie que le nom d'utilisateur et le mot de passe sont fournis
    if (!signInDto.username || !signInDto.password) {
      throw new Error("Nom d'utilisateur mot de passe sont requis");
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
}
