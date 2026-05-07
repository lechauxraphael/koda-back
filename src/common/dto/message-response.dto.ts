import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation effectuee avec succes' })
  message!: string;
}
