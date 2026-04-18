import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackDto } from './track.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'The Dark Side of the Moon' })
  title!: string;

  @ApiProperty({ enum: ['Vinyl', 'CD', 'Cassette'], example: 'Vinyl' })
  media_type!: 'Vinyl' | 'CD' | 'Cassette';

  @ApiProperty({ example: 29.99 })
  price!: number;

  @ApiProperty({ example: 5 })
  stock!: number;

  @ApiProperty({ example: 'Pink Floyd' })
  artistName!: string;

  @ApiProperty({ example: 'Progressive Rock' })
  genreName!: string;

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

