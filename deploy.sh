#!/bin/bash

# 部署脚本 - 在阿里云服务器上运行

echo "🚀 开始部署东北抛幺 414..."

# 1. 安装 Node.js
echo "📦 安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 创建应用目录
echo "📁 创建应用目录..."
sudo mkdir -p /opt/poker414
sudo chown $USER:$USER /opt/poker414

# 3. 安装 PM2（进程管理）
echo "🔧 安装 PM2..."
sudo npm install -g pm2

# 4. 复制项目文件（手动上传后执行）
echo "📋 请上传以下文件到 /opt/poker414:"
echo "   - server/"
echo "   - frontend/dist/"
echo "   - package.json"

# 5. 安装依赖
cd /opt/poker414
echo "📦 安装依赖..."
npm install --production

# 6. 配置防火墙
echo "🔥 配置防火墙..."
sudo ufw allow 3001/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 7. 启动服务
echo "▶️ 启动服务..."
pm2 start server/server.js --name poker414
pm2 save
pm2 startup

# 8. 配置 Nginx（可选，用于域名访问）
echo "🌐 配置 Nginx..."
sudo apt-get install -y nginx
sudo cat > /tmp/poker414_nginx << 'EOF'
server {
    listen 80;
    server_name _;
    
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

sudo cp /tmp/poker414_nginx /etc/nginx/sites-available/poker414
sudo ln -sf /etc/nginx/sites-available/poker414 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "✅ 部署完成！"
echo "访问地址：http://你的服务器IP"
