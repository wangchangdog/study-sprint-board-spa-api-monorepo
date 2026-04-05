# デプロイ

## この見本の前提

この見本は、**SPA と API を別々に配備する構成** を説明するためのものです。ローカルではモノレポとして一緒に管理しますが、配備単位は分けられるようにしています。

## 想定する配備先

| 対象 | 例 |
| --- | --- |
| Web | Vercel, Netlify |
| API | Render, Fly.io, Railway |
| DB | Neon, Supabase Postgres, Railway Postgres |

## 分離配備にしている理由

1. フロントエンドとバックエンドの責務境界を明確に見せやすい
2. API を別チームや別リポジトリへ切り出す発想につなげやすい
3. 無料枠でも役割ごとにサービス選定しやすい

## 環境変数の考え方

### Web 側

- `VITE_ENABLE_API`
- `VITE_API_BASE_URL`

### API 側

- `DATABASE_URL`
- `APP_WEB_URL`
- `APP_API_URL`
- `API_PORT`
- `SESSION_SECRET`
- `SESSION_COOKIE_NAME`

## 分離配備時の注意

### 1. CORS

`APP_WEB_URL` と実際の Web 公開 URL がずれると Cookie 付き通信が失敗します。

### 2. Cookie の secure 設定

本番では API URL が HTTPS になる前提なので、Cookie は secure=true で扱われます。

### 3. Health check

API には `/health` があり、起動確認に使えます。

### 4. 契約の更新手順

API を変更したら、少なくとも次を同時に見直します。

1. `docs/api/openapi.yaml`
2. `apps/api/src/app.ts`
3. `apps/api/src/services/board-service.ts`
4. `apps/web/src/lib/api-repository.ts`

## 今後の発展

- OpenAPI client 自動生成を導入し、Web 側の手書き API 呼び出しを減らす
- preview deploy ごとに契約差分と E2E を回す
- 本番想定のログ収集と監視を追加する
