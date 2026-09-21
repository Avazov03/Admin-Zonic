import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { randomUUID } from 'crypto';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { verifyPassword } from '../common/helpers/password';
import { formatDateTime, formatIso, parseFlexibleDateTime } from '../common/helpers/datetime';
import { badRequest } from '../common/validation-problem';
import { PushService } from '../notifications/push.service';
import { UploadedImage } from '../profile/profile.service';
import { countryUz, regionUz } from '../geo-uz-names';
import {
  AdminLoginDto,
  AdminTokenDto,
  BlockUserDto,
  CreateBadgeDto,
  CreateEventDto,
  CreateNewsDto,
  SendPushDto,
  UpdateBadgeDto,
  UpdateEventDto,
  UpdateNewsDto,
  UpsertMarketItemDto,
} from './dto/admin.dto';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class AdminService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'admin');

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectDataSource() private readonly db: DataSource,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly push: PushService,
  ) {
    mkdirSync(this.uploadDir, { recursive: true });
  }

  // ─── Auth ────────────────────────────────────────────────────────────────
  async login(dto: AdminLoginDto): Promise<{ tokens: AdminTokenDto; rawToken: string; maxAgeSec: number }> {
    const user = await this.users.findOne({ where: { username: dto.userName } });
    if (!user || !verifyPassword(dto.password ?? '', user.passwordSalt, user.passwordHash)) {
      throw badRequest(['Invalid username or password.']);
    }
    if (user.isBlocked) throw badRequest(['Account is blocked.']);

    if (!user.isAdmin) {
      await this.tryBootstrapAdmin(user);
    }
    if (!user.isAdmin) throw new ForbiddenException('Admin access required.');

    const minutes = this.config.get<number>('jwt.accessTokenExpirationMinutes') ?? 600;
    const now = new Date();
    const token = this.jwt.sign(
      { sub: user.id, unique_name: user.username, role: 'admin', jti: randomUUID() },
      {
        secret: this.config.get<string>('jwt.secretKey'),
        issuer: this.config.get<string>('jwt.issuer'),
        audience: this.config.get<string>('jwt.audience'),
        expiresIn: `${minutes}m`,
      },
    );
    return {
      rawToken: token,
      maxAgeSec: minutes * 60,
      tokens: {
        accessToken: token,
        token,
        accessTokenExpireAt: formatDateTime(new Date(now.getTime() + minutes * 60_000)),
        username: user.username,
      },
    };
  }

  private async tryBootstrapAdmin(user: User): Promise<void> {
    const wanted = (process.env.ADMIN_BOOTSTRAP_USERNAME ?? '').trim();
    if (!wanted || user.username !== wanted) return;
    const [{ cnt }] = await this.db.query(`SELECT COUNT(*)::int AS cnt FROM sys_user WHERE is_admin = true`);
    if (Number(cnt) > 0) return;
    await this.db.query(`UPDATE sys_user SET is_admin = true WHERE id = $1`, [user.id]);
    user.isAdmin = true;
  }

  async me(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      select: { id: true, username: true, isAdmin: true, avatarFileId: true },
    });
    if (!user) throw new NotFoundException('User not found.');
    return {
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      avatarFileId: user.avatarFileId ?? null,
    };
  }

  /** Same disk layout as /UserProfile/UploadAvatar so DownloadAvatar works. */
  async saveAvatar(userId: string, file: UploadedImage | undefined): Promise<{ fileId: string }> {
    if (!file?.buffer?.length) throw badRequest(['No file uploaded (field "file").']);
    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) throw badRequest(['Unsupported image type. Use JPG, PNG, WEBP or GIF.']);
    if (file.buffer.length > 5 * 1024 * 1024) throw badRequest(['Avatar max 5 MB.']);
    const avatarDir = join(process.cwd(), 'uploads', 'avatars');
    mkdirSync(avatarDir, { recursive: true });
    const fileId = `${randomUUID()}${ext}`;
    writeFileSync(join(avatarDir, fileId), file.buffer);
    await this.users.update({ id: userId }, { avatarFileId: fileId });
    return { fileId };
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────
  async dashboard(year?: number) {
    const y =
      year && Number.isFinite(year) && year >= 2020 && year <= 2100
        ? Math.trunc(year)
        : new Date().getFullYear();
    const calFrom = `${y}-01-01`;
    const calTo = `${y}-12-31`;

    const [
      [users],
      [events],
      [todayRun],
      [todaySteps],
      [territories],
      [badges],
      [market],
      [news],
      [push],
      daily,
      calendar,
      yearRows,
    ] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE is_blocked)::int AS blocked,
                COUNT(*) FILTER (WHERE dateofcreated >= CURRENT_DATE)::int AS new_today,
                COUNT(*) FILTER (WHERE last_seen_at >= now() - interval '3 days')::int AS active_3d
           FROM sys_user`,
      ),
      this.db.query(
        `SELECT COUNT(*) FILTER (WHERE status = 'published' AND starts_at <= now() AND ends_at >= now())::int AS active,
                COUNT(*) FILTER (WHERE status = 'published')::int AS published,
                (SELECT COUNT(*)::int FROM game_event_participant) AS participants_total
           FROM game_event`,
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS runs, COALESCE(SUM(distance_km), 0)::float AS km
           FROM game_free_run WHERE started_at >= CURRENT_DATE`,
      ),
      this.db.query(
        `SELECT COALESCE(SUM(steps), 0)::bigint AS steps
           FROM game_step_activity WHERE started_at >= CURRENT_DATE`,
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE captured_at >= CURRENT_DATE)::int AS captured_today
           FROM game_territory`,
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total_unlocks
           FROM game_user_achievement`,
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE is_active)::int AS active,
                COUNT(*) FILTER (WHERE is_premium)::int AS premium
           FROM market_item`,
      ),
      this.db.query(
        `SELECT COUNT(*) FILTER (WHERE is_published)::int AS published,
                COUNT(*) FILTER (WHERE NOT is_published)::int AS draft
           FROM game_news`,
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS campaigns,
                COALESCE(SUM(sent_count), 0)::bigint AS sent_total
           FROM admin_push_campaign`,
      ),
      this.db.query(
        `SELECT d::date AS day,
                (SELECT COUNT(*) FROM sys_user u WHERE u.dateofcreated::date = d)::int AS new_users,
                (SELECT COUNT(*) FROM game_free_run r WHERE r.started_at::date = d)::int AS runs,
                (SELECT COALESCE(SUM(distance_km), 0) FROM game_free_run r WHERE r.started_at::date = d)::float AS km,
                (SELECT COALESCE(SUM(steps), 0) FROM game_step_activity s WHERE s.started_at::date = d)::bigint AS steps,
                (SELECT COUNT(*) FROM game_territory t WHERE t.captured_at::date = d)::int AS territories,
                (SELECT COUNT(*) FROM game_user_achievement a WHERE a.unlocked_at::date = d)::int AS unlocks
           FROM generate_series(CURRENT_DATE - 29, CURRENT_DATE, interval '1 day') AS d
           ORDER BY 1`,
      ),
      // Full selected year (Jan 1 – Dec 31)
      this.db.query(
        `SELECT d::date AS day,
                (SELECT COUNT(*) FROM sys_user u WHERE u.dateofcreated::date = d)::int AS new_users,
                (SELECT COUNT(*) FROM game_free_run r WHERE r.started_at::date = d)::int AS runs,
                (SELECT COALESCE(SUM(distance_km), 0) FROM game_free_run r WHERE r.started_at::date = d)::float AS km,
                (SELECT COALESCE(SUM(steps), 0) FROM game_step_activity s WHERE s.started_at::date = d)::bigint AS steps
           FROM generate_series($1::date, $2::date, interval '1 day') AS d
           ORDER BY 1`,
        [calFrom, calTo],
      ),
      this.db.query(
        `SELECT DISTINCT EXTRACT(YEAR FROM d)::int AS y FROM (
            SELECT dateofcreated AS d FROM sys_user
            UNION ALL SELECT started_at FROM game_free_run
            UNION ALL SELECT started_at FROM game_step_activity
            UNION ALL SELECT captured_at FROM game_territory
          ) t
          WHERE d IS NOT NULL
          ORDER BY 1`,
      ),
    ]);

    const availableYears = (yearRows as Array<{ y: number }>)
      .map((r) => Number(r.y))
      .filter((n) => Number.isFinite(n));
    if (!availableYears.includes(y)) availableYears.push(y);
    availableYears.sort((a, b) => a - b);

    return {
      users: {
        total: Number(users.total),
        blocked: Number(users.blocked),
        newToday: Number(users.new_today),
        activeLast3Days: Number(users.active_3d),
      },
      events: {
        active: Number(events.active),
        published: Number(events.published),
        participantsTotal: Number(events.participants_total),
      },
      activityToday: {
        runs: Number(todayRun.runs),
        distanceKm: Number(todayRun.km),
        steps: Number(todaySteps.steps),
      },
      territories: {
        total: Number(territories.total),
        capturedToday: Number(territories.captured_today),
      },
      badges: {
        totalUnlocks: Number(badges.total_unlocks),
      },
      market: {
        total: Number(market.total),
        active: Number(market.active),
        premium: Number(market.premium),
      },
      news: {
        published: Number(news.published),
        draft: Number(news.draft),
      },
      push: {
        campaigns: Number(push.campaigns),
        sentTotal: Number(push.sent_total),
      },
      last30Days: (
        daily as Array<{
          day: Date;
          new_users: number;
          runs: number;
          km: number;
          steps: number;
          territories: number;
          unlocks: number;
        }>
      ).map((r) => ({
        day: formatIso(new Date(r.day)).slice(0, 10),
        newUsers: Number(r.new_users),
        runs: Number(r.runs),
        distanceKm: Number(r.km),
        steps: Number(r.steps),
        territories: Number(r.territories),
        unlocks: Number(r.unlocks),
      })),
      // charts still use last 7 of the 30-day series
      last7Days: (
        daily as Array<{
          day: Date;
          new_users: number;
          runs: number;
          km: number;
          steps: number;
          territories: number;
          unlocks: number;
        }>
      )
        .slice(-7)
        .map((r) => ({
          day: formatIso(new Date(r.day)).slice(0, 10),
          newUsers: Number(r.new_users),
          runs: Number(r.runs),
          distanceKm: Number(r.km),
          steps: Number(r.steps),
          territories: Number(r.territories),
          unlocks: Number(r.unlocks),
        })),
      activityCalendar: (
        calendar as Array<{
          day: Date;
          new_users: number;
          runs: number;
          km: number;
          steps: number;
        }>
      ).map((r) => ({
        day: formatIso(new Date(r.day)).slice(0, 10),
        newUsers: Number(r.new_users),
        runs: Number(r.runs),
        distanceKm: Number(r.km),
        steps: Number(r.steps),
      })),
      calendarYear: y,
      availableYears,
    };
  }

  /** Active users + run/territory events for one calendar day (YYYY-MM-DD). */
  async dayActivity(day: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      throw badRequest(['day must be YYYY-MM-DD']);
    }
    const [users, runs, territories] = await Promise.all([
      this.db.query(
        `SELECT u.id::text, u.username, u.zonic_id, u.avatar_file_id,
                (SELECT COUNT(*)::int FROM game_free_run r WHERE r.user_id = u.id AND r.started_at::date = $1::date) AS runs_day,
                (SELECT COALESCE(SUM(r.distance_km), 0)::float FROM game_free_run r WHERE r.user_id = u.id AND r.started_at::date = $1::date) AS km_day,
                (SELECT COALESCE(SUM(s.steps), 0)::bigint FROM game_step_activity s WHERE s.user_id = u.id AND s.started_at::date = $1::date) AS steps_day,
                (SELECT COUNT(*)::int FROM game_territory t WHERE t.owner_user_id = u.id AND t.captured_at::date = $1::date) AS terr_day,
                (SELECT COALESCE(SUM(t.area_m2), 0)::float FROM game_territory t WHERE t.owner_user_id = u.id AND t.captured_at::date = $1::date) AS area_day,
                (SELECT COUNT(*)::int FROM game_free_run r WHERE r.user_id = u.id) AS runs_total,
                (SELECT COALESCE(SUM(r.distance_km), 0)::float FROM game_free_run r WHERE r.user_id = u.id) AS km_total,
                (SELECT COUNT(*)::int FROM game_territory t WHERE t.owner_user_id = u.id) AS terr_total,
                (SELECT COALESCE(SUM(t.area_m2), 0)::float FROM game_territory t WHERE t.owner_user_id = u.id) AS area_total
           FROM sys_user u
          WHERE EXISTS (SELECT 1 FROM game_free_run r WHERE r.user_id = u.id AND r.started_at::date = $1::date)
             OR EXISTS (SELECT 1 FROM game_territory t WHERE t.owner_user_id = u.id AND t.captured_at::date = $1::date)
             OR EXISTS (SELECT 1 FROM game_step_activity s WHERE s.user_id = u.id AND s.started_at::date = $1::date)
          ORDER BY (SELECT COALESCE(SUM(r.distance_km), 0) FROM game_free_run r WHERE r.user_id = u.id AND r.started_at::date = $1::date) DESC,
                   u.username ASC
          LIMIT 200`,
        [day],
      ),
      this.db.query(
        `SELECT r.id::text, r.user_id::text, u.username, u.zonic_id, u.avatar_file_id,
                r.started_at, r.ended_at, r.duration_seconds, r.distance_km, r.average_speed_kmh,
                CASE WHEN r.route_points IS NOT NULL
                      AND jsonb_typeof(r.route_points::jsonb) = 'array'
                      AND jsonb_array_length(r.route_points::jsonb) > 0
                     THEN (r.route_points::jsonb->0->>'lat')::float ELSE NULL END AS lat,
                CASE WHEN r.route_points IS NOT NULL
                      AND jsonb_typeof(r.route_points::jsonb) = 'array'
                      AND jsonb_array_length(r.route_points::jsonb) > 0
                     THEN (r.route_points::jsonb->0->>'lng')::float ELSE NULL END AS lng
           FROM game_free_run r
           JOIN sys_user u ON u.id = r.user_id
          WHERE r.started_at::date = $1::date
          ORDER BY r.started_at ASC
          LIMIT 500`,
        [day],
      ),
      this.db.query(
        `SELECT t.id::text, t.owner_user_id::text AS user_id, u.username, u.zonic_id, u.avatar_file_id,
                t.captured_at, t.duration_seconds, t.run_distance_m, t.area_m2, t.avg_speed_kmh,
                ST_Y(t.centroid) AS lat, ST_X(t.centroid) AS lng,
                c.shortname AS country_name, reg.shortname AS region_name
           FROM game_territory t
           JOIN sys_user u ON u.id = t.owner_user_id
           LEFT JOIN info_country c ON c.id = u.country_id
           LEFT JOIN info_region reg ON reg.id = u.region_id
          WHERE t.captured_at::date = $1::date
          ORDER BY t.captured_at ASC
          LIMIT 500`,
        [day],
      ),
    ]);

    const areaKm2 = (m2: unknown) => Math.round((Number(m2) / 1_000_000) * 10000) / 10000;

    return {
      day,
      users: (users as Array<Record<string, unknown>>).map((r) => ({
        id: r.id,
        username: r.username,
        zonicId: r.zonic_id,
        avatarFileId: r.avatar_file_id ?? null,
        day: {
          runs: Number(r.runs_day) || 0,
          distanceKm: Number(r.km_day) || 0,
          steps: Number(r.steps_day) || 0,
          territories: Number(r.terr_day) || 0,
          areaKm2: areaKm2(r.area_day),
          activityCount:
            (Number(r.runs_day) || 0) + (Number(r.terr_day) || 0) + (Number(r.steps_day) > 0 ? 1 : 0),
        },
        total: {
          runs: Number(r.runs_total) || 0,
          distanceKm: Number(r.km_total) || 0,
          territories: Number(r.terr_total) || 0,
          areaKm2: areaKm2(r.area_total),
        },
      })),
      events: [
        ...(runs as Array<Record<string, unknown>>).map((r) => ({
          id: r.id,
          kind: 'run' as const,
          userId: r.user_id,
          username: r.username,
          zonicId: r.zonic_id,
          avatarFileId: r.avatar_file_id ?? null,
          at: formatIso(new Date(r.started_at as Date)),
          endedAt: r.ended_at ? formatIso(new Date(r.ended_at as Date)) : null,
          durationSeconds: Number(r.duration_seconds) || 0,
          distanceKm: Number(r.distance_km) || 0,
          averageSpeedKmh: Number(r.average_speed_kmh) || 0,
          lat: r.lat != null ? Number(r.lat) : null,
          lng: r.lng != null ? Number(r.lng) : null,
          place: null as string | null,
        })),
        ...(territories as Array<Record<string, unknown>>).map((r) => ({
          id: r.id,
          kind: 'territory' as const,
          userId: r.user_id,
          username: r.username,
          zonicId: r.zonic_id,
          avatarFileId: r.avatar_file_id ?? null,
          at: formatIso(new Date(r.captured_at as Date)),
          endedAt: null as string | null,
          durationSeconds: Number(r.duration_seconds) || 0,
          distanceKm: Math.round((Number(r.run_distance_m) / 1000) * 1000) / 1000,
          areaKm2: areaKm2(r.area_m2),
          averageSpeedKmh: Number(r.avg_speed_kmh) || 0,
          lat: r.lat != null ? Number(r.lat) : null,
          lng: r.lng != null ? Number(r.lng) : null,
          place: [r.region_name, r.country_name].filter(Boolean).join(', ') || null,
        })),
      ].sort((a, b) => String(a.at).localeCompare(String(b.at))),
    };
  }

  // ─── Users ───────────────────────────────────────────────────────────────
  async listUsers(q: string | undefined, status: string | undefined, page: number, pageSize: number) {
    const where: string[] = ['1=1'];
    const params: unknown[] = [];
    if (q?.trim()) {
      params.push(`%${q.trim()}%`);
      const i = params.length;
      where.push(
        `(u.username ILIKE $${i} OR COALESCE(u.email,'') ILIKE $${i} OR COALESCE(u.phone,'') ILIKE $${i} OR CAST(u.zonic_id AS text) ILIKE $${i})`,
      );
    }
    if (status === 'blocked') where.push('u.is_blocked = true');
    if (status === 'active') where.push('u.is_blocked = false');

    const offset = (page - 1) * pageSize;
    const rows = await this.db.query(
      `SELECT u.id::text, u.username, u.email, u.phone, u.zonic_id, u.level, u.is_admin, u.is_blocked,
              u.blocked_at, u.blocked_reason, u.last_seen_at, u.dateofcreated, u.avatar_file_id,
              (SELECT COUNT(*)::int FROM game_free_run r WHERE r.user_id = u.id) AS runs_count,
              (SELECT COUNT(*)::int FROM game_territory t WHERE t.owner_user_id = u.id) AS territories_count
         FROM sys_user u
        WHERE ${where.join(' AND ')}
        ORDER BY u.dateofcreated DESC
        LIMIT ${pageSize} OFFSET ${offset}`,
      params,
    );
    const [{ cnt }] = await this.db.query(
      `SELECT COUNT(*)::int AS cnt FROM sys_user u WHERE ${where.join(' AND ')}`,
      params,
    );
    return {
      total: Number(cnt),
      page,
      pageSize,
      items: rows.map((r: Record<string, unknown>) => ({
        id: r.id,
        username: r.username,
        email: r.email,
        phone: r.phone,
        zonicId: r.zonic_id,
        level: r.level,
        isAdmin: r.is_admin,
        isBlocked: r.is_blocked,
        blockedAt: r.blocked_at ? formatIso(new Date(r.blocked_at as Date)) : null,
        blockedReason: r.blocked_reason,
        lastSeenAt: r.last_seen_at ? formatIso(new Date(r.last_seen_at as Date)) : null,
        createdAt: formatIso(new Date(r.dateofcreated as Date)),
        avatarFileId: r.avatar_file_id,
        runsCount: Number(r.runs_count) || 0,
        territoriesCount: Number(r.territories_count) || 0,
      })),
    };
  }

  async blockUser(id: string, dto: BlockUserDto) {
    const user = await this.requireUser(id);
    if (user.isAdmin) throw badRequest(['Cannot block an admin.']);
    await this.db.query(
      `UPDATE sys_user SET is_blocked = true, blocked_at = now(), blocked_reason = $2 WHERE id = $1`,
      [id, dto.reason ?? null],
    );
    return { ok: true };
  }

  async unblockUser(id: string) {
    await this.requireUser(id);
    await this.db.query(
      `UPDATE sys_user SET is_blocked = false, blocked_at = NULL, blocked_reason = NULL WHERE id = $1`,
      [id],
    );
    return { ok: true };
  }

  // ─── Events ──────────────────────────────────────────────────────────────
  async listAdminEvents() {
    const rows = await this.db.query(
      `SELECT e.id::text, e.title, e.description, e.goal_type, e.goal_value, e.starts_at, e.ends_at,
              e.status, e.created_at,
              (SELECT COUNT(*) FROM game_event_participant p WHERE p.event_id = e.id)::int AS participants
         FROM game_event e ORDER BY e.created_at DESC`,
    );
    return { items: rows.map((r) => this.mapEvent(r)) };
  }

  async createEvent(adminId: string, dto: CreateEventDto) {
    const starts = this.requireDate(dto.startsAt);
    const ends = this.requireDate(dto.endsAt);
    if (ends <= starts) throw badRequest(['endsAt must be after startsAt.']);
    const status = dto.publish ? 'published' : 'draft';
    const [row] = await this.db.query(
      `INSERT INTO game_event (title, description, goal_type, goal_value, starts_at, ends_at, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id::text, title, description, goal_type, goal_value, starts_at, ends_at, status, created_at`,
      [dto.title, dto.description ?? null, dto.goalType, dto.goalValue, starts, ends, status, adminId],
    );
    if (dto.publish) await this.announceEvent(row);
    return this.mapEvent({ ...row, participants: 0 });
  }

  async updateEvent(id: string, dto: UpdateEventDto) {
    const [cur] = await this.db.query(`SELECT * FROM game_event WHERE id = $1`, [id]);
    if (!cur) throw new NotFoundException('Event not found.');
    const starts = dto.startsAt ? this.requireDate(dto.startsAt) : cur.starts_at;
    const ends = dto.endsAt ? this.requireDate(dto.endsAt) : cur.ends_at;
    if (ends <= starts) throw badRequest(['endsAt must be after startsAt.']);
    const wasDraft = cur.status === 'draft';
    const nextStatus = dto.status ?? cur.status;
    const [row] = await this.db.query(
      `UPDATE game_event SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         goal_type = COALESCE($4, goal_type),
         goal_value = COALESCE($5, goal_value),
         starts_at = $6, ends_at = $7,
         status = $8, updated_at = now()
       WHERE id = $1
       RETURNING id::text, title, description, goal_type, goal_value, starts_at, ends_at, status, created_at`,
      [
        id,
        dto.title ?? null,
        dto.description ?? null,
        dto.goalType ?? null,
        dto.goalValue ?? null,
        starts,
        ends,
        nextStatus,
      ],
    );
    if (wasDraft && nextStatus === 'published') await this.announceEvent(row);
    const [{ cnt }] = await this.db.query(
      `SELECT COUNT(*)::int AS cnt FROM game_event_participant WHERE event_id = $1`,
      [id],
    );
    return this.mapEvent({ ...row, participants: cnt });
  }

  async deleteEvent(id: string) {
    const res = await this.db.query(`DELETE FROM game_event WHERE id = $1 RETURNING id`, [id]);
    if (!res.length) throw new NotFoundException('Event not found.');
    return { ok: true };
  }

  async eventParticipants(id: string) {
    await this.requireEvent(id);
    const rows = await this.db.query(
      `SELECT u.id::text, u.username, u.zonic_id, u.avatar_file_id, p.joined_at
         FROM game_event_participant p
         JOIN sys_user u ON u.id = p.user_id
        WHERE p.event_id = $1
        ORDER BY p.joined_at ASC`,
      [id],
    );
    return {
      items: rows.map((r: Record<string, unknown>) => ({
        userId: r.id,
        username: r.username,
        zonicId: r.zonic_id,
        avatarFileId: r.avatar_file_id,
        joinedAt: formatIso(new Date(r.joined_at as Date)),
      })),
    };
  }

  async listPublicEvents() {
    const rows = await this.db.query(
      `SELECT e.id::text, e.title, e.description, e.goal_type, e.goal_value, e.starts_at, e.ends_at,
              e.status, e.created_at,
              (SELECT COUNT(*) FROM game_event_participant p WHERE p.event_id = e.id)::int AS participants
         FROM game_event e
        WHERE e.status = 'published'
        ORDER BY e.starts_at DESC`,
    );
    return { items: rows.map((r) => this.mapEvent(r)) };
  }

  async joinEvent(userId: string, eventId: string) {
    const ev = await this.requireEvent(eventId);
    if (ev.status !== 'published') throw badRequest(['Event is not open.']);
    const now = new Date();
    if (now > new Date(ev.ends_at)) throw badRequest(['Event has ended.']);
    await this.db.query(
      `INSERT INTO game_event_participant (event_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [eventId, userId],
    );
    return { ok: true };
  }

  private async announceEvent(row: { id: string; title: string; description: string | null }) {
    await this.db.query(
      `INSERT INTO game_news (type, title, body, is_published, published_at, created_by)
       VALUES ('announcement', $1, $2, true, now(), NULL)`,
      [row.title, row.description ?? `Yangi musobaqa: ${row.title}`],
    );
    const ids = await this.audienceUserIds('all');
    await this.fanoutNotification(ids, 'event', row.title, row.description ?? 'Yangi musobaqaga qo‘shiling', {
      eventId: row.id,
    });
  }

  // ─── Push ────────────────────────────────────────────────────────────────
  async sendPush(adminId: string, dto: SendPushDto) {
    if (dto.audience === 'userIds' && (!dto.userIds || dto.userIds.length === 0)) {
      throw badRequest(['userIds required for audience=userIds.']);
    }
    const userIds = await this.audienceUserIds(dto.audience, dto.userIds);
    const sent = await this.fanoutNotification(userIds, 'system', dto.title, dto.body ?? null, {
      campaign: 'admin',
    });
    const [row] = await this.db.query(
      `INSERT INTO admin_push_campaign (title, body, audience, user_ids, sent_count, created_by)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6)
       RETURNING id::text, title, body, audience, sent_count, created_at`,
      [
        dto.title,
        dto.body ?? null,
        dto.audience,
        JSON.stringify(dto.userIds ?? []),
        sent,
        adminId,
      ],
    );
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      audience: row.audience,
      sentCount: Number(row.sent_count),
      createdAt: formatIso(new Date(row.created_at)),
    };
  }

  async pushHistory(page: number, pageSize: number) {
    const rows = await this.db.query(
      `SELECT id::text, title, body, audience, sent_count, created_at
         FROM admin_push_campaign ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
    );
    const [{ cnt }] = await this.db.query(`SELECT COUNT(*)::int AS cnt FROM admin_push_campaign`);
    return {
      total: Number(cnt),
      page,
      pageSize,
      items: rows.map((r: Record<string, unknown>) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        audience: r.audience,
        sentCount: Number(r.sent_count),
        createdAt: formatIso(new Date(r.created_at as Date)),
      })),
    };
  }

  // ─── Badges ──────────────────────────────────────────────────────────────
  async listBadges() {
    const rows = await this.db.query(
      `SELECT b.code, b.title, b.type, b.threshold, b.unit, b.description, b.icon_file_id, b.is_active,
              b.created_at,
              (SELECT COUNT(*) FROM game_user_achievement a WHERE a.achievement_code = b.code)::int AS unlocks
         FROM game_badge b ORDER BY b.type, b.threshold`,
    );
    return { items: rows.map((r) => this.mapBadge(r)) };
  }

  async createBadge(dto: CreateBadgeDto) {
    try {
      const [row] = await this.db.query(
        `INSERT INTO game_badge (code, title, type, threshold, unit, description, icon_file_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING code, title, type, threshold, unit, description, icon_file_id, is_active, created_at`,
        [dto.code, dto.title, dto.type, dto.threshold, dto.unit, dto.description ?? null, dto.iconFileId ?? null],
      );
      return this.mapBadge({ ...row, unlocks: 0 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('duplicate') || msg.includes('unique')) throw badRequest(['Badge code already exists.']);
      throw e;
    }
  }

  async updateBadge(code: string, dto: UpdateBadgeDto) {
    const [cur] = await this.db.query(`SELECT code FROM game_badge WHERE code = $1`, [code]);
    if (!cur) throw new NotFoundException('Badge not found.');
    const [row] = await this.db.query(
      `UPDATE game_badge SET
         title = COALESCE($2, title),
         type = COALESCE($3, type),
         threshold = COALESCE($4, threshold),
         unit = COALESCE($5, unit),
         description = COALESCE($6, description),
         icon_file_id = COALESCE($7, icon_file_id),
         is_active = COALESCE($8, is_active),
         updated_at = now()
       WHERE code = $1
       RETURNING code, title, type, threshold, unit, description, icon_file_id, is_active, created_at`,
      [
        code,
        dto.title ?? null,
        dto.type ?? null,
        dto.threshold ?? null,
        dto.unit ?? null,
        dto.description ?? null,
        dto.iconFileId ?? null,
        dto.isActive ?? null,
      ],
    );
    const [{ cnt }] = await this.db.query(
      `SELECT COUNT(*)::int AS cnt FROM game_user_achievement WHERE achievement_code = $1`,
      [code],
    );
    return this.mapBadge({ ...row, unlocks: cnt });
  }

  async deleteBadge(code: string) {
    const res = await this.db.query(`DELETE FROM game_badge WHERE code = $1 RETURNING code`, [code]);
    if (!res.length) throw new NotFoundException('Badge not found.');
    return { ok: true };
  }

  async badgeUnlocks(code: string, page: number, pageSize: number) {
    const [b] = await this.db.query(`SELECT code FROM game_badge WHERE code = $1`, [code]);
    if (!b) throw new NotFoundException('Badge not found.');
    const rows = await this.db.query(
      `SELECT u.id::text, u.username, u.zonic_id, u.avatar_file_id, a.unlocked_at
         FROM game_user_achievement a
         JOIN sys_user u ON u.id = a.user_id
        WHERE a.achievement_code = $1
        ORDER BY a.unlocked_at DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      [code],
    );
    const [{ cnt }] = await this.db.query(
      `SELECT COUNT(*)::int AS cnt FROM game_user_achievement WHERE achievement_code = $1`,
      [code],
    );
    return {
      total: Number(cnt),
      page,
      pageSize,
      items: rows.map((r: Record<string, unknown>) => ({
        userId: r.id,
        username: r.username,
        zonicId: r.zonic_id,
        avatarFileId: r.avatar_file_id ?? null,
        unlockedAt: formatIso(new Date(r.unlocked_at as Date)),
      })),
    };
  }

  // ─── Market ──────────────────────────────────────────────────────────────
  async listMarketItems() {
    const rows = await this.db.query(
      `SELECT id::text, code, title, description, price_tanga, category, currency, is_premium,
              duration, discount_label, image_file_id, is_active, created_at
         FROM market_item ORDER BY created_at DESC`,
    );
    return { items: rows.map((r) => this.mapMarket(r)) };
  }

  async upsertMarketItem(dto: UpsertMarketItemDto) {
    const [row] = await this.db.query(
      `INSERT INTO market_item
         (code, title, description, price_tanga, category, currency, is_premium, duration, discount_label, image_file_id, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,COALESCE($11,true))
       ON CONFLICT (code) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         price_tanga = EXCLUDED.price_tanga,
         category = EXCLUDED.category,
         currency = EXCLUDED.currency,
         is_premium = EXCLUDED.is_premium,
         duration = EXCLUDED.duration,
         discount_label = EXCLUDED.discount_label,
         image_file_id = COALESCE(EXCLUDED.image_file_id, market_item.image_file_id),
         is_active = COALESCE(EXCLUDED.is_active, market_item.is_active)
       RETURNING id::text, code, title, description, price_tanga, category, currency, is_premium,
                 duration, discount_label, image_file_id, is_active, created_at`,
      [
        dto.code,
        dto.title,
        dto.description ?? null,
        dto.price,
        dto.category ?? null,
        dto.currency ?? 'tanga',
        dto.isPremium ?? false,
        dto.duration ?? 'permanent',
        dto.discountLabel ?? null,
        dto.imageFileId ?? null,
        dto.isActive ?? true,
      ],
    );
    return this.mapMarket(row);
  }

  // ─── News ────────────────────────────────────────────────────────────────
  async listAdminNews() {
    const rows = await this.db.query(
      `SELECT id::text, type, title, body, image_file_id, is_published, published_at, created_at
         FROM game_news ORDER BY created_at DESC`,
    );
    return { items: rows.map((r) => this.mapNews(r)) };
  }

  async listPublicNews() {
    const rows = await this.db.query(
      `SELECT id::text, type, title, body, image_file_id, is_published, published_at, created_at
         FROM game_news WHERE is_published = true
        ORDER BY COALESCE(published_at, created_at) DESC`,
    );
    return { items: rows.map((r) => this.mapNews(r)) };
  }

  async createNews(adminId: string, dto: CreateNewsDto) {
    const published = dto.publish === true;
    const [row] = await this.db.query(
      `INSERT INTO game_news (type, title, body, image_file_id, is_published, published_at, created_by)
       VALUES ($1,$2,$3,$4,$5, CASE WHEN $5 THEN now() ELSE NULL END, $6)
       RETURNING id::text, type, title, body, image_file_id, is_published, published_at, created_at`,
      [dto.type, dto.title, dto.body ?? null, dto.imageFileId ?? null, published, adminId],
    );
    return this.mapNews(row);
  }

  async updateNews(id: string, dto: UpdateNewsDto) {
    const [cur] = await this.db.query(`SELECT id FROM game_news WHERE id = $1`, [id]);
    if (!cur) throw new NotFoundException('News not found.');
    const [row] = await this.db.query(
      `UPDATE game_news SET
         type = COALESCE($2, type),
         title = COALESCE($3, title),
         body = COALESCE($4, body),
         image_file_id = COALESCE($5, image_file_id),
         is_published = COALESCE($6, is_published),
         published_at = CASE
           WHEN $6 = true AND published_at IS NULL THEN now()
           WHEN $6 = false THEN NULL
           ELSE published_at
         END,
         updated_at = now()
       WHERE id = $1
       RETURNING id::text, type, title, body, image_file_id, is_published, published_at, created_at`,
      [id, dto.type ?? null, dto.title ?? null, dto.body ?? null, dto.imageFileId ?? null, dto.isPublished ?? null],
    );
    return this.mapNews(row);
  }

  async deleteNews(id: string) {
    const res = await this.db.query(`DELETE FROM game_news WHERE id = $1 RETURNING id`, [id]);
    if (!res.length) throw new NotFoundException('News not found.');
    return { ok: true };
  }

  // ─── Tracks ──────────────────────────────────────────────────────────────
  async userRuns(userId: string) {
    await this.requireUser(userId);
    const rows = await this.db.query(
      `SELECT id::text, started_at, ended_at, duration_seconds, distance_km, average_speed_kmh, pace_min_per_km
         FROM game_free_run WHERE user_id = $1
        ORDER BY started_at DESC LIMIT 100`,
      [userId],
    );
    return {
      items: rows.map((r: Record<string, unknown>) => ({
        id: r.id,
        startedAt: formatIso(new Date(r.started_at as Date)),
        endedAt: formatIso(new Date(r.ended_at as Date)),
        durationSeconds: Number(r.duration_seconds),
        distanceKm: Number(r.distance_km),
        averageSpeedKmh: Number(r.average_speed_kmh),
        paceMinPerKm: Number(r.pace_min_per_km),
      })),
    };
  }

  async runDetail(runId: string) {
    const [r] = await this.db.query(
      `SELECT id::text, user_id::text, started_at, ended_at, duration_seconds, distance_km,
              average_speed_kmh, pace_min_per_km, route_points
         FROM game_free_run WHERE id = $1`,
      [runId],
    );
    if (!r) throw new NotFoundException('Run not found.');
    const [u] = await this.db.query(
      `SELECT username, zonic_id FROM sys_user WHERE id = $1`,
      [r.user_id],
    );
    const points = Array.isArray(r.route_points) ? r.route_points : [];
    return {
      id: r.id,
      userId: r.user_id,
      username: u?.username ?? null,
      zonicId: u?.zonic_id ?? null,
      startedAt: formatIso(new Date(r.started_at)),
      endedAt: formatIso(new Date(r.ended_at)),
      durationSeconds: Number(r.duration_seconds),
      distanceKm: Number(r.distance_km),
      averageSpeedKmh: Number(r.average_speed_kmh),
      paceMinPerKm: Number(r.pace_min_per_km),
      polyline: points.map((p: { lat: number; lng: number; ts?: string }) => ({
        lat: Number(p.lat),
        lng: Number(p.lng),
        ts: p.ts ?? null,
      })),
    };
  }

  /** Read-only: territories captured by a user (does not change existing Runs APIs). */
  async userTerritories(userId: string) {
    await this.requireUser(userId);
    const rows = await this.db.query(
      `SELECT id::text, captured_at, duration_seconds, run_distance_m, area_m2, avg_speed_kmh, color,
              ST_Y(centroid) AS lat, ST_X(centroid) AS lng
         FROM game_territory WHERE owner_user_id = $1
        ORDER BY captured_at DESC LIMIT 100`,
      [userId],
    );
    return {
      items: rows.map((r: Record<string, unknown>) => ({
        id: r.id,
        type: 'territory' as const,
        capturedAt: formatIso(new Date(r.captured_at as Date)),
        durationSeconds: Number(r.duration_seconds) || 0,
        distanceKm: Math.round((Number(r.run_distance_m) / 1000) * 1000) / 1000,
        areaKm2: Math.round((Number(r.area_m2) / 1_000_000) * 10000) / 10000,
        averageSpeedKmh: Number(r.avg_speed_kmh) || 0,
        color: (r.color as string) || '#3B82F6',
        lat: Number(r.lat),
        lng: Number(r.lng),
      })),
    };
  }

  /**
   * Admin map feed — real game_territory rows, optional owner country/region/q filters.
   * Includes polygon rings for Leaflet (limit 500).
   */
  async listTerritoriesMap(countryId?: number, regionId?: number, q?: string) {
    const where: string[] = ['1=1'];
    const params: unknown[] = [];
    if (countryId != null && Number.isFinite(Number(countryId))) {
      params.push(Number(countryId));
      where.push(`u.country_id = $${params.length}`);
    }
    if (regionId != null && Number.isFinite(Number(regionId))) {
      params.push(Number(regionId));
      where.push(`u.region_id = $${params.length}`);
    }
    if (q?.trim()) {
      params.push(`%${q.trim()}%`);
      const i = params.length;
      where.push(`(u.username ILIKE $${i} OR CAST(u.zonic_id AS text) ILIKE $${i})`);
    }

    const rows = await this.db.query(
      `SELECT t.id::text, t.owner_user_id::text, u.username, u.zonic_id, u.avatar_file_id,
              u.country_id, u.region_id,
              c.shortname AS country_name, r.shortname AS region_name,
              t.color, t.area_m2, t.captured_at, t.duration_seconds, t.run_distance_m, t.avg_speed_kmh,
              ST_Y(t.centroid) AS lat, ST_X(t.centroid) AS lng,
              ST_AsGeoJSON(t.geom) AS geojson
         FROM game_territory t
         JOIN sys_user u ON u.id = t.owner_user_id
         LEFT JOIN info_country c ON c.id = u.country_id
         LEFT JOIN info_region r ON r.id = u.region_id
        WHERE ${where.join(' AND ')}
        ORDER BY t.area_m2 DESC
        LIMIT 500`,
      params,
    );

    return {
      total: rows.length,
      countryId: countryId ?? null,
      regionId: regionId ?? null,
      items: rows.map((r: Record<string, unknown>) => {
        const polygons = this.geoJsonToPolygons(r.geojson);
        const cid = r.country_id != null ? Number(r.country_id) : null;
        const rid = r.region_id != null ? Number(r.region_id) : null;
        return {
          id: r.id,
          type: 'territory' as const,
          userId: r.owner_user_id,
          username: r.username,
          zonicId: r.zonic_id,
          avatarFileId: r.avatar_file_id ?? null,
          countryId: cid,
          regionId: rid,
          countryName: cid != null ? countryUz(cid, r.country_name as string) : null,
          regionName: rid != null ? regionUz(rid, r.region_name as string) : null,
          color: (r.color as string) || '#3B82F6',
          areaKm2: Math.round((Number(r.area_m2) / 1_000_000) * 10000) / 10000,
          capturedAt: formatIso(new Date(r.captured_at as Date)),
          durationSeconds: Number(r.duration_seconds) || 0,
          distanceKm: Math.round((Number(r.run_distance_m) / 1000) * 1000) / 1000,
          averageSpeedKmh: Number(r.avg_speed_kmh) || 0,
          lat: Number(r.lat),
          lng: Number(r.lng),
          polygons,
          polygon: polygons[0] || [],
        };
      }),
    };
  }

  /** Select lists with Uzbek-Latin labels (real ids from info_* tables). */
  async countriesUz() {
    const rows = await this.db.query(
      `SELECT id, shortname FROM info_country ORDER BY shortname`,
    );
    const items = rows.map((r: { id: number; shortname: string }) => ({
      value: Number(r.id),
      text: countryUz(Number(r.id), r.shortname),
    }));
    items.sort((a, b) => a.text.localeCompare(b.text, 'uz'));
    return items;
  }

  async regionsUz(countryId?: number) {
    const params: unknown[] = [];
    let where = '1=1';
    if (countryId != null && Number.isFinite(Number(countryId))) {
      params.push(Number(countryId));
      where = `countryid = $1`;
    }
    const rows = await this.db.query(
      `SELECT id, shortname FROM info_region WHERE ${where} ORDER BY id`,
      params,
    );
    return rows.map((r: { id: number; shortname: string }) => ({
      value: Number(r.id),
      text: regionUz(Number(r.id), r.shortname),
    }));
  }

  async territoryDetail(territoryId: string) {
    const [r] = await this.db.query(
      `SELECT id::text, owner_user_id::text, captured_at, duration_seconds, run_distance_m,
              area_m2, avg_speed_kmh, color, ST_AsGeoJSON(geom) AS geojson,
              ST_Y(centroid) AS lat, ST_X(centroid) AS lng
         FROM game_territory WHERE id = $1`,
      [territoryId],
    );
    if (!r) throw new NotFoundException('Territory not found.');
    const [u] = await this.db.query(
      `SELECT username, zonic_id FROM sys_user WHERE id = $1`,
      [r.owner_user_id],
    );
    const polygons = this.geoJsonToPolygons(r.geojson);
    return {
      id: r.id,
      type: 'territory' as const,
      userId: r.owner_user_id,
      username: u?.username ?? null,
      zonicId: u?.zonic_id ?? null,
      capturedAt: formatIso(new Date(r.captured_at)),
      durationSeconds: Number(r.duration_seconds) || 0,
      distanceKm: Math.round((Number(r.run_distance_m) / 1000) * 1000) / 1000,
      areaKm2: Math.round((Number(r.area_m2) / 1_000_000) * 10000) / 10000,
      averageSpeedKmh: Number(r.avg_speed_kmh) || 0,
      color: (r.color as string) || '#3B82F6',
      lat: Number(r.lat),
      lng: Number(r.lng),
      polygons,
      polygon: polygons[0] || [],
    };
  }

  /** All exterior rings from Polygon / MultiPolygon → Leaflet-ready rings. */
  private geoJsonToPolygons(raw: unknown): Array<Array<{ lat: number; lng: number }>> {
    try {
      const g = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!g || typeof g !== 'object') return [];
      const geom = g as { type?: string; coordinates?: unknown };
      const rings: number[][][] = [];
      if (geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates)) {
        for (const poly of geom.coordinates as number[][][][]) {
          if (poly?.[0]?.length) rings.push(poly[0]);
        }
      } else if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
        const outer = (geom.coordinates as number[][][])[0];
        if (outer?.length) rings.push(outer);
      }
      return rings
        .map((ring) =>
          ring
            .map((c) => ({ lat: Number(c[1]), lng: Number(c[0]) }))
            .filter((p) => isFinite(p.lat) && isFinite(p.lng)),
        )
        .filter((ring) => ring.length >= 3);
    } catch {
      return [];
    }
  }

  /** Exterior ring of first polygon part → [{lat,lng}, ...] for Leaflet. */
  private geoJsonToRing(raw: unknown): Array<{ lat: number; lng: number }> {
    return this.geoJsonToPolygons(raw)[0] || [];
  }

  // ─── Uploads ─────────────────────────────────────────────────────────────
  saveImage(file: UploadedImage | undefined): { fileId: string } {
    if (!file?.buffer?.length) throw badRequest(['No file uploaded (field "file").']);
    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) throw badRequest(['Unsupported image type.']);
    const fileId = `${randomUUID()}${ext}`;
    writeFileSync(join(this.uploadDir, fileId), file.buffer);
    return { fileId };
  }

  openImage(fileId: string): { stream: ReturnType<typeof createReadStream>; contentType: string } {
    const safe = basename(fileId);
    const path = join(this.uploadDir, safe);
    if (!existsSync(path)) throw new NotFoundException('File not found.');
    const ext = safe.includes('.') ? `.${safe.split('.').pop()}` : '';
    const mime =
      Object.entries(MIME_TO_EXT).find(([, e]) => e === ext)?.[0] ?? 'application/octet-stream';
    return { stream: createReadStream(path), contentType: mime };
  }

  // ─── helpers ─────────────────────────────────────────────────────────────
  private async requireUser(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  private async requireEvent(id: string) {
    const [ev] = await this.db.query(`SELECT * FROM game_event WHERE id = $1`, [id]);
    if (!ev) throw new NotFoundException('Event not found.');
    return ev;
  }

  private requireDate(raw: string): Date {
    const d = parseFlexibleDateTime(raw);
    if (!d) throw badRequest([`Invalid date: ${raw}`]);
    return d;
  }

  private async audienceUserIds(audience: string, userIds?: string[]): Promise<string[]> {
    if (audience === 'userIds') return userIds ?? [];
    if (audience === 'inactive_3d') {
      const rows: Array<{ id: string }> = await this.db.query(
        `SELECT id::text FROM sys_user
          WHERE is_blocked = false
            AND (last_seen_at IS NULL OR last_seen_at < now() - interval '3 days')`,
      );
      return rows.map((r) => r.id);
    }
    const rows: Array<{ id: string }> = await this.db.query(
      `SELECT id::text FROM sys_user WHERE is_blocked = false`,
    );
    return rows.map((r) => r.id);
  }

  private async fanoutNotification(
    userIds: string[],
    type: string,
    title: string,
    body: string | null,
    payload: Record<string, unknown>,
  ): Promise<number> {
    if (userIds.length === 0) return 0;
    const chunk = 200;
    for (let i = 0; i < userIds.length; i += chunk) {
      const slice = userIds.slice(i, i + chunk);
      const values = slice
        .map((_, j) => `($${j + 1}::uuid, '${type}', $${slice.length + 1}, $${slice.length + 2}, $${slice.length + 3}::jsonb)`)
        .join(',');
      await this.db.query(
        `INSERT INTO game_notification (user_id, type, title, body, payload) VALUES ${values}`,
        [...slice, title, body, JSON.stringify(payload)],
      );
    }
    await this.push.sendToUsers(userIds, title, body, { type, ...Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v)])) });
    return userIds.length;
  }

  private mapEvent(r: Record<string, unknown>) {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      goalType: r.goal_type,
      goalValue: Number(r.goal_value),
      startsAt: formatIso(new Date(r.starts_at as Date)),
      endsAt: formatIso(new Date(r.ends_at as Date)),
      status: r.status,
      participantCount: Number(r.participants ?? 0),
      createdAt: formatIso(new Date(r.created_at as Date)),
    };
  }

  private mapBadge(r: Record<string, unknown>) {
    return {
      code: r.code,
      title: r.title,
      type: r.type,
      threshold: Number(r.threshold),
      unit: r.unit,
      description: r.description,
      iconFileId: r.icon_file_id,
      isActive: r.is_active,
      unlockCount: Number(r.unlocks ?? 0),
      createdAt: r.created_at ? formatIso(new Date(r.created_at as Date)) : null,
    };
  }

  private mapMarket(r: Record<string, unknown>) {
    return {
      id: r.id,
      code: r.code,
      name: r.title,
      description: r.description,
      price: Number(r.price_tanga),
      currency: r.currency,
      category: r.category,
      isPremium: r.is_premium,
      duration: r.duration,
      discountLabel: r.discount_label,
      imageFileId: r.image_file_id,
      isActive: r.is_active,
      createdAt: formatIso(new Date(r.created_at as Date)),
    };
  }

  private mapNews(r: Record<string, unknown>) {
    return {
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      imageFileId: r.image_file_id,
      isPublished: r.is_published,
      publishedAt: r.published_at ? formatIso(new Date(r.published_at as Date)) : null,
      createdAt: formatIso(new Date(r.created_at as Date)),
    };
  }
}
