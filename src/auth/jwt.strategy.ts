import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev_secret_change_me',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Invalid token user');
    }
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    };
  }
}
