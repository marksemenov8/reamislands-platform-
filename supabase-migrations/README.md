# DIT — Tier 1 миграции и сидинг админов

Код Tier 1 уже задеплоен на VPS (`pm2 dit` рестартован), но без шагов ниже логин не работает: таблицы `profiles` и RLS-политик ещё нет в БД.

## 1. Применить миграции в Supabase SQL Editor

Открыть: <https://supabase.com/dashboard/project/xbzrtofanbrahasxbisf/sql/new>

Выполнить **в строгом порядке**, каждую отдельным Run:

1. `01_profiles_and_roles.sql` — создаёт enum `user_role`, таблицу `profiles`, триггер на `auth.users` (новый юзер → строка в `profiles` с ролью; email `olegoonline@gmail.com` и `9679108@gmail.com` автоматически получают `admin`).
2. `02_rls_policies.sql` — RLS на 8 таблицах + helper-функции `current_user_role()`, `current_user_property()`.
3. `03_partner_views.sql` — две SQL-вьюхи `partner_program_outcomes` и `partner_specialist_contribution` для Partner View в Tier 2.

После каждой проверять, что в нижней панели "Success. No rows returned".

## 2. Создать админ-юзеров в Supabase Auth

Открыть: <https://supabase.com/dashboard/project/xbzrtofanbrahasxbisf/auth/users>

Нажать **Add user → Create new user**. Создать **двух**:

| Email | Password | Auto Confirm User |
|---|---|---|
| `olegoonline@gmail.com` | (придумай временный) | ✅ Yes |
| `9679108@gmail.com` | (придумай временный) | ✅ Yes |

Важно: **Auto Confirm User = ON** (иначе попросит email-подтверждение, а SMTP не настроен).

Триггер из шага 1 автоматически создаст для них строки в `profiles` с `role='admin'`.

Пароли передать пользователям out-of-band (Telegram / лично). Они смогут поменять их через Auth → Account → password update (UI пока не сделан — обновление пароля можно через REST или повтор-добавление в Dashboard).

## 3. Проверить, что админы получили роль

В SQL Editor выполнить:

```sql
select u.email, p.role
from auth.users u
left join public.profiles p on p.id = u.id
where u.email in ('olegoonline@gmail.com','9679108@gmail.com');
```

Должно вернуть 2 строки, обе с `role = admin`. Если `role = user` или строки нет — триггер не отработал. В этом случае: либо повтори шаг 1 миграцию (она backfill-ит существующих юзеров через `on conflict ... update`), либо вручную:

```sql
update public.profiles set role = 'admin'
where id in (select id from auth.users where email in ('olegoonline@gmail.com','9679108@gmail.com'));
```

## 4. Войти

`https://panel.dreamislands.org/` → редирект на `/login` → ввести `olegoonline@gmail.com` + пароль → попадаешь на `/admin`.

## 5. Что доступно после Tier 1

- 5 admin-страниц на `/admin/*` (Overview, Properties, Programs, Guests, Bookings) с CRUD на bookings
- `POST /api/intake` — публичный, без auth, для Cura/Gigi (труба жива)
- `GET /api/properties` и `GET /api/programs` — требуют сессии, фильтры `?cohort=`, `?tier=`, `?parent_id=`, `?is_composite=`, `?active=`
- Sign-out кнопка в шапке

## Создание partner-юзера вручную (до Tier 2.5)

Полноценный UI для онбординга партнёров появится в Tier 2.5. Пока — два шага:

1. Создать auth-юзера через Admin API (генерит пароль локально, показывает один раз):

```bash
cd /path/to/dit-platform
set -a && . ./.env.local && set +a

PARTNER_EMAIL='partner@example.com'
PW=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)

curl -sS -X POST "${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${PARTNER_EMAIL}\",\"password\":\"${PW}\",\"email_confirm\":true}"

echo "Password (save now): ${PW}"
```

Триггер `handle_new_user` создаст строку в `profiles` с `role='user'`.

2. Повысить юзера до partner и привязать к property (через Supabase SQL Editor):

```sql
update public.profiles
set role = 'partner',
    partner_property_id = '<property_uuid>'
where id = (select id from auth.users where email = 'partner@example.com');
```

`<property_uuid>` берётся из `select id, slug, name from properties`.

После этого партнёр логинится на `panel.dreamislands.org` → редиректится на `/partner`. RLS ограничит видимость данных одной property.

## Что НЕ делаем (Tier 2 и далее)

- Partner View UI (вьюхи готовы — Tier 2.2)
- Public booking flow на `/` (Tier 2.1, 2.3)
- WBS-форма (Tier 2.1)
- Cura webhook hardening (Tier 2.4)
- Partner onboarding UI на `/admin/users` (Tier 2.5)

После того, как ты залогинишься и убедишься что Tier 1 работает — продолжаем Tier 2.

## Миграции 09–13 (programs content model)

Расширение программы до полноценной публикуемой сущности (описания, расписание, цены, услуги, аккомодации). Подробности — в плане `~/.claude/plans/groovy-fluttering-seahorse.md`.

| # | Файл | Что делает |
|---|---|---|
| 09 | `09_programs_content_and_variants.sql` | enum `program_status`, новые колонки programs (slug, status, summary, goal, ...), таблица `program_variants`. |
| 10 | `10_program_schedule.sql` | таблица `program_schedule_items` (day × time × activity). |
| 11 | `11_services.sql` | каталог `services` + junction `program_services`. |
| 12 | `12_accommodations.sql` | `accommodation_rates` per property. |
| 13 | `13_rls_for_new_tables.sql` | RLS политики для всех новых таблиц (admin write, authenticated read only published/active). |

Применять последовательно через `mcp__supabase__apply_migration`. Имя `dit_NN_<snake>`, см. `[[feedback-migration-workflow]]`.
