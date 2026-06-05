import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TrackDto } from './track.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Starpath' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  recordTitle?: string;

  @ApiPropertyOptional({ example: 'The Dark Side of the Moon' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: ['Vinyl', 'CD', 'Cassette'], example: 'Vinyl' })
  @IsOptional()
  @IsIn(['Vinyl', 'CD', 'Cassette'])
  media_type?: 'Vinyl' | 'CD' | 'Cassette';

  @ApiPropertyOptional({ example: 24.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 'UK' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  country?: string;

  @ApiPropertyOptional({ example: 'Rock' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  genre?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Black Metal', 'Doom Metal', 'Progressive Metal', 'Symphonic Metal'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];

  @ApiPropertyOptional({ example: '810079501328' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  barcode?: string;

  @ApiPropertyOptional({ example: 'JPV10061' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  article?: string;

  @ApiPropertyOptional({ example: '20 Buck Spin', nullable: true })
  @IsOptional()
  @IsString()
  label?: string | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vinylCount?: number;

  @ApiPropertyOptional({ type: [String], example: ['Dream Unending', 'Worm'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  performers?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Neon', 'Blue', 'Album', 'Limited', 'Silver', 'Violet', 'Black'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colorFeatures?: string[];

  @ApiPropertyOptional({ example: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  releaseYear?: number;

  @ApiPropertyOptional({ example: 'Dream Unending' })
  @IsOptional()
  @IsString()
  artistName?: string;

  @ApiPropertyOptional({ example: 'Rock' })
  @IsOptional()
  @IsString()
  genreName?: string;

  @ApiPropertyOptional({ example: '20 Buck Spin', nullable: true })
  @IsOptional()
  @IsString()
  labelName?: string | null;

  @ApiPropertyOptional({
    type: [TrackDto],
    example: [
      { number: 1, title: 'Speak to Me', duration: '00:01:30' },
      { number: 2, title: 'Breathe', duration: '00:02:43' },
    ],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TrackDto)
  tracks?: TrackDto[];
}
