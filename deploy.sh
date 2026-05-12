#!/bin/bash
# 快速部署脚本

echo "=========================================="
echo "大学招生信息监控系统 - 快速部署"
echo "=========================================="

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 请先安装 Python 3.9+"
    exit 1
fi

echo "✅ Python 已安装"

# 安装依赖
echo ""
echo "正在安装 Python 依赖..."
cd backend
pip install -r requirements.txt --break-system-packages

# 检查环境变量
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  未找到 .env 文件"
    echo "请复制 .env.example 为 .env 并填写配置："
    echo ""
    echo "  cp .env.example .env"
    echo "  nano .env  # 或使用其他编辑器"
    echo ""
    echo "需要配置："
    echo "  - DEEPSEEK_API_KEY"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_KEY"
    echo "  - BOT_USER_ID"
    echo ""
    exit 1
fi

echo ""
echo "✅ 环境变量已配置"
echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "测试运行："
echo "  python src/main.py --dry-run"
echo ""
echo "正式运行："
echo "  python src/main.py"
echo ""
