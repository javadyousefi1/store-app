import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GetOtpDto } from './dto/get-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@ApiTags('Auth')
@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('getOtp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 3600, limit: 5, keyPrefix: 'rl:getOtp' })
  @ApiOperation({ summary: 'Request OTP', description: 'Send a 6-digit OTP to the provided Iranian phone number. Limited to 5 requests per hour per phone.' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid phone number format.' })
  @ApiResponse({ status: 429, description: 'Too many requests. Try again later.' })
  getOtp(@Body() dto: GetOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Post('verifyOtp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 300, limit: 10, keyPrefix: 'rl:verifyOtp' })
  @ApiOperation({ summary: 'Verify OTP', description: 'Verify the OTP code and receive a JWT access token (expires in 48h). Creates a new user account if the phone is not registered.' })
  @ApiResponse({ status: 200, description: 'Login successful. Returns access token and isNew flag.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
  @ApiResponse({ status: 429, description: 'Too many attempts.' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.otp);
  }

  @Post('resendOtp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 3600, limit: 5, keyPrefix: 'rl:resendOtp' })
  @ApiOperation({ summary: 'Resend OTP', description: 'Resend the OTP to the given phone number. Subject to a 90-second cooldown between requests.' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully.' })
  @ApiResponse({ status: 409, description: 'Cooldown active. Wait before requesting again.' })
  @ApiResponse({ status: 429, description: 'Too many requests.' })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.phone);
  }
}
