# 画面一覧

この見本では、画面要件を最小限に絞りつつ、認証・CRUD・管理ビューまで一通り追えるようにしています。

## 画面一覧

| パス | 目的 | 主な表示内容 | アクセス条件 |
| --- | --- | --- | --- |
| `/signin` | サインイン | メール、パスワード、開発用アカウント一覧 | 未認証のみ |
| `/dashboard` | ダッシュボード | 自分の担当件数、ステータス別件数、締切が近いタスク、最近更新されたタスク | 認証必須 |
| `/tasks` | タスク一覧 | タスクカード、ステータス、優先度、担当者、締切 | 認証必須 |
| `/tasks/new` | タスク作成 | タスク入力フォーム | 認証必須 |
| `/tasks/:taskId` | タスク詳細 | 詳細情報、コメント一覧、コメント投稿フォーム | 認証必須 |
| `/tasks/:taskId/edit` | タスク編集 | 既存値を埋めたフォーム | 認証必須 |
| `/settings` | 管理ビュー | 接続モード、契約ファイル一覧、ユーザー一覧 | 認証必須かつ `admin` |

## 画面遷移

```text
/signin
  └─ sign in 成功
      └─ /dashboard
           ├─ /tasks
           │   ├─ /tasks/new
           │   └─ /tasks/:taskId
           │       └─ /tasks/:taskId/edit
           └─ /settings (admin のみ)
```

## 補足

### `/signin`

- `POST /api/auth/signin` を使ってサインインします。
- 教材として追いやすくするため、開発用アカウントを画面に表示しています。

### `/dashboard`

- `GET /api/dashboard/summary` を使います。
- 「自分の担当タスク数」と「直近で見るべきタスク」を最初に把握する画面です。

### `/tasks`

- `GET /api/tasks` を使います。
- タスク詳細へ移動する起点であり、一覧から状態を把握する役割を持ちます。

### `/tasks/new` と `/tasks/:taskId/edit`

- 作成は `POST /api/tasks`、更新は `PATCH /api/tasks/:taskId` を使います。
- 同じフォームを共有し、create/edit で責務を分けすぎないようにしています。

### `/tasks/:taskId`

- `GET /api/tasks/:taskId` と `POST /api/tasks/:taskId/comments` を使います。
- コメント機能をここに閉じ込め、一覧画面へ責務を広げすぎないようにしています。

### `/settings`

- 管理者だけが閲覧できます。
- この見本では、**admin 用 API をまだ持たず**、教材として契約ファイルと接続モードを確認する管理ビューに留めています。
- 一般ユーザーがこのパスへ来た場合は `/dashboard` に戻します。
