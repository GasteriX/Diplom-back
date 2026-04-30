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

  private normalizeArray(values?: string[] | null): string[] {
    if (!values?.length) {
      return [];
    }
    return values.map((value) => value.trim()).filter(Boolean);
  }

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

  async findByCountry(country: string) {
    this.logger.log(`Fetching products by country "${country}"`);
    return this.productsRepo.find({
      where: { country },
      relations: ['artist', 'genre', 'label', 'tracks'],
    });
  }

  async findByGenre(genreName: string) {
    this.logger.log(`Fetching products by genre "${genreName}"`);
    return this.productsRepo.find({
      where: [{ genre: { name: genreName } }, { genre_title: genreName }],
      relations: ['artist', 'genre', 'label', 'tracks'],
    });
  }

  async findByArtist(artistName: string) {
    this.logger.log(`Fetching products by artist "${artistName}"`);
    return this.productsRepo.find({
      where: { artist: { name: artistName } },
      relations: ['artist', 'genre', 'label', 'tracks'],
    });
  }

  async findByLabel(labelName: string) {
    this.logger.log(`Fetching products by label "${labelName}"`);
    return this.productsRepo.find({
      where: [{ label: { name: labelName } }, { label_title: labelName }],
      relations: ['artist', 'genre', 'label', 'tracks'],
    });
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
    const performers = this.normalizeArray(dto.performers);
    const artistName = dto.artistName ?? performers[0];
    const genreName = dto.genreName ?? dto.genre;
    const labelName = dto.labelName ?? dto.label ?? null;
    const title = dto.recordTitle ?? dto.title ?? '';

    this.logger.log(`Creating product "${title}"`);
    const artist = await this.getOrCreateArtist(artistName ?? 'Unknown Artist');
    const genre = await this.getOrCreateGenre(genreName ?? 'Unknown Genre');
    const label = labelName ? await this.getOrCreateLabel(labelName) : null;

    const product = this.productsRepo.create({
      title: title || 'Untitled',
      record_title: dto.recordTitle ?? dto.title ?? null,
      media_type: dto.media_type,
      price: dto.price,
      stock: dto.stock,
      country: dto.country,
      barcode: dto.barcode,
      article: dto.article,
      genre_title: dto.genre,
      styles: this.normalizeArray(dto.styles),
      label_title: dto.label ?? dto.labelName ?? null,
      vinyl_count: dto.vinylCount,
      performers,
      color_features: this.normalizeArray(dto.colorFeatures),
      release_year: dto.releaseYear,
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
    if (dto.recordTitle !== undefined) {
      existing.record_title = dto.recordTitle;
      existing.title = dto.recordTitle;
    }
    if (dto.title !== undefined) existing.title = dto.title;
    if (dto.media_type !== undefined) existing.media_type = dto.media_type;
    if (dto.price !== undefined) existing.price = dto.price;
    if (dto.stock !== undefined) existing.stock = dto.stock;
    if (dto.country !== undefined) existing.country = dto.country;
    if (dto.barcode !== undefined) existing.barcode = dto.barcode;
    if (dto.article !== undefined) existing.article = dto.article;
    if (dto.genre !== undefined) existing.genre_title = dto.genre;
    if (dto.styles !== undefined) existing.styles = this.normalizeArray(dto.styles);
    if (dto.label !== undefined) existing.label_title = dto.label;
    if (dto.vinylCount !== undefined) existing.vinyl_count = dto.vinylCount;
    if (dto.performers !== undefined) existing.performers = this.normalizeArray(dto.performers);
    if (dto.colorFeatures !== undefined) {
      existing.color_features = this.normalizeArray(dto.colorFeatures);
    }
    if (dto.releaseYear !== undefined) existing.release_year = dto.releaseYear;

    // Обновляем связи (Artist, Genre, Label)
    const updateArtistName = dto.artistName ?? this.normalizeArray(dto.performers)[0];
    if (updateArtistName) {
      existing.artist = await this.getOrCreateArtist(updateArtistName);
    }
    const updateGenreName = dto.genreName ?? dto.genre;
    if (updateGenreName) {
      existing.genre = await this.getOrCreateGenre(updateGenreName);
    }
    const updateLabelName = dto.labelName ?? dto.label;
    if (updateLabelName !== undefined) {
      existing.label = updateLabelName ? await this.getOrCreateLabel(updateLabelName) : null;
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

