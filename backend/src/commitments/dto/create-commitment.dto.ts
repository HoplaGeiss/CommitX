import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';

export class CreateCommitmentDto {
  @ApiProperty({
    description: 'The title of the commitment',
    example: 'Exercise daily',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'Type of challenge: self, collaborative, or shared',
    example: 'collaborative',
    enum: ['self', 'collaborative', 'shared'],
    default: 'self',
  })
  @IsEnum(['self', 'collaborative', 'shared'])
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'ID of the user creating the commitment',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

