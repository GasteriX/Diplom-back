import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackDto {
  @ApiProperty({ example: 1 })
  number!: number;

  @ApiProperty({ example: 'Speak to Me' })
  title!: string;

  @ApiPropertyOptional({ example: '00:01:30', nullable: true })
  duration?: string | null;
}
