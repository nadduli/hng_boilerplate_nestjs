import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'model_id',
    example: '1',
  })
  @IsUUID()
  model_id: string;

  @ApiProperty({
    description: 'model_type',
    example: 'post, blog, article',
  })
  @IsString()
  @IsNotEmpty()
  model_type: string;

  @ApiProperty({
    description: 'content',
    example: 'This is a comment made on an article',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
