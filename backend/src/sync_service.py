"""
留情局数据同步服务
管理数据在 Supabase 和留情局之间的同步
"""

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

from supabase import create_client, Client
from adapter import LiuqingjuAdapter

logger = logging.getLogger(__name__)


class LiuqingjuSync:
    """留情局数据同步管理器"""

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        export_dir: str = "data"
    ):
        self.supabase_url = supabase_url or os.getenv('SUPABASE_URL')
        self.supabase_key = supabase_key or os.getenv('SUPABASE_KEY')

        if self.supabase_url and self.supabase_key:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
            self.use_supabase = True
        else:
            self.supabase = None
            self.use_supabase = False
            logger.warning("Supabase 未配置，将使用本地存储模式")

        self.export_dir = Path(export_dir)
        self.export_dir.mkdir(parents=True, exist_ok=True)

        self.adapter = LiuqingjuAdapter(
            output_path=str(self.export_dir / "liuqingju_export.json")
        )

        self.local_sync_file = self.export_dir / "liuqingju_sync_meta.json"

    def push_to_supabase(self, posts: List[dict]) -> Dict[str, Any]:
        """
        将帖子推送到 Supabase

        Args:
            posts: 帖子列表

        Returns:
            推送结果
        """
        if not self.use_supabase:
            return {"status": "local_only", "message": "Supabase 未配置"}

        if not posts:
            return {"status": "success", "pushed": 0}

        converted = [self.adapter.convert_post(p, generate_id=False) for p in posts]
        supabase_posts = [self.adapter._to_supabase_format(p) for p in converted]

        try:
            result = self.supabase.table('posts').insert(supabase_posts).execute()

            self._save_sync_meta({
                "lastPush": datetime.now().isoformat(),
                "pushedCount": len(supabase_posts),
                "postIds": [p.get('id') for p in result.data] if result.data else []
            })

            return {
                "status": "success",
                "pushed": len(supabase_posts),
                "data": result.data
            }

        except Exception as e:
            logger.error(f"推送到 Supabase 失败: {e}")
            return {
                "status": "error",
                "error": str(e),
                "pushed": 0
            }

    def fetch_from_supabase(self, limit: int = 50) -> List[dict]:
        """
        从 Supabase 获取最新的自动发布帖子

        Args:
            limit: 获取数量限制

        Returns:
            帖子列表
        """
        if not self.use_supabase:
            return self.adapter.get_export_data()

        try:
            response = self.supabase.table('posts') \
                .select('*') \
                .eq('is_auto_published', True) \
                .order('created_at', desc=True) \
                .limit(limit) \
                .execute()

            posts = []
            for post in response.data:
                converted = self.adapter.convert_post({
                    'id': post.get('id'),
                    'title': post.get('title'),
                    'content': post.get('content'),
                    'source_url': post.get('source_url'),
                    'source_university': post.get('source_university'),
                    'info_type': post.get('info_type'),
                    'degree_level': post.get('degree_level'),
                    'created_at': post.get('created_at')
                }, generate_id=False)

                converted['supabase_id'] = post.get('id')
                posts.append(converted)

            return posts

        except Exception as e:
            logger.error(f"从 Supabase 获取数据失败: {e}")
            return self.adapter.get_export_data()

    def sync_to_localstorage(self) -> Dict[str, Any]:
        """
        生成 localStorage 同步数据
        用于留情局论坛直接导入

        Returns:
            同步结果
        """
        posts = self.fetch_from_supabase()

        script = self.adapter.generate_sync_script()

        script_path = self.export_dir / "liuqingju_sync.js"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script)

        return {
            "status": "success",
            "count": len(posts),
            "scriptPath": str(script_path),
            "script": script
        }

    def get_sync_data(self) -> List[dict]:
        """
        获取同步数据（供留情局拉取）

        Returns:
            格式化后的情报数据
        """
        if self.use_supabase:
            return self.fetch_from_supabase()
        return self.adapter.get_export_data()

    def get_sync_meta(self) -> Dict[str, Any]:
        """获取同步元数据"""
        if self.local_sync_file.exists():
            with open(self.local_sync_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            "lastSync": None,
            "lastPush": None,
            "totalSynced": 0
        }

    def _save_sync_meta(self, meta: Dict[str, Any]):
        """保存同步元数据"""
        current = self.get_sync_meta()
        current.update(meta)
        current["lastSync"] = datetime.now().isoformat()

        with open(self.local_sync_file, 'w', encoding='utf-8') as f:
            json.dump(current, f, ensure_ascii=False, indent=2)

    def export_full_package(self) -> str:
        """
        导出完整的数据包
        包含所有格式的数据

        Returns:
            导出文件路径
        """
        posts = self.get_sync_data()

        package = {
            "version": "1.0",
            "exportTime": datetime.now().isoformat(),
            "postCount": len(posts),
            "posts": posts,
            "syncScript": self.adapter.generate_sync_script(),
            "meta": self.get_sync_meta()
        }

        output_path = self.export_dir / "liuqingju_full_package.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(package, f, ensure_ascii=False, indent=2)

        logger.info(f"完整数据包已导出: {output_path}")
        return str(output_path)


def main():
    """命令行入口"""
    import argparse

    parser = argparse.ArgumentParser(description="留情局数据同步工具")
    parser.add_argument('--fetch', action='store_true', help='从 Supabase 获取数据')
    parser.add_argument('--push', action='store_true', help='推送数据到 Supabase')
    parser.add_argument('--sync', action='store_true', help='生成同步脚本')
    parser.add_argument('--export', action='store_true', help='导出完整数据包')
    parser.add_argument('--stats', action='store_true', help='显示同步状态')

    args = parser.parse_args()

    sync = LiuqingjuSync()

    if args.fetch:
        posts = sync.fetch_from_supabase()
        print(f"获取到 {len(posts)} 条情报")

    elif args.push:
        posts = sync.adapter.get_export_data()
        result = sync.push_to_supabase(posts)
        print(f"推送结果: {result}")

    elif args.sync:
        result = sync.sync_to_localstorage()
        print(f"同步脚本已生成: {result['scriptPath']}")

    elif args.export:
        path = sync.export_full_package()
        print(f"数据包已导出: {path}")

    elif args.stats:
        meta = sync.get_sync_meta()
        posts = sync.get_sync_data()
        print("=== 同步状态 ===")
        print(f"总情报数: {len(posts)}")
        print(f"上次同步: {meta.get('lastSync', '从未同步')}")
        print(f"上次推送: {meta.get('lastPush', '从未推送')}")

    else:
        parser.print_help()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
