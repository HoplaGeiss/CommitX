import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteCommitmentDto {
  @ApiProperty({
    description: 'ID of the user deleting/leaving the commitment',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
