# 🎴 东北抛幺 414 - 多人联机版

> 经典东北扑克游戏，在线联机对战！支持 2-6 人实时对战，还原地道东北抛幺规则。

[![GitHub](https://img.shields.io/github/license/yanxiangda/poker-414)](https://github.com/yanxiangda/poker-414)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16-green)](https://nodejs.org/)

---

## 🎮 游戏特色

- **多人联机**：支持 2-6 人同时在线对战
- **房间系统**：创建房间，分享 6 位房间号邀请好友
- **实时对战**：WebSocket 实时通信，出牌即刻同步
- **完整规则**：还原东北抛幺（414）经典玩法
- **跨平台**：浏览器即可游玩，无需安装客户端

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16.x
- npm >= 8.x

### 1. 克隆项目

```bash
git clone git@github.com:yanxiangda/poker-414.git
cd poker-414
```

### 2. 安装服务器依赖

```bash
cd server
npm install
```

### 3. 安装前端依赖

```bash
cd ../frontend
npm install
```

### 4. 启动服务器

```bash
cd ../server
npm start
```

服务器运行在：`http://localhost:3001`

### 5. 启动前端（新开终端）

```bash
cd ../frontend
npm run dev
```

前端运行在：`http://localhost:3000`

### 6. 开始游戏

打开浏览器访问 `http://localhost:3000`，输入昵称后即可创建或加入房间！

---

## 📖 游戏规则

### 基本规则

1. **牌数**：使用两副牌（共 108 张）
2. **人数**：2-6 人
3. **发牌**：每人 17 张牌，剩余牌作为底牌
4. **出牌**：顺时针出牌，下家必须管上或选择过
5. **获胜**：先出完牌且队伍分数达到 135 分

### 牌型大小

| 牌型 | 说明 |
|------|------|
| 单张 | 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3 |
| 对子 | 两张相同点数的牌 |
| 三张 | 三张相同点数的牌 |
| 炸弹 | 四张相同点数的牌（可管任何牌型） |

### 特殊规则

- **抛幺**：第一个出牌的玩家必须出单张或对子
- **管牌**：必须出相同牌型且更大的牌
- **过**：管不上可以选择过，一圈后重新获得出牌权

### 计分规则

| 名次 | 得分 |
|------|------|
| 第 1 名 | +100 分 |
| 第 2 名 | +50 分 |
| 第 3 名 | 0 分 |
| 第 4 名 | -50 分 |
| 第 5 名 | -100 分 |
| 第 6 名 | -150 分 |

**获胜条件**：队伍总分达到 135 分

---

## 🌐 部署上线

### 阿里云部署（推荐）

详见 [DEPLOY.md](./DEPLOY.md)

**快速部署步骤：**

```bash
# 1. 构建前端
cd frontend && npm run build && cd ..

# 2. 打包项目
tar -czf poker414.tar.gz server/ frontend/dist/

# 3. 上传到服务器
scp poker414.tar.gz root@你的服务器 IP:/opt/

# 4. 服务器解压并启动
ssh root@你的服务器 IP
cd /opt && tar -xzf poker414.tar.gz
cd server && npm install --production
pm2 start server.js --name poker414
```

访问：`http://你的服务器 IP:3001`

### 其他部署方式

- **Docker**：待支持
- **Vercel/Netlify**：仅支持前端，需单独部署服务器
- **Heroku**：待支持

---

## 🛠️ 技术栈

### 前端

- **框架**：React 18 + Vite
- **UI**：自定义组件
- **通信**：Socket.IO Client
- **状态管理**：React Hooks

### 后端

- **运行时**：Node.js
- **框架**：Express
- **通信**：Socket.IO
- **游戏逻辑**：自定义牌局引擎

---

## 📁 项目结构

```
poker-414/
├── server/                 # 服务器代码
│   ├── server.js          # 主服务器文件
│   ├── package.json       # 服务器依赖
│   └── game/              # 游戏逻辑
│       ├── deck.js        # 牌堆管理
│       ├── rules.js       # 游戏规则
│       ├── scoring.js     # 计分系统
│       └── ai.js          # AI 逻辑
├── frontend/              # 前端代码
│   ├── src/              # 源代码
│   │   ├── App.jsx       # 主应用组件
│   │   ├── Game.jsx      # 游戏界面
│   │   ├── Card.jsx      # 卡牌组件
│   │   ├── Hand.jsx      # 手牌组件
│   │   └── game/         # 游戏逻辑
│   ├── index.html        # HTML 入口
│   ├── package.json      # 前端依赖
│   └── vite.config.js    # Vite 配置
├── DEPLOY.md             # 部署文档
├── README.md             # 本文件
└── deploy.sh             # 部署脚本
```

---

## ❓ 常见问题

### Q: 无法连接服务器？
A: 检查服务器是否启动，确认端口 3001 未被占用。

### Q: 房间号无法加入？
A: 确认房间号正确（6 位数字），且房间未满（最多 6 人）。

### Q: 出牌无效？
A: 检查是否符合游戏规则：必须管上或选择过，牌型必须匹配。

### Q: 如何分享给朋友？
A: 创建房间后，将 6 位房间号分享给朋友，他们输入房间号即可加入。

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License

---

## 🙏 致谢

感谢所有为东北抛幺文化传承做出贡献的玩家！

---

**🎮 现在就开始游戏吧！**
