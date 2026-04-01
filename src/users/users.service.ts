import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {  Users } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)

    private usersRepository: Repository<Users>,
  ) {}

  async create(user: { username: string; password: string; mail: string }) {
    const newUser = this.usersRepository.create(user);
    return this.usersRepository.save(newUser);
  }

  async delete(id: number) {
    await this.usersRepository.delete(id);
  }

  async findAll(): Promise<Users[]> {
    return this.usersRepository.find();
  }

  async findOne(username: string): Promise<Users | undefined> {
    const user = await this.usersRepository.findOne({ where: { username } });
    return user ?? undefined;
  }

  async findOnePlayer(id: number): Promise<Users | undefined> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user ?? undefined;
  }

  async updateLastConnection(id: number): Promise<void> {
    await this.usersRepository.update(id, {
      LastConnectionDate: new Date(),
    });
  }
}
