import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async createComment(userId: string, createCommentDto: CreateCommentDto) {
    const { model_id, model_type, content } = createCommentDto;

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment cannot be empty');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const comment = this.commentRepository.create({
      model_id,
      model_type,
      content,
      status: 'approved',
    });

    const savedComment = await this.commentRepository.save(comment);
    return {
      status: 'success',
      message: 'Created comment successfully',
      data: {
        id: savedComment.id,
        content: savedComment.content,
        model_id: savedComment.model_id,
        model_type: savedComment.model_type,
        created_at: savedComment.created_at,
        updated_at: savedComment.updated_at,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        },
      },
    };
  }

  async getComments(model_type: string, model_id: string, page: number = 1, limit: number = 10) {
    const options: FindManyOptions<Comment> = {
      where: { model_id, model_type },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    };

    try {
      const comments = await this.commentRepository.find(options);

      const formattedComments = comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        model_id: comment.model_id,
        model_type: comment.model_type,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: {
          id: comment.user.id,
          first_name: comment.user.first_name,
          last_name: comment.user.last_name,
          email: comment.user.email,
        },
      }));

      return {
        status_code: HttpStatus.OK,
        message: 'Comments fetched successfully',
        data: formattedComments,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while fetching comments',
        status_code: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
  async getCommentById(commentId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment not found`);
    }
    return {
      status_code: HttpStatus.OK,
      message: 'Comment fetched successfully',
      data: comment,
    };
  }

  async updateComment(userId: string, commentId: string, updateCommentDto: UpdateCommentDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['user'] });
    if (!comment) {
      throw new NotFoundException({
        error: 'Comment not found',
        status_code: HttpStatus.NOT_FOUND,
      });
    }

    if (comment.user.id !== user.id) {
      throw new ForbiddenException('You do not have permission to update this comment');
    }

    try {
      const { content } = updateCommentDto;
      comment.content = content;
      const updatedComment = await this.commentRepository.save(comment);
      return {
        status_code: HttpStatus.OK,
        message: 'Comment updated successfully',
        data: updatedComment,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Internal server error');
      }
    }
  }
}
