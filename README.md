# Workplace Scheduler

職場のメンバーのスケジュール（勤務地）を管理するWebアプリケーション

## 概要

Workplace Schedulerは、チームメンバーの勤務地（オフィス、在宅など）を月単位で管理・共有できるアプリケーションです。

### 主な機能

- **ユーザー管理**: チームメンバーの追加・編集・削除
- **スケジュール管理**: 日付ごとにAM/PMの勤務地を設定
- **プロジェクト管理**: プロジェクトとメンバーの紐付け
- **勤務地プリセット**: よく使う勤務地を登録・管理
- **絞り込み機能**: ユーザーやプロジェクトでフィルタリング
- **一括編集**: 複数日をまとめて編集
- **ドラッグ&ドロップ**: スケジュールの移動や勤務地の並び替え
- **データエクスポート/インポート**: JSON形式でデータの保存・読み込み
- **リアルタイム同期**: WebSocket (Socket.IO) による複数ブラウザ間のリアルタイムデータ同期

## 技術スタック

### フロントエンド
- **Next.js 16.1.0** - React フレームワーク
- **React 19.2.0** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Jotai 2.16.1** - 状態管理
- **Tailwind CSS 4.1.9** - スタイリング
- **Socket.IO Client 4.8.1** - WebSocketクライアント (リアルタイム同期)

### バックエンド
- **NestJS 10.x** - Node.js フレームワーク
- **Prisma 7.2.0** - ORM (PostgreSQLアダプター使用)
- **PostgreSQL 16** - データベース
- **Socket.IO 4.8.1** - WebSocketサーバー (リアルタイム同期)
- **JWT** - 認証
- **bcrypt** - パスワードハッシュ化

## セットアップ

### 必要な環境

- Node.js v24.2.0
- npm または Docker

### 環境変数の設定

#### Docker環境（推奨）

**ルートディレクトリの `.env`** を編集してください：

```bash
# 認証機能を有効化
AUTH_ENABLED=true
NEXT_PUBLIC_AUTH_ENABLED=true

# 認証機能を無効化（デフォルト）
AUTH_ENABLED=false
NEXT_PUBLIC_AUTH_ENABLED=false
```

#### ローカル開発環境

**バックエンド**: `backend/.env.local` を作成（`backend/.env.local.example`をコピー）
```bash
cp backend/.env.local.example backend/.env.local
# DATABASE_URL は localhost:5432 を使用
```

**フロントエンド**: `frontend/.env.local` を作成（`frontend/.env.local.example`をコピー）
```bash
cp frontend/.env.local.example frontend/.env.local
```

#### 環境変数ファイルの使用状況

| ファイル | Docker環境 | ローカル開発 | 用途 |
|---------|-----------|-------------|------|
| **ルート `.env`** | ✅ 使用 | - | Docker Composeで使用 |
| **backend/.env.local** | - | ✅ 使用 | バックエンドローカル開発 |
| **frontend/.env.local** | - | ✅ 使用 | フロントエンドローカル開発 |

### ローカル開発環境のセットアップ

#### Docker を使用した起動（推奨）

```bash
# プロジェクトルートで実行
docker-compose up -d

# ログ確認
docker-compose logs -f

# 停止
docker-compose down
```

これにより、以下のサービスが起動します：
- **PostgreSQL** (port 5432) - データベース
- **Backend** (port 3001) - NestJS API + WebSocket
- **Frontend** (port 3000) - Next.js アプリケーション

http://localhost:3000 でアクセスできます。

詳細は [README.docker.md](README.docker.md) を参照してください。

#### ローカル開発環境のセットアップ（非Docker）

**1. PostgreSQL の準備**

```bash
# PostgreSQL 16 をインストールするか、Dockerで起動
docker run -d --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=workplace_scheduler \
  -p 5432:5432 \
  postgres:16-alpine
```

**2. バックエンドの起動**

```bash
cd backend
npm install

# Prisma マイグレーション
npm run prisma:migrate

# 開発サーバー起動
npm run start:dev
```

バックエンドは http://localhost:3001 で起動します。

**3. フロントエンドの起動**

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは http://localhost:3000 で起動します。

### Dockerを使用したセットアップ

詳細は [README.docker.md](README.docker.md) を参照してください。

```bash
# フルスタックを起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# 停止
docker-compose down
```

## プロジェクト構造

```
workplace-scheduler/
├── frontend/              # Next.js フロントエンド
│   ├── app/              # Next.js App Router
│   ├── components/       # Reactコンポーネント
│   ├── lib/              # ユーティリティとストア
│   │   ├── api-client.ts       # APIクライアント
│   │   ├── websocket.ts        # WebSocketクライアント
│   │   ├── atoms.ts            # Jotai状態管理
│   │   └── storage-adapter.ts  # データ永続化
│   ├── public/           # 静的ファイル
│   ├── package.json
│   ├── Dockerfile
│   └── README.md         # フロントエンド詳細
├── backend/              # NestJS バックエンド
│   ├── src/
│   │   ├── auth/        # 認証モジュール
│   │   ├── users/       # ユーザー管理
│   │   ├── projects/    # プロジェクト管理
│   │   ├── schedules/   # スケジュール管理
│   │   ├── location-presets/  # 勤務地プリセット
│   │   ├── events/      # WebSocketゲートウェイ
│   │   └── prisma/      # Prismaスキーマ
│   ├── prisma/          # Prismaマイグレーション
│   ├── package.json
│   ├── Dockerfile
│   └── README.md         # バックエンド詳細
├── docker-compose.yml    # Docker Compose設定
├── README.md            # このファイル
├── README.backend.md    # バックエンドAPI詳細
├── README.docker.md     # Docker起動ガイド
└── Development.md       # 開発ドキュメント
```

## 使い方

### 基本的な操作

1. **ユーザーの追加**: 「ユーザー管理」ボタンからメンバーを追加
2. **勤務地の設定**: 「勤務地管理」ボタンからよく使う勤務地を登録
3. **スケジュール入力**: カレンダーのセルをクリックして勤務地を選択
4. **絞り込み**: ユーザーやプロジェクトで表示をフィルタリング
5. **一括編集**: 「一括編集」ボタンで複数日をまとめて編集

### ドラッグ&ドロップ機能

- **スケジュールの移動**: 入力済みのセルをドラッグして別の日付に移動
- **勤務地の並び替え**: 勤務地管理画面で項目をドラッグして順序変更

## API ドキュメント

バックエンドAPIの詳細は [README.backend.md](README.backend.md) を参照してください。

## データの保存

### PostgreSQL データベース
- すべてのデータは PostgreSQL 16 データベースに保存されます
- 複数デバイスでデータ共有可能
- リアルタイム同期機能により、複数ブラウザ間で即座にデータが反映されます
- WebSocket (Socket.IO) による双方向通信
- 認証機能あり（現在フロントエンドでは未使用）

### データの永続化
- Docker ボリューム `postgres-data` に保存
- `docker-compose down -v` を実行しない限りデータは保持されます

## 開発

### ビルド

```bash
# フロントエンド
npm run build
npm run start

# バックエンド
cd backend
npm run build
npm run start:prod
```

### リント

```bash
npm run lint
```

## デプロイ

### Dockerを使用したデプロイ

1. `docker-compose.yml` の環境変数を本番用に設定
2. `JWT_SECRET` を必ず変更
3. `docker-compose up -d` で起動

### Vercel (フロントエンドのみ)

Next.jsアプリとして通常通りデプロイ可能です。

## ライセンス

MIT