import { Injectable, ConflictException } from '@nestjs/common';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './accounts.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    private usersService: UsersService,
  ) {}

  async findAll(): Promise<Account[]> {
    return this.accountsRepository.find();
  }

  async findAllByUser(username: string): Promise<Account[]> {
    return this.accountsRepository.find({ where: { creator: username } });
  }

  async findOneAccount(accountId: number): Promise<Account | { error: string }> {
    const account = await this.accountsRepository.findOne({
      where: { accountId },
    });
    return account ?? { error: 'Le compte n\'existe pas' };
  }

  async create(account: Account): Promise<Account> {
    return this.accountsRepository.save(account);
  }

  async delete(accountId: number) {
    const result = await this.accountsRepository.delete({ accountId });
    return result.affected && result.affected > 0;
  }
}
