import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new UnauthorizedException();
    }

    let isPasswordValid = await bcrypt.compare(pass, user.password);

    // Compatibilite temporaire pour les anciens comptes en clair.
    if (!isPasswordValid && user.password === pass) {
      await this.usersService.updatePassword(user.id, pass);
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    await this.usersService.updateLastConnection(user.id);

    const payload = { sub: user.id, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async logout(user: any) {
    return { message: 'Logout successful' };
  }
}
