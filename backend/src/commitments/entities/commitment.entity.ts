import { ApiProperty } from '@nestjs/swagger';

export class Commitment {
  @ApiProperty({
    description: 'Unique identifier for the commitment',
    example: '1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'The title of the commitment',
    example: 'Exercise daily',
  })
  title: string;

  @ApiProperty({
    description: 'Type of challenge: self, collaborative, or shared',
    example: 'collaborative',
    enum: ['self', 'collaborative', 'shared'],
  })
  type: string;

  @ApiProperty({
    description: 'ID of the user who owns the commitment',
    example: 'user-123',
  })
  userId: string;

  @ApiProperty({
    description: 'Share code for joining/viewing the challenge',
    example: 'ABC123',
    required: false,
  })
  shareCode?: string;

  @ApiProperty({
    description: 'ID of the original owner (for shared challenges)',
    example: 'user-456',
    required: false,
  })
  ownerId?: string;

  @ApiProperty({
    description: 'ISO timestamp of when the commitment was created',
    example: '2024-01-05T12:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'ISO timestamp of when the commitment was last updated',
    example: '2024-01-05T12:00:00.000Z',
  })
  updatedAt: string;
}

