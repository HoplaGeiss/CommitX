import { ApiProperty } from '@nestjs/swagger';

export class Completion {
  @ApiProperty({
    description: 'Unique identifier for the completion',
    example: '1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the associated commitment',
    example: '1234567890',
  })
  commitmentId: string;

  @ApiProperty({
    description: 'ID of the user who completed this',
    example: 'user-123',
  })
  userId: string;

  @ApiProperty({
    description: 'Date of completion in YYYY-MM-DD format',
    example: '2024-01-05',
  })
  date: string;

  @ApiProperty({
    description: 'ISO timestamp of when the completion was created',
    example: '2024-01-05T12:00:00.000Z',
  })
  createdAt: string;
}

