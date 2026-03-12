import {Body,  Controller,  Get,  HttpCode,  HttpStatus,  Post,  Request,  UnauthorizedException,  UseGuards} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  register(@Body() body: { username: string; password: string; mail: string }) {
    return this.authService.register(body.username, body.password, body.mail);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('delete')
  deleteUser(@Request() req: any) {
    const userId = req.user.sub;
    return this.authService.deleteUser(userId);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.signIn(body.username, body.password);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout() {
    return {
      success: true,
      message: 'Deconnecté avec succès',
    }
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req:any) {
    return req.user;
  }
}
