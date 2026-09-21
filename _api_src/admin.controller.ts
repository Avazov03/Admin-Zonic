import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { UploadedImage } from '../profile/profile.service';
import { ADMIN_COOKIE, AdminAuthGuard, AdminUser } from './admin-auth.guard';
import { AdminService } from './admin.service';
import {
  AdminLoginDto,
  AdminMeDto,
  AdminTokenDto,
  AdminUsersQueryDto,
  AdminTerritoriesQueryDto,
  BlockUserDto,
  CreateBadgeDto,
  CreateEventDto,
  CreateNewsDto,
  PageQueryDto,
  SendPushDto,
  UpdateBadgeDto,
  UpdateEventDto,
  UpdateNewsDto,
  UpsertMarketItemDto,
} from './dto/admin.dto';

const MAX_IMAGE = 8 * 1024 * 1024;

@ApiTags('Admin')
@Controller('Admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ─── 13 Auth ─────────────────────────────────────────────────────────────
  @Post('Auth/Login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Admin login — JWT + HttpOnly cookie' })
  @ApiOkResponse({ type: AdminTokenDto })
  async login(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) res: Response): Promise<AdminTokenDto> {
    const { tokens, rawToken, maxAgeSec } = await this.admin.login(dto);
    res.setHeader(
      'Set-Cookie',
      `${ADMIN_COOKIE}=${encodeURIComponent(rawToken)}; HttpOnly; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`,
    );
    return tokens;
  }

  @Post('Auth/Logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Clear admin cookie' })
  logout(@Res({ passthrough: true }) res: Response): { ok: boolean } {
    res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
    return { ok: true };
  }

  @Get('Auth/Me')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current admin profile' })
  @ApiOkResponse({ type: AdminMeDto })
  me(@CurrentUser() user: AdminUser) {
    return this.admin.me(user.userId);
  }

  // ─── 14 Dashboard ────────────────────────────────────────────────────────
  @Get('Dashboard')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Totals + last-7-days activity' })
  dashboard() {
    return this.admin.dashboard();
  }

  // ─── 15 Users ────────────────────────────────────────────────────────────
  @Get('Users')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registered users — search / filter / paginate' })
  users(@Query() q: AdminUsersQueryDto) {
    return this.admin.listUsers(q.q, q.status ?? 'all', q.page ?? 1, q.pageSize ?? 20);
  }

  @Post('Users/:id/Block')
  @HttpCode(200)
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block a user (login rejected)' })
  block(@Param('id') id: string, @Body() dto: BlockUserDto) {
    return this.admin.blockUser(id, dto);
  }

  @Post('Users/:id/Unblock')
  @HttpCode(200)
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock a user' })
  unblock(@Param('id') id: string) {
    return this.admin.unblockUser(id);
  }

  // ─── 16 Events ───────────────────────────────────────────────────────────
  @Get('Events')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  listEvents() {
    return this.admin.listAdminEvents();
  }

  @Post('Events')
  @HttpCode(200)
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  createEvent(@CurrentUser() user: AdminUser, @Body() dto: CreateEventDto) {
    return this.admin.createEvent(user.userId, dto);
  }

  @Put('Events/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  updateEvent(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.admin.updateEvent(id, dto);
  }

  @Delete('Events/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  deleteEvent(@Param('id') id: string) {
    return this.admin.deleteEvent(id);
  }

  @Get('Events/:id/Participants')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  participants(@Param('id') id: string) {
    return this.admin.eventParticipants(id);
  }

  // ─── 17 Push ─────────────────────────────────────────────────────────────
  @Post('Push/Send')
  @HttpCode(200)
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  sendPush(@CurrentUser() user: AdminUser, @Body() dto: SendPushDto) {
    return this.admin.sendPush(user.userId, dto);
  }

  @Get('Push/History')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  pushHistory(@Query() q: PageQueryDto) {
    return this.admin.pushHistory(q.page ?? 1, q.pageSize ?? 20);
  }

  // ─── 18 Badges ───────────────────────────────────────────────────────────
  @Get('Badges')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  badges() {
    return this.admin.listBadges();
  }

  @Post('Badges')
  @HttpCode(200)
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  createBadge(@Body() dto: CreateBadgeDto) {
    return this.admin.createBadge(dto);
  }

  @Put('Badges/:code')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  updateBadge(@Param('code') code: string, @Body() dto: UpdateBadgeDto) {
    return this.admin.updateBadge(code, dto);
  }

  @Delete('Badges/:code')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  deleteBadge(@Param('code') code: string) {
    return this.admin.deleteBadge(code);
  }

  @Get('Badges/:code/Unlocks')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  badgeUnlocks(@Param('code') code: string, @Query() q: PageQueryDto) {
    return this.admin.badgeUnlocks(code, q.page ?? 1, q.pageSize ?? 20);
  }

  // ─── 19 Market ───────────────────────────────────────────────────────────
  @Get('Market/Items')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  marketItems() {
    return this.admin.listMarketItems();
  }

  @Post('Market/Items')
  @HttpCode(200)
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  upsertMarket(@Body() dto: UpsertMarketItemDto) {
    return this.admin.upsertMarketItem(dto);
  }

  @Put('Market/Items')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  updateMarket(@Body() dto: UpsertMarketItemDto) {
    return this.admin.upsertMarketItem(dto);
  }

  // ─── 20 News ─────────────────────────────────────────────────────────────
  @Get('News')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  adminNews() {
    return this.admin.listAdminNews();
  }

  @Post('News')
  @HttpCode(200)
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  createNews(@CurrentUser() user: AdminUser, @Body() dto: CreateNewsDto) {
    return this.admin.createNews(user.userId, dto);
  }

  @Put('News/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  updateNews(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.admin.updateNews(id, dto);
  }

  @Delete('News/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  deleteNews(@Param('id') id: string) {
    return this.admin.deleteNews(id);
  }

  // ─── 21 Tracks ───────────────────────────────────────────────────────────
  @Get('Users/:id/Runs')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  userRuns(@Param('id') id: string) {
    return this.admin.userRuns(id);
  }

  @Get('Runs/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  runDetail(@Param('id') id: string) {
    return this.admin.runDetail(id);
  }

  @Get('Users/:id/Territories')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Territories captured by user (read-only, separate from free runs)' })
  userTerritories(@Param('id') id: string) {
    return this.admin.userTerritories(id);
  }

  @Get('Territories')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'All captured territories for admin map (optional country/region/q filters)',
  })
  listTerritories(@Query() q: AdminTerritoriesQueryDto) {
    return this.admin.listTerritoriesMap(q.countryId, q.regionId, q.q);
  }

  @Get('Lookups/Countries')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Countries select list — Uzbek Latin labels, real ids' })
  countriesUz() {
    return this.admin.countriesUz();
  }

  @Get('Lookups/Regions')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regions select list — Uzbek Latin labels, real ids' })
  regionsUz(@Query('countryId') countryId?: string) {
    const n = countryId != null && countryId !== '' ? Number(countryId) : undefined;
    return this.admin.regionsUz(Number.isFinite(n as number) ? (n as number) : undefined);
  }

  @Get('Territories/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Territory detail + polygon ring for admin map' })
  territoryDetail(@Param('id') id: string) {
    return this.admin.territoryDetail(id);
  }

  // ─── Images ──────────────────────────────────────────────────────────────
  @Post('UploadImage')
  @HttpCode(200)
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE } }))
  upload(@UploadedFile() file: UploadedImage) {
    return this.admin.saveImage(file);
  }

  @Get('Image')
  @ApiOperation({ summary: 'Stream an admin-uploaded image (badge / market / news)' })
  image(@Query('fileId') fileId: string): StreamableFile {
    const { stream, contentType } = this.admin.openImage(fileId);
    return new StreamableFile(stream, { type: contentType });
  }
}
