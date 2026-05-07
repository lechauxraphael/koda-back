import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Sortir les poubelles',
    description: 'Titre de la tache',
  })
  title!: string;

  @ApiProperty({
    example: 'Sortir les poubelles avant 20h',
    description: 'Description de la tache',
  })
  description!: string;
}

export class TaskIdDto {
  @ApiProperty({ example: 1, description: 'Identifiant de la tache' })
  id!: number;
}
