import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from '../../comments/comments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../comments/entities/comment.entity';
import { User } from '../../user/entities/user.entity';
import { CreateCommentDto } from '../../comments/dto/create-comment.dto';
import { UpdateCommentDto } from '../../comments/dto/update-comment.dto';
import { NotFoundException, BadRequestException, ForbiddenException, HttpStatus } from '@nestjs/common';

const mockCommentRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockUserRepository = () => ({
  findOne: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepository: MockRepository<Comment>;
  let userRepository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useFactory: mockCommentRepository },
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentRepository = module.get<MockRepository<Comment>>(getRepositoryToken(Comment));
    userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createComment', () => {
    it('should create and return a comment', async () => {
      const userId = 'some-user-id';
      const createCommentDto: CreateCommentDto = {
        model_id: 'model-id',
        model_type: 'model-type',
        content: 'This is a comment',
      };
      const user = { id: userId, first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com' };
      const savedComment = {
        id: 'comment-id',
        ...createCommentDto,
        created_at: new Date(),
        updated_at: new Date(),
        user,
      };

      userRepository.findOne.mockResolvedValue(user);
      commentRepository.create.mockReturnValue(savedComment);
      commentRepository.save.mockResolvedValue(savedComment);

      const result = await service.createComment(userId, createCommentDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(commentRepository.create).toHaveBeenCalledWith({
        model_id: createCommentDto.model_id,
        model_type: createCommentDto.model_type,
        content: createCommentDto.content,
        status: 'approved',
      });
      expect(commentRepository.save).toHaveBeenCalledWith(savedComment);
      expect(result).toEqual({
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
      });
    });

    it('should throw an error if the comment content is empty', async () => {
      const userId = 'some-user-id';
      const createCommentDto: CreateCommentDto = {
        model_id: 'model-id',
        model_type: 'model-type',
        content: '',
      };

      await expect(service.createComment(userId, createCommentDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if the user is not found', async () => {
      const userId = 'some-user-id';
      const createCommentDto: CreateCommentDto = {
        model_id: 'model-id',
        model_type: 'model-type',
        content: 'This is a comment',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.createComment(userId, createCommentDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getComments', () => {
    it('should retrieve and return comments', async () => {
      const model_type = 'model-type';
      const model_id = 'model-id';
      const page = 1;
      const limit = 10;
      const comments = [
        {
          id: 'comment-id-1',
          content: 'First comment',
          model_id,
          model_type,
          created_at: new Date(),
          updated_at: new Date(),
          user: { id: 'user-id-1', first_name: 'Jane', last_name: 'Doe', email: 'jane.doe@example.com' },
        },
        {
          id: 'comment-id-2',
          content: 'Second comment',
          model_id,
          model_type,
          created_at: new Date(),
          updated_at: new Date(),
          user: { id: 'user-id-2', first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com' },
        },
      ];

      commentRepository.find.mockResolvedValue(comments);

      const result = await service.getComments(model_type, model_id, page, limit);

      expect(commentRepository.find).toHaveBeenCalledWith({
        where: { model_id, model_type },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['user'],
      });

      expect(result).toEqual({
        status: 'success',
        message: 'Comments fetched successfully',
        data: comments.map(comment => ({
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
        })),
      });
    });
  });

  describe('getCommentById', () => {
    it('should retrieve and return a comment by id', async () => {
      const commentId = 'comment-id';
      const comment = {
        id: commentId,
        content: 'This is a comment',
        model_id: 'model-id',
        model_type: 'model-type',
        created_at: new Date(),
        updated_at: new Date(),
        user: { id: 'user-id', first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com' },
      };

      commentRepository.findOne.mockResolvedValue(comment);

      const result = await service.getCommentById(commentId);

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id: commentId },
        relations: ['user'],
      });

      expect(result).toEqual({
        status_code: HttpStatus.OK,
        message: 'Comment fetched successfully',
        data: comment,
      });
    });

    it('should throw an error if the comment is not found', async () => {
      const commentId = 'comment-id';

      commentRepository.findOne.mockResolvedValue(null);

      await expect(service.getCommentById(commentId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateComment', () => {
    it('should update and return a comment', async () => {
      const userId = 'user-id';
      const commentId = 'comment-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };
      const user = { id: userId };
      const comment = {
        id: commentId,
        content: 'Old content',
        user,
        model_id: 'model-id',
        model_type: 'model-type',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const updatedComment = {
        ...comment,
        content: 'Updated content',
      };

      userRepository.findOne.mockResolvedValue(user);
      commentRepository.findOne.mockResolvedValue(comment);
      commentRepository.save.mockResolvedValue(updatedComment);

      const result = await service.updateComment(userId, commentId, updateCommentDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(commentRepository.findOne).toHaveBeenCalledWith({ where: { id: commentId }, relations: ['user'] });
      expect(commentRepository.save).toHaveBeenCalledWith(updatedComment);

      expect(result).toEqual({
        status_code: HttpStatus.OK,
        message: 'Comment updated successfully',
        data: updatedComment,
      });
    });

    it('should throw an error if the user is not found', async () => {
      const userId = 'user-id';
      const commentId = 'comment-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateComment(userId, commentId, updateCommentDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw an error if the comment is not found', async () => {
      const userId = 'user-id';
      const commentId = 'comment-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };

      userRepository.findOne.mockResolvedValue({ id: userId });
      commentRepository.findOne.mockResolvedValue(null);

      await expect(service.updateComment(userId, commentId, updateCommentDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw an error if the user is not the owner of the comment', async () => {
      const userId = 'user-id';
      const commentId = 'comment-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };
      const user = { id: userId };
      const comment = {
        id: commentId,
        content: 'Old content',
        user: { id: 'another-user-id' },
        model_id: 'model-id',
        model_type: 'model-type',
        created_at: new Date(),
        updated_at: new Date(),
      };

      userRepository.findOne.mockResolvedValue(user);
      commentRepository.findOne.mockResolvedValue(comment);

      await expect(service.updateComment(userId, commentId, updateCommentDto)).rejects.toThrow(ForbiddenException);
    });
  });
});
