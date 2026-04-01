import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Delete,
  Param,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

    @Post('register')
    async register(@Body() user: { username: string; password: string; mail: string }) {
        return this.usersService.create(user);
    }

    @UseGuards(AuthGuard)
    @Delete('delete')
    async deleteUser(@Request() req: any) {
        // Dans le payload JWT, l'ID est stocké dans la propriété 'sub'
        await this.usersService.delete(Number(req.user.sub));
        return { message: 'Utilisateur supprimé avec succès' };
    }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    // On vérifie que le nom d'utilisateur et le mot de passe sont fournis
    if (!signInDto.username || !signInDto.password) {
      throw new Error('Nom d\'utilisateur mot de passe sont requis');
    }
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req:any) {
    return req.user;
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Request() req:any) {
    return this.authService.logout(req.user);
  }
}
