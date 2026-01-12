import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class ToggleCompletionDto {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2024-01-05',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({
    description: 'ID of the user completing this',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
