import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  userName: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class AdminTokenDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  accessTokenExpireAt: string;

  @ApiProperty()
  username: string;
}

export class AdminMeDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  isAdmin: boolean;

  @ApiPropertyOptional({ nullable: true })
  avatarFileId?: string | null;
}

export class PageQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;
}

export class NotificationsQueryDto {
  @ApiPropertyOptional({ example: 20, description: 'Max items (1–50)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class AdminUsersQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'username / email / phone / zonicId' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['all', 'active', 'blocked'], default: 'all' })
  @IsOptional()
  @IsIn(['all', 'active', 'blocked'])
  status?: 'all' | 'active' | 'blocked';
}

/** Map / filter query for captured territories (real DB, read-only). */
export class AdminTerritoriesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by owner country_id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;

  @ApiPropertyOptional({ description: 'Filter by owner region_id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  regionId?: number;

  @ApiPropertyOptional({ description: 'username or ZONIC-ID search' })
  @IsOptional()
  @IsString()
  q?: string;
}

export class BlockUserDto {
  @ApiPropertyOptional({ example: 'Spam / qoidabuzarlik' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CreateEventDto {
  @ApiProperty({ example: '10 km chaqiriq' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['distance_km', 'steps'], example: 'distance_km' })
  @IsIn(['distance_km', 'steps'])
  goalType: 'distance_km' | 'steps';

  @ApiProperty({ example: 10, description: '10 km yoki 50000 qadam' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  goalValue: number;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z' })
  @IsString()
  startsAt: string;

  @ApiProperty({ example: '2026-08-27T23:59:59.000Z' })
  @IsString()
  endsAt: string;

  @ApiPropertyOptional({ example: true, description: 'true = darhol publish + news + push' })
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['distance_km', 'steps'] })
  @IsOptional()
  @IsIn(['distance_km', 'steps'])
  goalType?: 'distance_km' | 'steps';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  goalValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endsAt?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'ended'] })
  @IsOptional()
  @IsIn(['draft', 'published', 'ended'])
  status?: 'draft' | 'published' | 'ended';
}

export class SendPushDto {
  @ApiProperty({ example: 'Yangi musobaqa' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({ enum: ['all', 'inactive_3d', 'userIds'], example: 'all' })
  @IsIn(['all', 'inactive_3d', 'userIds'])
  audience: 'all' | 'inactive_3d' | 'userIds';

  @ApiPropertyOptional({ type: [String], description: 'audience=userIds bo‘lsa majburiy' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];
}

export class CreateBadgeDto {
  @ApiProperty({ example: 'dist_5_night', description: 'barqaror kod, o‘zgarmas' })
  @IsString()
  @MaxLength(60)
  code: string;

  @ApiProperty({ example: 'Tungi yuguruvchi' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty({ enum: ['distance', 'territory', 'steps', 'custom'], example: 'distance' })
  @IsIn(['distance', 'territory', 'steps', 'custom'])
  type: 'distance' | 'territory' | 'steps' | 'custom';

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  threshold: number;

  @ApiProperty({ example: 'km' })
  @IsString()
  @MaxLength(20)
  unit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconFileId?: string;
}

export class UpdateBadgeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ enum: ['distance', 'territory', 'steps', 'custom'] })
  @IsOptional()
  @IsIn(['distance', 'territory', 'steps', 'custom'])
  type?: 'distance' | 'territory' | 'steps' | 'custom';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  threshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconFileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertMarketItemDto {
  @ApiProperty({ example: 'frame_gold' })
  @IsString()
  @MaxLength(60)
  code: string;

  @ApiProperty({ example: 'Oltin Ramka' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'tanga' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'frame' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ example: 'permanent' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discountLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageFileId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateNewsDto {
  @ApiProperty({ enum: ['news', 'announcement', 'banner'], example: 'news' })
  @IsIn(['news', 'announcement', 'banner'])
  type: 'news' | 'announcement' | 'banner';

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageFileId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

export class UpdateNewsDto {
  @ApiPropertyOptional({ enum: ['news', 'announcement', 'banner'] })
  @IsOptional()
  @IsIn(['news', 'announcement', 'banner'])
  type?: 'news' | 'announcement' | 'banner';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageFileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
