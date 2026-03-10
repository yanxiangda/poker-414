# 东北抛幺 414 - 多人联机版

## 启动服务器

```bash
cd server
npm install
npm start
```

服务器运行在：http://localhost:3001

## 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在：http://localhost:3000

## 游戏玩法

1. 输入昵称
2. 创建房间或加入房间（输入 6 位房间号）
3. 等待玩家加入（最多 6 人）
4. 所有人都准备后开始游戏
5. 顺时针出牌，管不上就过
6. 先出完牌的队伍需要达到 135 分获胜

## 房间分享

创建房间后，把 6 位房间号分享给朋友，他们就可以加入了！
