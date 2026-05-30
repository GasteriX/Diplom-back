import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../entities/enums';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { SetRoleDto } from './dto/set-role.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Register as regular user',
    description:
      'Creates an unverified account and sends a verification email. If the email is taken by an unverified account, registration is updated and a new link is sent.',
  })
  @ApiCreatedResponse({
    description:
      'Instructions to verify email; JWT is issued only after email verification',
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({
    summary: 'Confirm email address (POST)',
    description:
      'Preferred endpoint for the frontend after opening the verification link. Returns JWT access token and user profile.',
  })
  @ApiOkResponse({ description: 'JWT access token and user info' })
  @Post('verify-email')
  verifyEmailPost(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @ApiOperation({
    summary: 'Confirm email address (GET, legacy)',
    description:
      'Legacy query-string endpoint. Prefer POST /auth/verify-email from the frontend.',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'One-time token from the verification email',
  })
  @ApiOkResponse({ description: 'JWT access token and user info' })
  @Get('verify-email')
  verifyEmailGet(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @ApiOperation({
    summary: 'Resend verification email',
    description:
      'Sends a new verification link if the account exists and is not yet verified. Always returns the same response.',
  })
  @ApiOkResponse({ description: 'Generic success message' })
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @ApiOperation({ summary: 'Login and get JWT access token' })
  @ApiOkResponse({ description: 'JWT access token and user info' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Set user role (admin only)' })
  @ApiParam({ name: 'id', type: String, example: '1' })
  @ApiOkResponse({ description: 'User role updated' })
  @Patch('users/:id/role')
  setRole(@Param('id') id: string, @Body() dto: SetRoleDto) {
    return this.authService.setRole(id, dto);
  }
}
