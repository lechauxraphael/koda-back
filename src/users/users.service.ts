import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)

    private usersRepository: Repository<User>,
  ) {}

  async create(user: { username: string; password: string; mail: string }) {
    const newUser = this.usersRepository.create(user);
    return this.usersRepository.save(newUser);
  }

  async delete(userId: number) {
    return await this.usersRepository.delete({ userId });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(username: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { username } });
    return user ?? undefined;
  }

  async findOnePlayer(userId: number): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { userId: userId } });
    return user ?? undefined;
  }
}
