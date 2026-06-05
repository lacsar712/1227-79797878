# 优选商城 - E-commerce Platform

基于 Vue.js + Element Plus 的完整电商网站，包含商品展示、购物车、用户认证、订单管理等核心功能。

## 🛠 技术栈

- **Frontend**: Vue 3 + Element Plus + Vuex + Vue Router + Axios + Vite
- **Backend**: Node.js + Express + Sequelize
- **Database**: MySQL 8.0 (utf8mb4)

## 🚀 启动指南 (How to Run)

### 方式一：一键启动（推荐）

1. 确保 Docker Desktop 已启动
2. 在项目根目录执行：

```bash
docker compose up --build
```

3. 等待容器启动完成（首次构建约 2-5 分钟）
4. 访问前端页面

### 方式二：自定义配置启动

1. 复制环境变量模板文件：

```bash
cp .env.example .env
```

2. 根据需要修改 `.env` 文件中的配置
3. 启动服务：

```bash
docker compose up --build
```

## 🔗 服务地址 (Services)

| 服务 | 地址 |
|------|------|
| **Frontend** | http://localhost:3227 |
| **Backend API** | http://localhost:8227 |
| **Database** | localhost:3307 (user: ecommerce / pass: ecommerce123) |

## ⚙️ 环境变量配置 (Environment Variables)

项目所有配置均通过环境变量管理，可在 `.env` 文件中进行自定义。

### MySQL 数据库配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `MYSQL_ROOT_PASSWORD` | `root` | MySQL root 用户密码 |
| `MYSQL_DATABASE` | `ecommerce` | 数据库名称 |
| `MYSQL_USER` | `ecommerce` | 数据库用户名 |
| `MYSQL_PASSWORD` | `ecommerce123` | 数据库用户密码 |
| `MYSQL_HOST_PORT` | `3307` | 主机映射端口（避免与本地 MySQL 冲突） |

### 后端数据库连接配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DB_HOST` | `db` | 数据库主机地址（Docker 内部服务名） |
| `DB_PORT` | `3306` | 数据库端口 |
| `DB_NAME` | `ecommerce` | 数据库名称（需与 MYSQL_DATABASE 一致） |
| `DB_USER` | `ecommerce` | 数据库用户名（需与 MYSQL_USER 一致） |
| `DB_PASSWORD` | `ecommerce123` | 数据库密码（需与 MYSQL_PASSWORD 一致） |

### JWT 配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `JWT_SECRET` | `ecommerce-jwt-secret-2024` | JWT 签名密钥，生产环境请务必修改为复杂随机字符串 |

### 服务端口配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `BACKEND_PORT` | `8227` | 后端服务内部端口 |
| `BACKEND_HOST_PORT` | `8227` | 后端服务主机映射端口 |
| `FRONTEND_HOST_PORT` | `3227` | 前端服务主机映射端口 |

### Node 运行环境

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | Node 运行环境（development/production） |
| `LOG_LEVEL` | `info` | 日志级别（debug/info/warn/error） |

## 🧪 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 普通用户 | user | 123456 |

## 📦 功能模块

- **商品展示与搜索**：首页推荐、分类浏览、关键词搜索
- **商品详情**：图片、描述、价格、库存、加入购物车
- **购物车管理**：添加、修改数量、删除、清空
- **用户认证**：注册、登录、密码找回、重置密码
- **订单管理**：创建订单、支付、取消、订单列表与详情
- **个人中心**：个人信息、收货地址管理

## 🎨 设计说明

- 现代渐变风格 UI，浅色系主色调
- 响应式布局，支持 PC 与移动端
- Element Plus 组件库，非原生 HTML 弹窗
- 骨架屏/加载状态、Hover 动效
