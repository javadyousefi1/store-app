import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { paginate } from '../../common/helpers/paginate.helper';
import { PaginateResult } from '../../common/interfaces/paginate-result.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  findAll(dto: PaginationDto): Promise<PaginateResult<User>> {
    return paginate(this.userRepository, dto.page, dto.limit, {
      order: { createdAt: 'DESC' },
    });
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepository.softDelete(id);
  }
}
