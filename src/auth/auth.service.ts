import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async register(username: string, password: string, mail: string) {
    
    const existingUser = await this.usersService.findOne(username);
    if (existingUser) {
      return {
        success: false,
        message: 'Ce nom d’utilisateur existe déjà',
      };
    }
    // hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    const money = 1000;
    // créer l'utilisateur
    const user = await this.usersService.create({
      username,
      password: hashedPassword,
      mail,
      
    });

    return {
      success: true,
      message: "Utilisateur crée avec succès",
      username: user.username,
      userId: user.userId,
      mail: user.mail,
    };
  }

  async signIn(username: string, password: string) {
    const user = await this.usersService.findOne(username);
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid password');

    const payload = { 
      sub: user.userId, 
      username: user.username, 
      mail: user.mail, 
      role: user.role 
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
  

  async deleteUser(userId: number) {
    return await this.usersService.delete(userId);
  }
}
