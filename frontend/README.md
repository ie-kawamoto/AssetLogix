# 備品管理システム（Asset Logix）

## 📝 概要

社内で使用する備品を一元管理するためのWebアプリケーションです。
備品の登録・貸出・返却・在庫状況を管理し、業務効率の向上を目的としています。

---

## 🚀 デモ

※準備中（デプロイ後にURLを記載）


## 🛠️ 使用技術

### フロントエンド

* React
* TypeScript
* Vite

### バックエンド

* Node.js
* Express

### データベース / ORM

* Prisma
* MySQL

### その他

* JWT認証
* REST API

---

## ✨ 主な機能

### ■ 認証・ユーザー管理

* ログイン / ログアウト
* ユーザー登録（管理者のみ）
* 権限管理（管理者 / 一般ユーザー）

### ■ 備品管理

* 備品登録
* 備品一覧表示
* 備品詳細表示
* 編集 / 削除
* カテゴリ管理

### ■ 貸出管理

* 備品の貸出・返却処理
* 貸出状況の一覧表示
* ステータス管理（利用可 / 貸出中）

---

## 📂 ディレクトリ構成

```
project-root/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── api/
│       └── types/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   └── prisma/
└── README.md
```

---

## ⚙️ セットアップ方法

### ① リポジトリをクローン

```
git clone https://github.com/ユーザー名/リポジトリ名.git
cd リポジトリ名
```

### ② フロントエンド

```
cd frontend
npm install
npm run dev
```

### ③ バックエンド

```
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

## 🔐 環境変数

backend/.env を作成し、以下を設定してください。

```
DATABASE_URL=postgresql://ユーザー:パスワード@localhost:5432/db名
JWT_SECRET=your_secret_key
```

---

## 💡 工夫した点

* Prismaを使用し、型安全なデータベース操作を実現
* JWTによる認証機能でセキュアなログイン管理を実装
* 管理者と一般ユーザーで権限を分け、実運用を想定した設計
* フロントとバックエンドを分離し、保守性の高い構成に

---

## 📌 今後の改善点

* 検索機能の追加
* ページネーション対応
* UI/UXの改善
* テストコードの追加
* Docker対応

---

## 👤 作者

* GitHub: https://github.com/ie-kawamoto

---
