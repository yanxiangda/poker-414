#!/bin/bash

echo "📦 开始打包东北抛幺 414..."

cd /Users/zhangyuan/.openclaw/workspace/poker-414-multiplayer

# 1. 构建前端
echo "🔨 构建前端..."
cd frontend && npm run build && cd ..

# 2. 创建部署目录
echo "📁 创建部署包..."
rm -rf /tmp/poker414-deploy
mkdir -p /tmp/poker414-deploy

# 3. 复制文件
cp -r server /tmp/poker414-deploy/
cp -r frontend/dist /tmp/poker414-deploy/frontend/
cp frontend/package.json /tmp/poker414-deploy/frontend/
cp frontend/package-lock.json /tmp/poker414-deploy/frontend/

# 4. 创建启动脚本
cat > /tmp/poker414-deploy/start.sh << 'EOF'
#!/bin/bash
cd /opt/poker414
npm install --production
pm2 start server/server.js --name poker414
pm2 save
echo "✅ 服务已启动！访问 http://$(curl -s ifconfig.me):3001"
EOF

chmod +x /tmp/poker414-deploy/start.sh

# 5. 复制部署文档
cp DEPLOY.md /tmp/poker414-deploy/

# 6. 打包
cd /tmp/poker414-deploy
tar -czf /Users/zhangyuan/.openclaw/workspace/poker-414-multiplayer/poker414-deploy.tar.gz .

echo "✅ 打包完成！"
echo "📦 文件位置：/Users/zhangyuan/.openclaw/workspace/poker-414-multiplayer/poker414-deploy.tar.gz"
echo ""
echo "📋 上传到服务器的命令："
echo "scp poker414-deploy.tar.gz root@你的服务器 IP:/opt/"
echo ""
echo "🚀 服务器上执行的命令："
echo "cd /opt"
echo "tar -xzf poker414-deploy.tar.gz"
echo "mv /opt/poker414-deploy /opt/poker414"
echo "cd /opt/poker414"
echo "./start.sh"
