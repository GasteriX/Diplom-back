import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrackDto } from './track.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Starpath' })
  recordTitle?: string;

  @ApiPropertyOptional({ example: 'The Dark Side of the Moon' })
  title?: string;

  @ApiPropertyOptional({ enum: ['Vinyl', 'CD', 'Cassette'], example: 'Vinyl' })
  media_type?: 'Vinyl' | 'CD' | 'Cassette';

  @ApiPropertyOptional({ example: 24.99 })
  price?: number;

  @ApiPropertyOptional({ example: 3 })
  stock?: number;

  @ApiPropertyOptional({ example: 'UK' })
  country?: string;

  @ApiPropertyOptional({ example: 'Rock' })
  genre?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Black Metal', 'Doom Metal', 'Progressive Metal', 'Symphonic Metal'],
  })
  styles?: string[];

  @ApiPropertyOptional({ example: '810079501328' })
  barcode?: string;

  @ApiPropertyOptional({ example: 'JPV10061' })
  article?: string;

  @ApiPropertyOptional({ example: '20 Buck Spin', nullable: true })
  label?: string | null;

  @ApiPropertyOptional({ example: 1 })
  vinylCount?: number;

  @ApiPropertyOptional({ type: [String], example: ['Dream Unending', 'Worm'] })
  performers?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Neon', 'Blue', 'Album', 'Limited', 'Silver', 'Violet', 'Black'],
  })
  colorFeatures?: string[];

  @ApiPropertyOptional({ example: 2023 })
  releaseYear?: number;

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

