import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  displayName!: string;

  @ApiProperty({ example: 'strongPassword123' })
  password!: string;
}
