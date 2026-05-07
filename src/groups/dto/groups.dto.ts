import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'Famille', description: 'Nom du groupe a creer' })
  name!: string;
}

export class GroupIdDto {
  @ApiProperty({ example: 1, description: 'Identifiant du groupe' })
  id!: number;
}

export class AddUserToGroupDto {
  @ApiProperty({ example: 1, description: 'Identifiant du groupe' })
  id!: number;

  @ApiProperty({ example: 'lea', description: 'Nom utilisateur a inviter' })
  username!: string;
}
