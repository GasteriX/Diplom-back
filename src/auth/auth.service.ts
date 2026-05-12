import {
  BadRequestException,
  Injectable,
  Logger,
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

/** Срок жизни ссылки подтверждения (минуты), совпадает с `expiresIn` JWT */
const EMAIL_VERIFY_MINUTES = Number(
  process.env.JWT_EMAIL_VERIFY_MINUTES ?? 15,
);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  private buildAccessPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      typ: 'access',
    };
  }

  private async signAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync(this.buildAccessPayload(user));
  }

  private async signEmailVerificationToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      typ: 'email_verification',
    };
    return this.jwtService.signAsync(payload, {
      expiresIn: `${EMAIL_VERIFY_MINUTES}m`,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isBcryptPassword = await compare(dto.password, user.passwordHash);
    const isPlainPassword = dto.password === user.passwordHash;

    if (!isBcryptPassword && !isPlainPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please verify your email before logging in.',
      );
    }

    const access_token = await this.signAccessToken(user);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersRepo.findOne({ where: { email } });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const expiresDate = new Date();
    expiresDate.setMinutes(expiresDate.getMinutes() + EMAIL_VERIFY_MINUTES);

    const passwordHash = await hash(dto.password, 10);
    const user = this.usersRepo.create({
      email,
      displayName: dto.displayName.trim(),
      passwordHash,
      role: UserRole.USER,
      isEmailVerified: false,
      emailVerificationExpires: expiresDate,
    });
    const savedUser = await this.usersRepo.save(user);

    const verificationToken = await this.signEmailVerificationToken(savedUser);
    const baseUrl =
      process.env.APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
    this.logger.log(
      `Email verification for ${savedUser.email}: ${baseUrl}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`,
    );

    return {
      message:
        'Registration successful. Please check your email for the verification link (link is also printed to the server log in development).',
    };
  }

  async verifyEmail(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Verification token is required');
    }

    let decoded: JwtPayload;
    try {
      decoded = this.jwtService.verify<JwtPayload>(token.trim());
    } catch {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    if (decoded.typ !== 'email_verification') {
      throw new UnauthorizedException('Invalid verification token');
    }

    const user = await this.usersRepo.findOne({ where: { id: decoded.sub } });
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      await this.usersRepo.remove(user);
      throw new UnauthorizedException(
        'Verification link has expired. Please register again.',
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationExpires = null;
    await this.usersRepo.save(user);

    const access_token = await this.signAccessToken(user);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        isEmailVerified: user.isEmailVerified,
      },
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
