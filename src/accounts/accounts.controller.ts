import { Controller, BadRequestException, NotFoundException, Get, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AuthGuard } from '../auth/auth.guard';
import type { IAuthInfoRequest } from '../auth/auth.guard';
import { Account } from './accounts.entity';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

    @UseGuards(AuthGuard)
    @Post('createAccount')
    create(@Req() req: IAuthInfoRequest, @Body() body: { name: string }) {
        if (!body || !body.name) {
            throw new BadRequestException('Le nom du groupe est requis');
        }
        const accountData = {
            name: body.name,
            creator: req.user.username
        };
        return this.accountsService.create(accountData as Account);
    }

    @UseGuards(AuthGuard)
    @Post('deleteAccount')
    async delete(@Body() body: { accountId: number }) {
        if (!body || !body.accountId) {
            throw new BadRequestException("L'ID du compte est requis dans le corps de la requête");
        }
        
        const deleted = await this.accountsService.delete(body.accountId);
        if (!deleted) {
            throw new NotFoundException("Le compte n'existe pas ou a déjà été supprimé");
        }
        
        return { message: 'Compte supprimé avec succès' };
    }
    
    @UseGuards(AuthGuard)
    @Get('allUserAccounts')
    findAllByUser(@Req() req: IAuthInfoRequest) {
        return this.accountsService.findAllByUser(req.user.username);
    }

    @UseGuards(AuthGuard)
    @Get('account/:accountId')
    findOneAccount(@Req() req: IAuthInfoRequest, @Param('accountId') accountId: number) {
        return this.accountsService.findOneAccount(accountId);
    }
}

