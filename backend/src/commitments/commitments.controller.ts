import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CommitmentsService } from './commitments.service';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';
import { ToggleCompletionDto } from './dto/toggle-completion.dto';
import { JoinCommitmentDto } from './dto/join-commitment.dto';
import { DeleteCommitmentDto } from './dto/delete-commitment.dto';
import { Commitment } from './entities/commitment.entity';
import { Completion } from './entities/completion.entity';

@ApiTags('commitments')
@Controller('commitments')
export class CommitmentsController {
  constructor(private readonly commitmentsService: CommitmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new commitment' })
  @ApiResponse({
    status: 201,
    description: 'The commitment has been successfully created.',
    type: Commitment,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() createCommitmentDto: CreateCommitmentDto): Promise<Commitment> {
    return this.commitmentsService.create(createCommitmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all commitments' })
  @ApiResponse({
    status: 200,
    description: 'Returns all commitments.',
    type: [Commitment],
  })
  async findAll(@Query('userId') userId?: string): Promise<Commitment[]> {
    return this.commitmentsService.findAll(userId);
  }

  // DEBUG ENDPOINT - Remove after testing Sentry
  // Note: Must be defined before :id routes to avoid route matching conflicts
  @Get('debug-sentry')
  @ApiTags('debug')
  @ApiOperation({ 
    summary: 'Test Sentry error tracking', 
    description: 'Throws a test error to verify Sentry integration is working correctly. Use this endpoint to test error tracking, alerts, and logging.',
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Intentionally throws a test error that should be captured by Sentry',
  })
  getError() {
    throw new Error('My first Sentry error!');
  }

  @Get('collaborative/:userId')
  @ApiOperation({ summary: 'Get all collaborative commitments for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all collaborative commitments where user is owner or participant.',
    type: [Commitment],
  })
  async getCollaborativeCommitments(@Param('userId') userId: string): Promise<Commitment[]> {
    return this.commitmentsService.getCollaborativeCommitments(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a commitment by ID' })
  @ApiParam({ name: 'id', description: 'Commitment ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the commitment.',
    type: Commitment,
  })
  @ApiResponse({ status: 404, description: 'Commitment not found.' })
  async findOne(@Param('id') id: string): Promise<Commitment> {
    return this.commitmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a commitment' })
  @ApiParam({ name: 'id', description: 'Commitment ID' })
  @ApiResponse({
    status: 200,
    description: 'The commitment has been successfully updated.',
    type: Commitment,
  })
  @ApiResponse({ status: 404, description: 'Commitment not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateCommitmentDto: UpdateCommitmentDto,
  ): Promise<Commitment> {
    return this.commitmentsService.update(id, updateCommitmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a commitment or leave a collaborative challenge' })
  @ApiParam({ name: 'id', description: 'Commitment ID' })
  @ApiBody({ type: DeleteCommitmentDto })
  @ApiResponse({
    status: 204,
    description: 'The commitment has been successfully deleted or user has left the challenge.',
  })
  @ApiResponse({ status: 404, description: 'Commitment not found.' })
  async remove(@Param('id') id: string, @Body() deleteDto: DeleteCommitmentDto): Promise<void> {
    return this.commitmentsService.remove(id, deleteDto.userId);
  }

  @Post(':id/completions')
  @ApiOperation({ summary: 'Toggle completion for a specific date' })
  @ApiParam({ name: 'id', description: 'Commitment ID' })
  @ApiBody({ type: ToggleCompletionDto })
  @ApiResponse({
    status: 200,
    description: 'Returns all completions for the commitment.',
    type: [Completion],
  })
  @ApiResponse({ status: 404, description: 'Commitment not found.' })
  async toggleCompletion(
    @Param('id') id: string,
    @Body() toggleCompletionDto: ToggleCompletionDto,
  ): Promise<Completion[]> {
    return this.commitmentsService.toggleCompletion(
      id,
      toggleCompletionDto.date,
      toggleCompletionDto.userId
    );
  }

  @Get(':id/completions')
  @ApiOperation({ summary: 'Get all completions for a commitment' })
  @ApiParam({ name: 'id', description: 'Commitment ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all completions for the commitment.',
    type: [Completion],
  })
  async getCompletions(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ): Promise<Completion[]> {
    return this.commitmentsService.getCompletionsForCommitment(id, userId);
  }

  @Get('completions/all')
  @ApiOperation({ summary: 'Get all completions across all commitments' })
  @ApiResponse({
    status: 200,
    description: 'Returns all completions.',
    type: [Completion],
  })
  async getAllCompletions(): Promise<Completion[]> {
    return this.commitmentsService.getAllCompletions();
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Generate or regenerate share code for a commitment' })
  @ApiParam({ name: 'id', description: 'Commitment ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the share code.',
  })
  @ApiResponse({ status: 404, description: 'Commitment not found.' })
  async generateShareCode(@Param('id') id: string): Promise<{ shareCode: string }> {
    return this.commitmentsService.generateShareCode(id);
  }

  @Post('join/:code')
  @ApiOperation({ summary: 'Join a collaborative challenge via share code' })
  @ApiParam({ name: 'code', description: 'Share code' })
  @ApiBody({ type: JoinCommitmentDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined the challenge.',
    type: Commitment,
  })
  @ApiResponse({ status: 404, description: 'Invalid share code.' })
  async joinChallenge(
    @Param('code') code: string,
    @Body() joinDto: JoinCommitmentDto,
  ): Promise<Commitment> {
    return this.commitmentsService.joinChallenge(code, joinDto.userId);
  }

  @Post('view/:code')
  @ApiOperation({ summary: 'View a shared challenge via share code (read-only)' })
  @ApiParam({ name: 'code', description: 'Share code' })
  @ApiResponse({
    status: 200,
    description: 'Returns the shared challenge.',
    type: Commitment,
  })
  @ApiResponse({ status: 404, description: 'Invalid share code.' })
  async viewSharedChallenge(@Param('code') code: string): Promise<Commitment> {
    return this.commitmentsService.viewSharedChallenge(code);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get all participants for a collaborative commitment' })
  @ApiParam({ name: 'id', description: 'Commitment ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of participant user IDs.',
  })
  async getParticipants(@Param('id') id: string): Promise<{ userIds: string[] }> {
    const userIds = await this.commitmentsService.getParticipants(id);
    return { userIds };
  }
}

