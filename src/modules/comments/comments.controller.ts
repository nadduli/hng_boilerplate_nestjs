import {
  Controller,
  Get,
  Query,
  Patch,
  Param,
  Body,
  Req,
  Post,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Comments')
@Controller('comments')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}
  @Post('add')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add comment' })
  @ApiResponse({ status: 201, description: 'Created comment successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async createComment(@Req() req, @Body() createCommentDto: CreateCommentDto) {
    const id = req.user.id;
    return await this.commentsService.createComment(id, createCommentDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comments' })
  @ApiResponse({ status: 200, description: 'Get comments successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiQuery({ name: 'model_type', required: true, type: String })
  @ApiQuery({ name: 'model_id', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getComments(
    @Query('model_type') modelType: string,
    @Query('model_id') modelId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const comments = await this.commentsService.getComments(modelType, modelId, page, limit);
    return comments;
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comment by id' })
  @ApiResponse({ status: 200, description: 'Get comment by id successfully' })
  async getCommentById(@Param('id') commentId: string) {
    const comment = await this.commentsService.getCommentById(commentId);
    return comment;
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update comment' })
  @ApiResponse({ status: 200, description: 'Update comment successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async updateComment(@Req() req, @Param('id') commentId: string, @Body() updateCommentDto: UpdateCommentDto) {
    const userId = req.user.id;

    try {
      const updatedComment = await this.commentsService.updateComment(userId, commentId, updateCommentDto);
      return updatedComment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('An error occurred while updating the comment');
      }
    }
  }
}
