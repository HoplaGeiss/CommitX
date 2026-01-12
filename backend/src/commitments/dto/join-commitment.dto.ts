import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class JoinCommitmentDto {
  @ApiProperty({
    description: 'ID of the user joining the challenge',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

