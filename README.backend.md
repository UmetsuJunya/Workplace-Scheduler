# Workplace Scheduler - Backend API

NestJSで構築されたWorkplace SchedulerのバックエンドAPI

## 技術スタック

- **フレームワーク**: NestJS 10.x
- **ORM**: Prisma 7.2.0
- **データベース**: PostgreSQL 16
- **WebSocket**: Socket.IO 4.8.1 (リアルタイム同期)
- **認証**: JWT (JSON Web Tokens)
- **バリデーション**: class-validator, class-transformer
- **言語**: TypeScript

## セットアップ

### 前提条件

- Node.js v24.2.0
- PostgreSQL 16 (ローカル開発時) または Docker

### 依存関係のインストール

```bash
cd backend
npm install
```

### データベースの準備

#### PostgreSQLをローカルで実行する場合

```bash
# PostgreSQLにログイン
psql -U postgres

# データベースを作成
CREATE DATABASE workplace_scheduler;
```

#### Dockerを使用する場合

```bash
# PostgreSQLコンテナを起動
docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=workplace_scheduler \
  -p 5432:5432 \
  postgres:16-alpine
```

### 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
PORT=3001

# Database Configuration (Prisma + PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/workplace_scheduler?schema=public"

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRATION=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Prisma 7.0 設定

このプロジェクトはPrisma 7.2.0を使用しています。Prisma 7.0では以下の変更があります：

- `schema.prisma` から `datasource.url` が削除されました
- `prisma.config.ts` で設定を管理します
- PostgreSQLアダプター (`@prisma/adapter-pg`) を使用します

### Prisma マイグレーション

初回セットアップ時、データベーススキーマを作成する必要があります：

```bash
# マイグレーションを実行してデータベーススキーマを作成
npm run prisma:migrate

# または開発環境で
npx prisma migrate dev

# Prisma Clientを生成
npm run prisma:generate
```

### 開発サーバーの起動

```bash
npm run start:dev
```

サーバーは `http://localhost:3001` で起動します。

**注意**: 事前にPrismaマイグレーションを実行してデータベーススキーマを作成してください。

### プロダクションビルド

```bash
npm run build
npm run start:prod
```

## API エンドポイント

### 認証 (Authentication)

#### ユーザー登録
```
POST /auth/register
Content-Type: application/json

{
  "name": "ユーザー名",
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "jwt-token",
  "user": {
    "id": "uuid",
    "name": "ユーザー名",
    "email": "user@example.com"
  }
}
```

#### ログイン
```
POST /auth/login
Content-Type: application/json

{
  "name": "ユーザー名",
  "password": "password123"
}

Response:
{
  "access_token": "jwt-token",
  "user": {
    "id": "uuid",
    "name": "ユーザー名",
    "email": "user@example.com"
  }
}
```

### ユーザー管理 (Users)

#### ユーザー一覧取得
```
GET /users

Response:
[
  {
    "id": "uuid",
    "name": "ユーザー名",
    "email": "user@example.com",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### ユーザー作成
```
POST /users
Content-Type: application/json

{
  "name": "ユーザー名",
  "email": "user@example.com"
}
```

#### ユーザー取得
```
GET /users/:id
```

#### ユーザー更新
```
PATCH /users/:id
Content-Type: application/json

{
  "name": "新しいユーザー名",
  "isActive": false
}
```

#### ユーザー削除
```
DELETE /users/:id
```

### プロジェクト管理 (Projects)

#### プロジェクト一覧取得
```
GET /projects

Response:
[
  {
    "id": "uuid",
    "name": "プロジェクト名",
    "users": [
      {
        "id": "uuid",
        "name": "ユーザー名"
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### プロジェクト作成
```
POST /projects
Content-Type: application/json

{
  "name": "プロジェクト名",
  "userIds": ["user-uuid-1", "user-uuid-2"]
}
```

#### プロジェクト取得
```
GET /projects/:id
```

#### プロジェクト更新
```
PATCH /projects/:id
Content-Type: application/json

{
  "name": "新しいプロジェクト名",
  "userIds": ["user-uuid-1", "user-uuid-3"]
}
```

#### プロジェクト削除
```
DELETE /projects/:id
```

### スケジュール管理 (Schedules)

#### スケジュール一覧取得
```
GET /schedules
GET /schedules?startDate=2025-01-01&endDate=2025-01-31

Response:
[
  {
    "id": "uuid",
    "userId": "user-uuid",
    "date": "2025-01-15",
    "am": "オフィス",
    "pm": "在宅",
    "note": "午後はミーティング",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### ユーザー別スケジュール取得
```
GET /schedules/user/:userId
```

#### スケジュール作成
```
POST /schedules
Content-Type: application/json

{
  "userId": "user-uuid",
  "date": "2025-01-15",
  "am": "オフィス",
  "pm": "在宅",
  "note": "午後はミーティング"
}
```

#### 一括スケジュール作成
```
POST /schedules/bulk
Content-Type: application/json

[
  {
    "userId": "user-uuid",
    "date": "2025-01-15",
    "am": "オフィス",
    "pm": "在宅"
  },
  {
    "userId": "user-uuid",
    "date": "2025-01-16",
    "am": "在宅",
    "pm": "在宅"
  }
]
```

#### スケジュール更新
```
PATCH /schedules/:id
Content-Type: application/json

{
  "am": "新しい勤務地",
  "note": "更新されたメモ"
}
```

#### スケジュール削除
```
DELETE /schedules/:id

Response: 204 No Content
```

### 勤務地プリセット管理 (Location Presets)

#### 勤務地プリセット一覧取得
```
GET /location-presets

Response:
[
  {
    "id": "uuid",
    "name": "オフィス",
    "order": 0,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### 勤務地プリセット作成
```
POST /location-presets
Content-Type: application/json

{
  "name": "在宅",
  "order": 1
}
```

#### 勤務地プリセット並び替え
```
POST /location-presets/reorder
Content-Type: application/json

{
  "ids": ["preset-uuid-1", "preset-uuid-2", "preset-uuid-3"]
}
```

#### 勤務地プリセット更新
```
PATCH /location-presets/:id
Content-Type: application/json

{
  "name": "新しい勤務地名"
}
```

#### 勤務地プリセット削除
```
DELETE /location-presets/:id

Response: 204 No Content
```

## WebSocket イベント

このアプリケーションは Socket.IO を使用してリアルタイム同期を実装しています。

### 接続

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001')

socket.on('connect', () => {
  console.log('WebSocket connected')
})
```

### イベント一覧

#### スケジュール関連
- `schedule:created` - スケジュール作成時
- `schedule:updated` - スケジュール更新時
- `schedule:deleted` - スケジュール削除時
- `schedule:bulkCreated` - 一括スケジュール作成時

#### ユーザー関連
- `user:created` - ユーザー作成時
- `user:updated` - ユーザー更新時
- `user:deleted` - ユーザー削除時

#### プロジェクト関連
- `project:created` - プロジェクト作成時
- `project:updated` - プロジェクト更新時
- `project:deleted` - プロジェクト削除時

#### 勤務地プリセット関連
- `location:created` - 勤務地プリセット作成時
- `location:updated` - 勤務地プリセット更新時
- `location:deleted` - 勤務地プリセット削除時
- `location:reordered` - 勤務地プリセット並び替え時

### イベントデータ例

```javascript
// schedule:created イベント
socket.on('schedule:created', (data) => {
  console.log('New schedule created:', data)
  // data = { id, userId, date, am, pm, note, createdAt, updatedAt }
})

// user:updated イベント
socket.on('user:updated', (data) => {
  console.log('User updated:', data)
  // data = { id, name, email, isActive, createdAt, updatedAt }
})

// project:deleted イベント
socket.on('project:deleted', (data) => {
  console.log('Project deleted:', data)
  // data = { id }
})
```

## データベース

### Prismaスキーマ

Prismaスキーマファイル: `backend/prisma/schema.prisma`

#### Users テーブル
- id (UUID, Primary Key)
- name (String, Unique)
- email (String, Nullable)
- password (String, Nullable)
- isActive (Boolean, Default: true)
- createdAt (DateTime)
- updatedAt (DateTime)

#### Projects テーブル
- id (UUID, Primary Key)
- name (String)
- createdAt (DateTime)
- updatedAt (DateTime)

#### Schedules テーブル
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- date (Date)
- am (String, Nullable)
- pm (String, Nullable)
- note (Text, Nullable)
- createdAt (DateTime)
- updatedAt (DateTime)
- Unique制約: (userId, date)

#### LocationPresets テーブル
- id (UUID, Primary Key)
- name (String)
- order (Number)
- createdAt (DateTime)
- updatedAt (DateTime)

#### ProjectUsers テーブル (中間テーブル)
- projectId (UUID, Foreign Key)
- userId (UUID, Foreign Key)
- 複合Primary Key: (projectId, userId)

### Prisma便利コマンド

```bash
# Prisma Studio (GUIデータベースエディター)
npm run prisma:studio

# マイグレーション作成
npx prisma migrate dev --name migration_name

# スキーマフォーマット
npx prisma format

# データベースのリセット
npx prisma migrate reset
```

## エラーハンドリング

APIは以下のHTTPステータスコードを返します：

- `200 OK` - リクエスト成功
- `201 Created` - リソース作成成功
- `204 No Content` - リソース削除成功（DELETE操作）
- `400 Bad Request` - バリデーションエラー
- `401 Unauthorized` - 認証エラー
- `404 Not Found` - リソースが見つからない
- `409 Conflict` - リソースの競合（例：同名ユーザーの重複）
- `500 Internal Server Error` - サーバーエラー

エラーレスポンスの例：
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Docker での起動

### フルスタック起動（推奨）

プロジェクトルートから：

```bash
docker-compose up -d
```

これにより、以下のサービスが起動します：
- **PostgreSQL** (port 5432) - データベース
- **Backend** (port 3001) - NestJS API
- **Frontend** (port 3000) - Next.js アプリケーション

データは `postgres-data` Dockerボリュームに永続化されます。

### バックエンドとPostgreSQLのみ起動

```bash
# PostgreSQLコンテナを起動
docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=workplace_scheduler \
  -p 5432:5432 \
  postgres:16-alpine

# バックエンドをビルド＆起動
cd backend
docker build -t workplace-scheduler-backend .
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/workplace_scheduler?schema=public" \
  workplace-scheduler-backend
```

## 開発ガイド

### 新しいモジュールの追加

```bash
nest g module module-name
nest g controller module-name
nest g service module-name
```

### マイグレーション

Prismaを使用しているため、スキーマ変更時はマイグレーションを作成・実行します：

```bash
# スキーマ変更後、マイグレーションを作成
npx prisma migrate dev --name describe_your_changes

# 本番環境へのデプロイ時
npx prisma migrate deploy
```

**注意**:
- 開発環境: `prisma migrate dev` を使用（マイグレーション作成 + 適用 + Client生成）
- 本番環境: `prisma migrate deploy` を使用（マイグレーション適用のみ）

## セキュリティ

- パスワードは bcrypt でハッシュ化されて保存されます
- JWT トークンは HTTP ヘッダーで送信されます
- CORS は設定された FRONTEND_URL からのリクエストのみ許可します
- WebSocket接続もCORS設定が適用されます
- 入力値は class-validator でバリデーションされます

## アーキテクチャ

### モジュール構成

```
src/
├── main.ts                      # アプリケーションエントリーポイント
├── app.module.ts                # ルートモジュール
├── auth/                        # 認証モジュール
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── jwt.strategy.ts
├── users/                       # ユーザー管理
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
├── projects/                    # プロジェクト管理
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   └── dto/
├── schedules/                   # スケジュール管理
│   ├── schedules.controller.ts
│   ├── schedules.service.ts
│   └── dto/
├── location-presets/            # 勤務地プリセット
│   ├── location-presets.controller.ts
│   ├── location-presets.service.ts
│   └── dto/
├── events/                      # WebSocketゲートウェイ
│   ├── events.gateway.ts        # Socket.IO統合
│   └── events.module.ts
└── prisma/                      # Prisma ORM
    ├── prisma.service.ts
    └── prisma.module.ts
```

### WebSocket統合フロー

1. **API操作** (例: POST /schedules)
2. **サービス層でデータベース更新** (SchedulesService)
3. **WebSocketイベント発行** (EventsGateway.emitScheduleCreated())
4. **接続中のすべてのクライアントに通知**
5. **フロントエンドがイベントを受信し、UIを更新**

### データフロー

```
クライアント1 → API リクエスト → Controller → Service
                                              ↓
                                         Prisma (DB更新)
                                              ↓
                                      EventsGateway (WebSocket通知)
                                              ↓
                        ┌─────────────────────┴─────────────────────┐
                        ↓                                           ↓
                  クライアント1                                クライアント2
                  (UI自動更新)                                (UI自動更新)
```

## ライセンス

MIT
