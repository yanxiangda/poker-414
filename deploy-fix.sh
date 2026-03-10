#!/bin/bash

echo "📦 重新打包东北抛幺 414（修复版）..."

cd /Users/zhangyuan/.openclaw/workspace/poker-414-multiplayer

# 1. 构建前端
echo "🔨 构建前端..."
cd frontend && npm run build && cd ..

# 2. 创建部署目录
echo "📁 创建部署包..."
rm -rf /tmp/poker414-fix
mkdir -p /tmp/poker414-fix

# 3. 复制 server 目录
cp -r server /tmp/poker414-fix/

# 4. 复制 frontend/dist 到 server/frontend/dist
mkdir -p /tmp/poker414-fix/server/frontend/dist
cp -r frontend/dist/* /tmp/poker414-fix/server/frontend/dist/

# 5. 复制 package.json 到 server
cp server/package.json /tmp/poker414-fix/server/

# 6. 创建启动脚本
cat > /tmp/poker414-fix/start.sh << 'EOF'
#!/bin/bash
cd /opt/poker414/server

# 安装 Node.js（如果没有）
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 安装 PM2（如果没有）
if ! command -v pm2 &> /dev/null; then
    echo "🔧 安装 PM2..."
    sudo npm install -g pm2
fi

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 启动服务
echo "▶️ 启动服务..."
pm2 start server.js --name poker414
pm2 save
pm2 startup

echo "✅ 服务已启动！访问 http://$(curl -s ifconfig.me):3001"
EOF

chmod +x /tmp/poker414-fix/start.sh

# 7. 打包
cd /tmp/poker414-fix
tar -czf /Users/zhangyuan/.openclaw/workspace/poker-414-multiplayer/poker414-fix.tar.gz .

echo "✅ 打包完成！"
echo "📦 文件位置：/Users/zhangyuan/.openclaw/workspace/poker-414-multiplayer/poker414-fix.tar.gz"
