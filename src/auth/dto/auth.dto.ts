import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'raph', description: 'Nom utilisateur unique' })
  username!: string;

  @ApiProperty({ example: 'raph@example.com', description: 'Adresse email' })
  mail!: string;

  @ApiProperty({
    example: 'MotDePasse123!',
    description: 'Mot de passe du compte',
  })
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'raph', description: 'Nom utilisateur' })
  username!: string;

  @ApiProperty({
    example: 'MotDePasse123!',
    description: 'Mot de passe du compte',
  })
  password!: string;
}
