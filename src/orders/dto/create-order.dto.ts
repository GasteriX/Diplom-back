import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1)
  items!: CreateOrderItemDto[];

  @ApiPropertyOptional({ example: 'pickup', description: 'Delivery method id/label' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deliveryMethod?: string;

  @ApiPropertyOptional({ example: 'Кривий Ріг, Нова Пошта №9' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 'online', description: 'Payment method id/label' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Іван Петренко' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerName?: string;

  @ApiPropertyOptional({ example: '+380 67 123 45 67' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerPhone?: string;

  @ApiPropertyOptional({ example: 'buyer@example.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'Подзвоніть перед доставкою' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
