# 認証

## 採用方針

この見本では、学習コストを抑えるために **メール + パスワード + HTTP-only セッション Cookie** を採用しています。OAuth や外部 IdP は roadmap に回しています。

## 認証フロー

1. Web が `POST /api/auth/signin` にメールアドレスとパスワードを送る
2. API が資格情報を確認する
3. API が `Session` テーブルにセッションを保存する
4. API が HTTP-only Cookie を返す
5. 以後の保護 API は Cookie を使って現在ユーザーを判定する

## セッションの持ち方

- Cookie にはセッショントークンだけを保存します
- ユーザー情報そのものは Cookie に入れません
- サーバー側では `Session` テーブルを正本にします

Cookie の基本設定:

- `httpOnly: true`
- `sameSite: "lax"`
- `path: "/"`
- `secure`: HTTPS 配備時のみ true

## 未認証アクセス制御

- Web 側では保護ルートで未認証ユーザーを `/signin` へ戻します
- API 側では保護エンドポイントで `401` を返します

両方を置く理由は次の通りです。

- Web 側: 画面遷移を自然にするため
- API 側: UI を経由しない呼び出しでも境界を守るため

## admin ロールの扱い

- `admin` と `user` の 2 ロールがあります
- 現在の MVP では、`/settings` の表示制御に主に使っています
- admin 専用 API はまだ最小構成なので、将来追加するときに **UI ガードだけでなく API 側の認可** も強化します

## CORS と URL 設定

- API は `APP_WEB_URL` を許可オリジンとして使います
- Web は `VITE_API_BASE_URL` を使って API を呼びます
- 分離配備時は、この 2 つの URL を必ず対にして見直します
