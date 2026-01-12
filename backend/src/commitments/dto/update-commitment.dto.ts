import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateCommitmentDto {
  @ApiProperty({
    description: 'The title of the commitment',
    example: 'Exercise daily',
    minLength: 1,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  title?: string;
}

