import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateProductDto {
  @ApiProperty({ example: 'Starpath' })
  @IsString()
  @MinLength(1)
  recordTitle!: string;

  @ApiPropertyOptional({ example: 'The Dark Side of the Moon' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: ['Vinyl', 'CD', 'Cassette'], example: 'Vinyl' })
  @IsIn(['Vinyl', 'CD', 'Cassette'])
  media_type!: 'Vinyl' | 'CD' | 'Cassette';

  @ApiProperty({ example: 29.99 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiProperty({ example: 'UK' })
  @IsString()
  @MinLength(1)
  country!: string;

  @ApiProperty({ example: 'Rock' })
  @IsString()
  @MinLength(1)
  genre!: string;

  @ApiProperty({
    type: [String],
    example: ['Black Metal', 'Doom Metal', 'Progressive Metal', 'Symphonic Metal'],
  })
  @IsArray()
  @IsString({ each: true })
  styles!: string[];

  @ApiProperty({ example: '810079501328' })
  @IsString()
  @MinLength(1)
  barcode!: string;

  @ApiProperty({ example: 'JPV10061' })
  @IsString()
  @MinLength(1)
  article!: string;

  @ApiPropertyOptional({ example: '20 Buck Spin', nullable: true })
  @IsOptional()
  @IsString()
  label?: string | null;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vinylCount!: number;

  @ApiProperty({ type: [String], example: ['Dream Unending', 'Worm'] })
  @IsArray()
  @IsString({ each: true })
  performers!: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Neon', 'Blue', 'Album', 'Limited', 'Silver', 'Violet', 'Black'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colorFeatures?: string[];

  @ApiProperty({ example: 2023 })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  releaseYear!: number;

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
