# 🚀 阿里云部署指南

## 📍 当前部署地址

**线上地址：** http://8.136.197.229:3001

---

## 快速部署（5 分钟）

### 1. 购买服务器
- 阿里云 ECS：https://www.aliyun.com/product/ecs
- 推荐配置：1 核 2GB，Ubuntu 22.04
- 价格：约 ¥60-100/月

### 2. 本地构建项目
```bash
cd /Users/zhangyuan/.openclaw/workspace/poker-414-multiplayer

# 构建前端
cd frontend && npm run build && cd ..

# 打包
tar -czf poker414.tar.gz server/ frontend/dist/ frontend/package.json frontend/package-lock.json
```

### 3. 上传到服务器
```bash
# 替换为你的服务器 IP
scp poker414.tar.gz root@你的服务器 IP:/opt/
```

### 4. 服务器部署
SSH 登录服务器后执行：

```bash
# 解压
cd /opt
tar -xzf poker414.tar.gz
mv frontend server/
mv server frontend server/
mkdir poker414
mv server/* poker414/
cd poker414

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装依赖
npm install --production

# 安装 PM2
sudo npm install -g pm2

# 启动服务
pm2 start server.js --name poker414
pm2 save
pm2 startup

# 配置防火墙
sudo ufw allow 3001/tcp
sudo ufw allow 80/tcp
```

### 5. 访问游戏
```
http://你的服务器 IP:3001
```

---

## 配置域名（可选）

### 1. 购买域名
- 阿里云万网：https://wanwang.aliyun.com/domain/
- 价格：¥55-80/年

### 2. 域名备案
- 登录阿里云备案系统
- 提交资料（需 10-20 天）

### 3. 配置 Nginx
```bash
sudo apt-get install -y nginx

sudo cat > /etc/nginx/sites-available/poker414 << 'EOF'
server {
    listen 80;
    server_name 你的域名.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/poker414 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 配置 HTTPS（免费证书）
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com
```

---

## 常用命令

### 查看服务状态
```bash
pm2 status
pm2 logs poker414
```

### 重启服务
```bash
pm2 restart poker414
```

### 停止服务
```bash
pm2 stop poker414
```

### 开机自启
```bash
pm2 startup
pm2 save
```

### 查看日志
```bash
tail -f ~/.pm2/logs/poker414-out.log
tail -f ~/.pm2/logs/poker414-error.log
```

---

## 费用预估

| 项目 | 配置 | 价格 |
|------|------|------|
| ECS 服务器 | 1 核 2GB | ¥60-100/月 |
| 域名（可选） | .com | ¥55-80/年 |
| 带宽 | 1-5Mbps | 包含在 ECS 中 |
| **总计** | | **约 ¥70-110/月** |

---

## 故障排查

### 端口无法访问
```bash
# 检查防火墙
sudo ufw status
sudo ufw allow 3001/tcp

# 检查阿里云安全组
# 登录阿里云控制台 → ECS → 安全组 → 添加入站规则
# 端口：3001，协议：TCP，授权对象：0.0.0.0/0
```

### 服务崩溃
```bash
pm2 restart poker414
pm2 logs poker414 --lines 50
```

### 内存不足
```bash
# 添加 swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 自动化部署脚本

创建 `deploy.sh`：
```bash
#!/bin/bash
# 在服务器执行此脚本

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装依赖
npm install --production

# 启动服务
pm2 start server.js --name poker414
pm2 save
pm2 startup

# 配置防火墙
sudo ufw allow 3001/tcp
sudo ufw allow 80/tcp

echo "✅ 部署完成！访问 http://$(curl -s ifconfig.me):3001"
```

执行：
```bash
chmod +x deploy.sh
./deploy.sh
```
