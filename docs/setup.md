# セットアップ

## 前提

- Node.js 20 以上
- pnpm 10 以上
- Docker

## 1. 環境変数を準備する

```bash
cp .env.example .env
```

主な変数:

| 変数 | 用途 |
| --- | --- |
| `DATABASE_URL` | Prisma が使う PostgreSQL 接続先 |
| `APP_WEB_URL` | CORS と画面 URL の基準 |
| `APP_API_URL` | API の公開 URL |
| `API_PORT` | Express API の待受ポート |
| `SESSION_SECRET` | セッション関連の秘密値 |
| `SESSION_COOKIE_NAME` | Cookie 名 |
| `VITE_ENABLE_API` | Web が API モードを使うか |
| `VITE_API_BASE_URL` | Web から見た API の URL |

## 2. 依存関係を入れる

```bash
pnpm install
```

Prisma Client が未生成の場合は次も実行します。

```bash
pnpm db:generate
```

## 3. PostgreSQL を起動する

```bash
docker compose up -d
```

## 4. スキーマと seed を流し込む

```bash
pnpm db:push
pnpm db:seed
```

開発途中で migration を作りたい場合は `pnpm db:migrate` を使ってください。

## 5. 開発サーバーを起動する

```bash
pnpm dev
```

アクセス先:

- Web: `http://127.0.0.1:4173`
- API: `http://127.0.0.1:4010`
- Health check: `http://127.0.0.1:4010/health`

## demo モードだけで画面を試す

API や DB を起動せずに画面だけ確認するなら、`.env` で次のようにします。

```dotenv
VITE_ENABLE_API="false"
```

この場合、`apps/web` は localStorage を使う demo repository を選びます。

## 開発用アカウント

| メールアドレス | パスワード | ロール |
| --- | --- | --- |
| `admin@example.com` | `password123` | `admin` |
| `user1@example.com` | `password123` | `user` |
| `user2@example.com` | `password123` | `user` |

## 品質確認

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

## トラブルシュート

### Prisma の型が見つからない

`pnpm db:generate` を実行してください。

### API モードでサインインできない

- API が起動しているか
- `VITE_API_BASE_URL` が正しいか
- `APP_WEB_URL` と CORS 設定が一致しているか

を確認してください。

### Playwright が通らない

`pnpm e2e` は Chromium を使います。ローカル環境で初回のみブラウザの追加セットアップが必要な場合があります。
