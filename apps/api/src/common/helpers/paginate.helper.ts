import { FindManyOptions, Repository } from 'typeorm';
import { PaginateResult } from '../interfaces/paginate-result.interface';

export async function paginate<T>(
  repository: Repository<T>,
  page: number,
  limit: number,
  options?: FindManyOptions<T>,
): Promise<PaginateResult<T>> {
  const [data, total] = await repository.findAndCount({
    ...options,
    skip: (page - 1) * limit,
    take: limit,
  });

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
