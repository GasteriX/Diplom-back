import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackDto } from './track.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'Starpath' })
  recordTitle!: string;

  @ApiPropertyOptional({ example: 'The Dark Side of the Moon' })
  title?: string;

  @ApiProperty({ enum: ['Vinyl', 'CD', 'Cassette'], example: 'Vinyl' })
  media_type!: 'Vinyl' | 'CD' | 'Cassette';

  @ApiProperty({ example: 29.99 })
  price!: number;

  @ApiProperty({ example: 5 })
  stock!: number;

  @ApiProperty({ example: 'UK' })
  country!: string;

  @ApiProperty({ example: 'Rock' })
  genre!: string;

  @ApiProperty({
    type: [String],
    example: ['Black Metal', 'Doom Metal', 'Progressive Metal', 'Symphonic Metal'],
  })
  styles!: string[];

  @ApiProperty({ example: '810079501328' })
  barcode!: string;

  @ApiProperty({ example: 'JPV10061' })
  article!: string;

  @ApiPropertyOptional({ example: '20 Buck Spin', nullable: true })
  label?: string | null;

  @ApiProperty({ example: 1 })
  vinylCount!: number;

  @ApiProperty({ type: [String], example: ['Dream Unending', 'Worm'] })
  performers!: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Neon', 'Blue', 'Album', 'Limited', 'Silver', 'Violet', 'Black'],
  })
  colorFeatures?: string[];

  @ApiProperty({ example: 2023 })
  releaseYear!: number;

  @ApiPropertyOptional({ example: 'Dream Unending' })
  artistName?: string;

  @ApiPropertyOptional({ example: 'Rock' })
  genreName?: string;

  @ApiPropertyOptional({ example: '20 Buck Spin', nullable: true })
  labelName?: string | null;

  @ApiPropertyOptional({
    type: [TrackDto],
    example: [
      { number: 1, title: 'Speak to Me', duration: '00:01:30' },
      { number: 2, title: 'Breathe', duration: '00:02:43' },
    ],
  })
  tracks?: TrackDto[];
}

