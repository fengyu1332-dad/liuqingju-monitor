#!/bin/bash
# GitHub 仓库初始化脚本
# 使用方法: bash setup-github.sh

echo "========================================="
echo "留情局AI监控系统 - GitHub 初始化"
echo "========================================="
echo ""

# 检查是否安装了 git
if ! command -v git &> /dev/null; then
    echo "❌ 错误: 未安装 git"
    echo "请先安装 git: https://git-scm.com/download"
    exit 1
fi

# 检查是否在正确目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ 错误: 请在 university-monitor-package 目录下运行此脚本"
    exit 1
fi

echo "✅ Git 已安装"
echo ""

# 初始化 Git 仓库
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    echo ""
else
    echo "✅ Git 仓库已初始化"
fi

# 创建 .gitignore
echo "📝 创建 .gitignore..."
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
*.egg-info/
dist/
build/

# Environment
.env
.env.local
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# macOS
.DS_Store

# Data
data/
*.db
*.sqlite

# Node (if using)
node_modules/
npm-debug.log

# Temporary files
*.tmp
.cache/
EOF
echo ""

# 添加所有文件
echo "📤 添加文件到 Git..."
git add .
echo ""

# 创建初始提交
echo "💾 创建初始提交..."
git commit -m "Initial commit:留情局AI监控系统

- 大学招生信息监控
- DeepSeek AI 信息提取
- 留情局数据适配器
- Supabase 集成
- GitHub Actions 自动化"
echo ""

# 获取 GitHub 用户名
read -p "请输入您的 GitHub 用户名: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ 用户名不能为空"
    exit 1
fi

# 添加远程仓库
echo "🔗 添加远程仓库..."
git remote add origin "https://github.com/$GITHUB_USERNAME/liuqingju-monitor.git"
echo ""

# 推送代码
echo "🚀 推送到 GitHub..."
echo ""
echo "⚠️  注意: 如果这是首次推送，您可能需要输入 GitHub 用户名和密码/Token"
echo ""

git branch -M main
git push -u origin main

echo ""
echo "========================================="
echo "✅ GitHub 仓库设置完成！"
echo "========================================="
echo ""
echo "下一步操作:"
echo "1. 访问 https://github.com/$GITHUB_USERNAME/liuqingju-monitor"
echo "2. 配置 GitHub Secrets:"
echo "   - DEEPSEEK_API_KEY"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_KEY"
echo "   - BOT_USER_ID"
echo "3. 查看 Actions 标签页"
echo ""
