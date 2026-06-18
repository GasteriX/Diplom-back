import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { UserRole } from '../entities/enums';
import { User } from '../entities/user.entity';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { SetRoleDto } from './dto/set-role.dto';

const EMAIL_VERIFY_MINUTES = Number(
  process.env.JWT_EMAIL_VERIFY_MINUTES ?? 15,
);

const RESEND_COOLDOWN_MS = Number(
  process.env.EMAIL_RESEND_COOLDOWN_SECONDS ?? 60,
) * 1000;

@Injectable()
export class AuthService {
  private readonly resendCooldown = new Map<string, number>();

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
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

  private hashVerificationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateVerificationToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private getVerificationExpiry(): Date {
    const expiresDate = new Date();
    expiresDate.setMinutes(expiresDate.getMinutes() + EMAIL_VERIFY_MINUTES);
    return expiresDate;
  }

  private isVerificationExpired(user: User): boolean {
    return (
      !!user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    );
  }

  private buildVerificationUrl(rawToken: string): string {
    const base =
      process.env.EMAIL_VERIFICATION_URL?.replace(/\/$/, '') ??
      `${(process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '')}/demo/app.html`;
    return `${base}?token=${encodeURIComponent(rawToken)}`;
  }

  private async assignVerificationToken(user: User): Promise<string> {
    const rawToken = this.generateVerificationToken();
    user.emailVerificationToken = this.hashVerificationToken(rawToken);
    user.emailVerificationExpires = this.getVerificationExpiry();
    await this.usersRepo.save(user);
    return rawToken;
  }

  private async sendVerificationEmail(user: User, rawToken: string) {
    const verificationUrl = this.buildVerificationUrl(rawToken);
    await this.mailService.sendVerificationEmail(
      user.email,
      user.displayName,
      verificationUrl,
    );
  }

  private verificationSuccessResponse(user: User) {
    return this.signAccessToken(user).then((access_token) => ({
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        isEmailVerified: user.isEmailVerified,
      },
    }));
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

    return this.verificationSuccessResponse(user);
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersRepo.findOne({ where: { email } });

    if (existingUser?.isEmailVerified) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await hash(dto.password, 10);

    let user: User;
    if (existingUser && !existingUser.isEmailVerified) {
      user = existingUser;
      user.displayName = dto.displayName.trim();
      user.passwordHash = passwordHash;
      user.role = UserRole.USER;
    } else {
      user = this.usersRepo.create({
        email,
        displayName: dto.displayName.trim(),
        passwordHash,
        role: UserRole.USER,
        isEmailVerified: false,
      });
    }

    const savedUser = await this.usersRepo.save(user);
    const rawToken = await this.assignVerificationToken(savedUser);
    await this.sendVerificationEmail(savedUser, rawToken);

    return {
      message:
        'Registration successful. Please check your email for the verification link.',
    };
  }

  async resendVerification(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const lastSent = this.resendCooldown.get(normalizedEmail);
    if (lastSent && Date.now() - lastSent < RESEND_COOLDOWN_MS) {
      return {
        message:
          'If this email is registered and not yet verified, a new verification link has been sent.',
      };
    }

    const user = await this.usersRepo.findOne({
      where: { email: normalizedEmail },
    });

    if (user && !user.isEmailVerified) {
      const rawToken = await this.assignVerificationToken(user);
      await this.sendVerificationEmail(user, rawToken);
      this.resendCooldown.set(normalizedEmail, Date.now());
    }

    return {
      message:
        'If this email is registered and not yet verified, a new verification link has been sent.',
    };
  }

  async verifyEmail(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Verification token is required');
    }

    const tokenHash = this.hashVerificationToken(token.trim());
    const user = await this.usersRepo.findOne({
      where: { emailVerificationToken: tokenHash },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (this.isVerificationExpired(user)) {
      await this.usersRepo.remove(user);
      throw new UnauthorizedException(
        'Verification link has expired. Please register again.',
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await this.usersRepo.save(user);

    return this.verificationSuccessResponse(user);
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
