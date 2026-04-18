import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Artist } from '../entities/artist.entity';
import { Genre } from '../entities/genre.entity';
import { Label } from '../entities/label.entity';
import { Track } from '../entities/track.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Track) // Add this
    private readonly tracksRepo: Repository<Track>,
    @InjectRepository(Artist)
    private readonly artistsRepo: Repository<Artist>,
    @InjectRepository(Genre)
    private readonly genresRepo: Repository<Genre>,
    @InjectRepository(Label)
    private readonly labelsRepo: Repository<Label>,
  ) {}

  async findAll() {
    this.logger.log('Fetching all products');
    const products = await this.productsRepo.find({
      relations: ['artist', 'genre', 'label', 'tracks'],
    });
    this.logger.log(`Fetched ${products.length} products`);
    return products;
  }

  async findOne(id: number) {
    this.logger.log(`Fetching product ${id}`);
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: ['artist', 'genre', 'label', 'tracks'],
    });
    if (!product) {
      this.logger.warn(`Product ${id} not found`);
    }
    return product;
  }

  private mapTracks(tracks?: any[]) {
    if (!tracks) {
      return [];
    }

    return tracks.map((track) => {
      const entity = new Track();
      // Если в DTO пришел id, сохраняем его, иначе создаем новый
      if (track.id) {
        entity.id = track.id;
      }
      entity.number = track.number;
      entity.title = track.title;
      entity.duration = track.duration ?? null;
      return entity;
    });
  }

  private async getOrCreateArtist(name: string) {
    const normalizedName = name.trim();
    let artist = await this.artistsRepo.findOne({ where: { name: normalizedName } });
    if (!artist) {
      this.logger.log(`Creating artist "${normalizedName}"`);
      artist = await this.artistsRepo.save(
        this.artistsRepo.create({ name: normalizedName, bio: null }),
      );
    }
    return artist;
  }

  private async getOrCreateGenre(name: string) {
    const normalizedName = name.trim();
    let genre = await this.genresRepo.findOne({ where: { name: normalizedName } });
    if (!genre) {
      this.logger.log(`Creating genre "${normalizedName}"`);
      genre = await this.genresRepo.save(
        this.genresRepo.create({ name: normalizedName }),
      );
    }
    return genre;
  }

  private async getOrCreateLabel(name: string) {
    const normalizedName = name.trim();
    let label = await this.labelsRepo.findOne({ where: { name: normalizedName } });
    if (!label) {
      this.logger.log(`Creating label "${normalizedName}"`);
      label = await this.labelsRepo.save(
        this.labelsRepo.create({ name: normalizedName }),
      );
    }
    return label;
  }

  async create(dto: CreateProductDto) {
    this.logger.log(`Creating product "${dto.title}"`);
    const artist = await this.getOrCreateArtist(dto.artistName);
    const genre = await this.getOrCreateGenre(dto.genreName);
    const label = dto.labelName ? await this.getOrCreateLabel(dto.labelName) : null;

    const product = this.productsRepo.create({
      title: dto.title,
      media_type: dto.media_type,
      price: dto.price,
      stock: dto.stock,
      artist,
      genre,
      label,
      tracks: this.mapTracks(dto.tracks),
    });
    const savedProduct = await this.productsRepo.save(product);
    this.logger.log(`Created product ${savedProduct.id} with ${savedProduct.tracks?.length ?? 0} tracks`);
    return savedProduct;
  }

  async update(id: number, dto: UpdateProductDto) {
    this.logger.log(`Updating product ${id}`);
    
    // Загружаем существующий продукт
    const existing = await this.productsRepo.findOne({
      where: { id },
      relations: ['tracks'],
    });

    if (!existing) {
      this.logger.warn(`Product ${id} not found for update`);
      throw new NotFoundException('Product not found');
    }

    // Обновляем простые поля
    if (dto.title !== undefined) existing.title = dto.title;
    if (dto.media_type !== undefined) existing.media_type = dto.media_type;
    if (dto.price !== undefined) existing.price = dto.price;
    if (dto.stock !== undefined) existing.stock = dto.stock;

    // Обновляем связи (Artist, Genre, Label)
    if (dto.artistName !== undefined) {
      existing.artist = await this.getOrCreateArtist(dto.artistName);
    }
    if (dto.genreName !== undefined) {
      existing.genre = await this.getOrCreateGenre(dto.genreName);
    }
    if (dto.labelName !== undefined) {
      existing.label = dto.labelName ? await this.getOrCreateLabel(dto.labelName) : null;
    }

    // ЛОГИКА ОБНОВЛЕНИЯ ТРЕКОВ
    if (dto.tracks !== undefined) {
      this.logger.log(`Replacing tracks for product ${id}`);
      
      // 1. Удаляем все старые треки этого продукта напрямую из БД.
      // Это гарантирует, что TypeORM не попытается сделать UPDATE ... SET product_id = NULL
      await this.tracksRepo.delete({ product: { id: id } });

      // 2. Очищаем массив в памяти, чтобы избежать конфликтов при сохранении
      existing.tracks = [];

      // 3. Создаем новые сущности треков из DTO
      existing.tracks = this.mapTracks(dto.tracks);
    }

    // Сохраняем продукт. Теперь TypeORM просто вставит новые треки.
    const updatedProduct = await this.productsRepo.save(existing);
    this.logger.log(`Updated product ${id}`);
    return updatedProduct;
  }
  async remove(id: number) {
    this.logger.log(`Deleting product ${id}`);
    const res = await this.productsRepo.delete(id);
    if (!res.affected) {
      this.logger.warn(`Product ${id} not found for delete`);
      throw new NotFoundException('Product not found');
    }
    this.logger.log(`Deleted product ${id}`);
  }
}

