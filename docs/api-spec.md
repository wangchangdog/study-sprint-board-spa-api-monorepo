# API 仕様の読み方

このドキュメントは **人間向けの補足** です。機械可読な正本は `docs/api/openapi.yaml` を参照してください。

## この見本の API の位置づけ

この API は、`apps/web` から呼ばれることを前提にした **セッション Cookie ベースの内部 API** です。公開 Web API ではなく、SPA のバックエンドとして最小限の責務に絞っています。

## 主要エンドポイント

| メソッド | パス | 目的 |
| --- | --- | --- |
| `POST` | `/api/auth/signin` | サインインしてセッション Cookie を発行する |
| `POST` | `/api/auth/signout` | サインアウトして Cookie を無効化する |
| `GET` | `/api/board` | 初期表示に必要なスナップショットを一括取得する |
| `GET` | `/api/tasks` | タスク一覧を取得する |
| `POST` | `/api/tasks` | タスクを作成する |
| `GET` | `/api/tasks/{taskId}` | タスク詳細を取得する |
| `PATCH` | `/api/tasks/{taskId}` | タスクを更新する |
| `POST` | `/api/tasks/{taskId}/comments` | コメントを投稿する |
| `GET` | `/api/dashboard/summary` | ダッシュボード集計を取得する |

## `/api/board` を置いている理由

教材としては「SPA 起動直後に何をまとめて読みたいか」を見せたいので、`/api/board` を置いています。

- 現在のユーザー
- ユーザー一覧
- ラベル一覧
- 生のタスク配列
- 生のコメント配列

一覧画面や詳細画面は、その後に個別エンドポイントで必要な形へアクセスします。初期化用の snapshot と CRUD 用 API を分けることで、**一括取得と個別操作の役割差** を読みやすくしています。

## 認証とエラー

- 認証は `POST /api/auth/signin` 成功時に発行される HTTP-only Cookie を使います。
- 未認証で保護 API を呼ぶと `401` を返します。
- Zod バリデーションに失敗すると `400` と `details` を返します。
- 存在しないタスクを読む、更新する、コメントする場合は `404` を返します。

## 画面と API の対応

| 画面 | 主に使う API |
| --- | --- |
| `/signin` | `POST /api/auth/signin`, `POST /api/auth/signout` |
| `/dashboard` | `GET /api/dashboard/summary` |
| `/tasks` | `GET /api/tasks` |
| `/tasks/new` | `POST /api/tasks` |
| `/tasks/:taskId` | `GET /api/tasks/{taskId}`, `POST /api/tasks/{taskId}/comments` |
| `/tasks/:taskId/edit` | `GET /api/tasks/{taskId}`, `PATCH /api/tasks/{taskId}` |

## 今後の発展

- OpenAPI から API client を自動生成する
- TypeSpec を記述元にし、OpenAPI を成果物として出力する
- ページネーションや検索条件を `GET /api/tasks` に追加する
- admin 向け API を追加し、UI ガードだけでなくサーバー側認可も強化する
