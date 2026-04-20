import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../entities/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
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

  @ApiOperation({ summary: 'Get products by country' })
  @ApiParam({ name: 'country', type: String, example: 'UK' })
  @ApiOkResponse({ description: 'List of products filtered by country' })
  @Get('country/:country')
  findByCountry(@Param('country') country: string) {
    return this.productsService.findByCountry(country);
  }

  @ApiOperation({ summary: 'Get products by genre' })
  @ApiParam({ name: 'genre', type: String, example: 'Progressive Rock' })
  @ApiOkResponse({ description: 'List of products filtered by genre' })
  @Get('genre/:genre')
  findByGenre(@Param('genre') genre: string) {
    return this.productsService.findByGenre(genre);
  }

  @ApiOperation({ summary: 'Get products by artist' })
  @ApiParam({ name: 'artist', type: String, example: 'Pink Floyd' })
  @ApiOkResponse({ description: 'List of products filtered by artist' })
  @Get('artist/:artist')
  findByArtist(@Param('artist') artist: string) {
    return this.productsService.findByArtist(artist);
  }

  @ApiOperation({ summary: 'Get products by label' })
  @ApiParam({ name: 'label', type: String, example: 'Harvest Records' })
  @ApiOkResponse({ description: 'List of products filtered by label' })
  @Get('label/:label')
  findByLabel(@Param('label') label: string) {
    return this.productsService.findByLabel(label);
  }

  @ApiOperation({ summary: 'Get product by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Product details' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({ description: 'Product created' })
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Product updated' })
  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'Product deleted' })
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}

