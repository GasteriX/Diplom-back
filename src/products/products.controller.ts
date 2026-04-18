import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'Get all products' })
  @ApiOkResponse({ description: 'List of products' })
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @ApiOperation({ summary: 'Get product by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Product details' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({ description: 'Product created' })
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Product updated' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Product deleted' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}

