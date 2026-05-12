#!/bin/bash
# Supabase 数据库初始化脚本
# 使用方法: bash setup-supabase.sh

echo "========================================="
echo "留情局AI监控系统 - Supabase 初始化"
echo "========================================="
echo ""

# 检查是否安装了 curl
if ! command -v curl &> /dev/null; then
    echo "❌ 错误: 未安装 curl"
    echo "请先安装 curl"
    exit 1
fi

echo "✅ curl 已安装"
echo ""

# 提示用户获取凭证
echo "请在继续之前:"
echo "1. 在 https://supabase.com 创建项目"
echo "2. 获取以下信息:"
echo "   - Project URL (格式: https://xxx.supabase.co)"
echo "   - Service Role Key (在 Settings → API 中获取)"
echo ""

# 读取凭证
read -p "请输入 Supabase Project URL: " SUPABASE_URL
read -p "请输入 Supabase Service Role Key: " SUPABASE_KEY

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "❌ 错误: URL 和 Key 不能为空"
    exit 1
fi

echo ""
echo "========================================="
echo "开始初始化数据库..."
echo "========================================="
echo ""

# 读取 SQL 文件并执行
SQL_FILE="supabase/init-database.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ 错误: 找不到 $SQL_FILE"
    exit 1
fi

# 执行 SQL
echo "📊 创建数据库表..."

# 读取 SQL 内容
SQL_CONTENT=$(cat "$SQL_FILE")

# 发送到 Supabase
RESPONSE=$(curl -s \
    -X POST \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

echo "响应: $RESPONSE"
echo ""

# 保存配置到本地文件
echo "💾 保存配置到本地..."

cat > .env.local << EOF
# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_KEY=$SUPABASE_KEY

# DeepSeek API (需要手动添加)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
EOF

echo ""

# 提示配置 GitHub Secrets
echo "========================================="
echo "✅ Supabase 初始化完成！"
echo "========================================="
echo ""
echo "下一步操作:"
echo ""
echo "1. 在留情局管理员后台配置 Supabase:"
echo "   - 打开 admin.html"
echo "   - 登录管理员账号"
echo "   - 进入 AI监控 标签页"
echo "   - 配置 Supabase URL 和 Key"
echo ""
echo "2. 或者在浏览器控制台配置:"
echo ""
cat << 'EOF'
javascript:
localStorage.setItem('supabase_url', 'REPLACE_WITH_YOUR_URL');
localStorage.setItem('supabase_key', 'REPLACE_WITH_YOUR_KEY');
EOF
echo ""
echo "3. 更新 GitHub Secrets (如果需要):"
echo "   - SUPABASE_URL=$SUPABASE_URL"
echo "   - SUPABASE_KEY=已保存到 .env.local"
echo ""
