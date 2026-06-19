import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { CacheService } from '../../services/cache/cache.service';

const OTP_KEY = (phone: string) => `otp:${phone}`;
const OTP_COOLDOWN_KEY = (phone: string) => `otp:cooldown:${phone}`;
const OTP_HOURLY_KEY = (phone: string) => `otp:hourly:${phone}`;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private cacheService: CacheService,
    private configService: ConfigService,
  ) {}

  async sendOtp(phone: string): Promise<{ message: string , otp:string }> {
    await this.enforceHourlyLimit(phone);

    const otp = this.generateOtp();
    const ttl = this.configService.get<number>('otp.ttlSeconds');
    const cooldown = this.configService.get<number>('otp.resendCooldownSeconds');

    await this.cacheService.set(OTP_KEY(phone), otp, ttl);
    await this.cacheService.set(OTP_COOLDOWN_KEY(phone), '1', cooldown);

    // TODO: ارسال SMS از طریق سرویس پیامکی
    this.logger.log(`OTP for ${phone}: ${otp}`);

    return { message: 'کد تأیید ارسال شد' ,otp };
  }

  async verifyOtp(phone: string, otp: string): Promise<{ accessToken: string; isNew: boolean }> {
    const stored = await this.cacheService.get<string>(OTP_KEY(phone));

    if (!stored || String(stored) !== otp) {
      throw new BadRequestException('کد تأیید نادرست یا منقضی شده است');
    }

    await this.cacheService.del(OTP_KEY(phone));
    await this.cacheService.del(OTP_COOLDOWN_KEY(phone));

    let user = await this.userRepository.findOne({ where: { phone } });
    const isNew = !user;

    if (!user) {
      user = this.userRepository.create({ phone });
      await this.userRepository.save(user);
    }

    const accessToken = this.signToken(user);
    return { accessToken, isNew };
  }

  async resendOtp(phone: string): Promise<{ message: string }> {
    const onCooldown = await this.cacheService.exists(OTP_COOLDOWN_KEY(phone));
    if (onCooldown) {
      const remaining = await this.cacheService.ttl(OTP_COOLDOWN_KEY(phone));
      throw new ConflictException(
        `لطفاً ${remaining} ثانیه دیگر برای ارسال مجدد کد صبر کنید`,
      );
    }

    return this.sendOtp(phone);
  }

  private async enforceHourlyLimit(phone: string): Promise<void> {
    const maxRequests = this.configService.get<number>('otp.maxRequestsPerHour');
    const count = await this.cacheService.increment(OTP_HOURLY_KEY(phone));

    if (count === 1) {
      await this.cacheService.expire(OTP_HOURLY_KEY(phone), 3600);
    }

    if (count > maxRequests) {
      throw new ConflictException(
        `تعداد درخواست کد بیشتر از حد مجاز (${maxRequests} بار در ساعت) است`,
      );
    }
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private signToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, phone: user.phone, role: user.role });
  }
}
