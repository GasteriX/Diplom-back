import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserRole } from '../entities/enums';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { SetRoleDto } from './dto/set-role.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isBcryptPassword = await compare(dto.password, user.passwordHash);
    const isPlainPassword = dto.password === user.passwordHash;

    if (!isBcryptPassword && !isPlainPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersRepo.findOne({ where: { email } });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await hash(dto.password, 10);
    const user = this.usersRepo.create({
      email,
      displayName: dto.displayName.trim(),
      passwordHash,
      role: UserRole.USER,
    });
    const savedUser = await this.usersRepo.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      displayName: savedUser.displayName,
      role: savedUser.role,
    };
  }

  async setRole(userId: string, dto: SetRoleDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = dto.role;
    const savedUser = await this.usersRepo.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      displayName: savedUser.displayName,
      role: savedUser.role,
    };
  }
}
