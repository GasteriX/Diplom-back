import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class TrackDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  number!: number;

  @ApiProperty({ example: 'Speak to Me' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({ example: '00:01:30', nullable: true })
  @IsOptional()
  @IsString()
  duration?: string | null;
}
