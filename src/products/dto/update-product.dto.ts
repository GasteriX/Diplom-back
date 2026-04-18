import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrackDto } from './track.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'The Dark Side of the Moon' })
  title?: string;

  @ApiPropertyOptional({ enum: ['Vinyl', 'CD', 'Cassette'], example: 'CD' })
  media_type?: 'Vinyl' | 'CD' | 'Cassette';

  @ApiPropertyOptional({ example: 24.99 })
  price?: number;

  @ApiPropertyOptional({ example: 3 })
  stock?: number;

  @ApiPropertyOptional({ example: 'Pink Floyd' })
  artistName?: string;

  @ApiPropertyOptional({ example: 'Progressive Rock' })
  genreName?: string;

  @ApiPropertyOptional({ example: 'Harvest Records', nullable: true })
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

