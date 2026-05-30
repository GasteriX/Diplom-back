import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: 'One-time token from the verification email' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
