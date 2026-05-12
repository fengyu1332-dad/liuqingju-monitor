"""
大学招生信息监控系统 - 主程序入口
支持留情局数据导出
"""

import argparse
import logging
import os
import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv

from database import LocalDatabase
from scraper import WebScraper
from processor import InfoProcessor
from publisher import ForumPublisher
from utils import setup_logging

try:
    from adapter import LiuqingjuAdapter
    from sync_service import LiuqingjuSync
    LIUQIINGJU_AVAILABLE = True
except ImportError:
    LIUQIINGJU_AVAILABLE = False
    logger = logging.getLogger(__name__)

# 加载环境变量
load_dotenv()

logger = logging.getLogger(__name__)


class UniversityMonitor:
    """大学招生信息监控器"""

    def __init__(self, config_path: str = "config/universities.yaml"):
        """
        初始化监控器

        Args:
            config_path: 配置文件路径
        """
        self.config_path = config_path
        self.config = self._load_config()

        monitor_config = self.config.get("monitor", {})

        self.scraper = WebScraper(
            timeout=monitor_config.get("timeout", 30),
            delay=monitor_config.get("request_delay", 5),
            max_retries=monitor_config.get("max_retries", 3),
            max_content_length=monitor_config.get("max_content_length", 8000)
        )

        self.processor = InfoProcessor()
        self.publisher = ForumPublisher()

        self.confidence_threshold = monitor_config.get("confidence_threshold", 0.7)

        #留情局适配器
        if LIUQIINGJU_AVAILABLE:
            self.adapter = LiuqingjuAdapter()
            self.sync = LiuqingjuSync()
        else:
            self.adapter = None
            self.sync = None

    def _load_config(self) -> dict:
        """加载配置文件"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"加载配置文件失败: {e}")
            return {"universities": [], "monitor": {}}

    def run(self, dry_run: bool = False, export_liuqingju: bool = False, sync_target: str = 'all') -> dict:
        """
        执行监控任务

        Args:
            dry_run: 是否仅测试，不实际发布
            export_liuqingju: 是否导出到留情局
            sync_target: 同步目标 - 'all', 'supabase', 'local'

        Returns:
            执行结果统计
        """
        stats = {
            "universities_processed": 0,
            "posts_published": 0,
            "liuqingju_exports": 0,
            "errors": []
        }

        universities = self.config.get("universities", [])

        if not universities:
            logger.warning("配置文件中没有大学列表")
            return stats

        logger.info(f"开始监控 {len(universities)} 所大学")

        #留情局发布的帖子
        lq_posts = []

        with LocalDatabase() as db:
            for uni_config in universities:
                try:
                    result = self._process_university(uni_config, db, dry_run, export_liuqingju)
                    if result.get("published"):
                        stats["posts_published"] += 1
                    if result.get("liuqingju_export"):
                        lq_posts.append(result.get("liuqingju_data"))
                        stats["liuqingju_exports"] += 1
                    stats["universities_processed"] += 1

                except Exception as e:
                    error_msg = f"处理 {uni_config.get('name')} 失败: {e}"
                    logger.error(error_msg)
                    stats["errors"].append(error_msg)

        #留情局数据导出
        if export_liuqingju and lq_posts:
            self._export_to_liuqingju(lq_posts, sync_target)

        # 记录执行日志
        with LocalDatabase() as db:
            db.log_execution(
                universities_processed=stats["universities_processed"],
                posts_published=stats["posts_published"],
                errors="; ".join(stats["errors"]) if stats["errors"] else None,
                status="partial" if stats["errors"] else "success"
            )

        logger.info(f"监控完成：处理了 {stats['universities_processed']} 所大学，发布了 {stats['posts_published']} 个帖子")

        if export_liuqingju:
            logger.info(f"留情局导出：{stats['liuqingju_exports']} 条情报")

        return stats

    def _process_university(self, uni_config: dict, db: LocalDatabase, dry_run: bool, export_liuqingju: bool) -> dict:
        """
        处理单个大学

        Args:
            uni_config: 大学配置
            db: 数据库连接
            dry_run: 是否仅测试
            export_liuqingju: 是否导出到留情局

        Returns:
            处理结果
        """
        university = uni_config.get("name", "Unknown")
        pages = uni_config.get("pages", [])

        logger.info(f"正在处理: {university}")

        result = {"published": False, "liuqingju_export": False}

        for page in pages:
            url = page.get("url") if isinstance(page, dict) else page

            # 检查是否已处理
            if db.is_url_processed(url):
                logger.info(f"  [跳过] {url} - 已处理过")
                continue

            # 1. 爬取页面
            logger.info(f"  [爬取] {url}")
            scrape_result = self.scraper.scrape_page(url, page if isinstance(page, dict) else None)

            if not scrape_result.get("success"):
                logger.warning(f"  [失败] 爬取失败: {scrape_result.get('error')}")
                db.record_processed(url, university, scrape_result.get("content", ""), False)
                continue

            content = scrape_result.get("content", "")

            # 检查内容是否变化
            if not db.is_content_changed(url, content):
                logger.info(f"  [跳过] 内容未变化")
                db.record_processed(url, university, content, False)
                continue

            # 2. 使用 DeepSeek 提取信息
            logger.info(f"  [处理] 调用 DeepSeek API")
            info = self.processor.extract_info(content, university)

            # 检查置信度
            if info.get("confidence", 0) < self.confidence_threshold:
                logger.info(f"  [跳过] 置信度不足: {info.get('confidence', 0)}")
                db.record_processed(url, university, content, False)
                continue

            # 检查是否相关
            if not info.get("is_relevant"):
                logger.info(f"  [跳过] 无招生相关信息")
                db.record_processed(url, university, content, False)
                continue

            # 3. 生成论坛帖子
            post_content = self.processor.generate_forum_post(
                info,
                university,
                url,
                scrape_result.get("title", "")
            )

            if not post_content:
                logger.info(f"  [跳过] 无法生成帖子内容")
                db.record_processed(url, university, content, False)
                continue

            # 留情局数据
            if export_liuqingju:
                result["liuqingju_data"] = {
                    "title": info.get("title", "招生信息更新"),
                    "content": post_content,
                    "source_url": url,
                    "source_university": university,
                    "info_type": info.get("info_type", "admission"),
                    "degree_level": info.get("degree_level", "all"),
                    "confidence": info.get("confidence", 0),
                    "created_at": scrape_result.get("publish_date") or ""
                }

            # 4. 发布到论坛
            if dry_run:
                logger.info(f"  [测试模式] 将发布帖子: {info.get('title', '')[:50]}...")
                db.record_processed(url, university, content, False)
                result["published"] = True
                result["liuqingju_export"] = True
            else:
                logger.info(f"  [发布] 发布帖子到论坛")
                publish_result = self.publisher.publish_post(
                    title=f"[{university}] {info.get('title', '招生信息更新')}",
                    content=post_content,
                    category_slug=info.get("info_type", "admission"),
                    source_url=url,
                    source_university=university,
                    info_type=info.get("info_type", "admission"),
                    degree_level=info.get("degree_level", "all")
                )

                if publish_result.get("success"):
                    logger.info(f"  [成功] 帖子已发布: {publish_result['post_id']}")
                    db.record_processed(
                        url,
                        university,
                        content,
                        True,
                        publish_result.get("post_id")
                    )
                    result["published"] = True
                    result["liuqingju_export"] = True
                else:
                    error = publish_result.get("error", "未知错误")
                    logger.error(f"  [失败] 发布失败: {error}")
                    db.record_processed(url, university, content, False)

        return result

    def _export_to_liuqingju(self, posts: list, sync_target: str = 'all'):
        """导出数据到留情局"""
        if not LIUQIINGJU_AVAILABLE:
            logger.warning("留情局适配器不可用，跳过导出")
            return

        try:
            # 导出到本地文件
            export_result = self.adapter.export_posts(posts)
            logger.info(f"留情局数据导出完成: {export_result}")

            # 根据目标同步
            if sync_target in ['all', 'supabase']:
                self.sync.push_to_supabase(posts)

            if sync_target in ['all', 'local']:
                self.sync.sync_to_localstorage()

        except Exception as e:
            logger.error(f"留情局数据导出失败: {e}")

    def close(self):
        """关闭资源"""
        self.scraper.close()


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="大学招生信息监控系统")
    parser.add_argument(
        "--config",
        default="config/universities.yaml",
        help="配置文件路径"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="测试模式，不实际发布"
    )
    parser.add_argument(
        "--export-liuqingju",
        action="store_true",
        help="导出到留情局"
    )
    parser.add_argument(
        "--sync-target",
        default="all",
        choices=['all', 'supabase', 'local'],
        help="留情局同步目标: all(全部), supabase(仅云端), local(仅本地)"
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="显示统计信息"
    )
    parser.add_argument(
        "--logs",
        action="store_true",
        help="显示最近执行日志"
    )

    args = parser.parse_args()

    # 设置日志
    setup_logging()

    # 检查环境变量
    required_env = ["DEEPSEEK_API_KEY", "SUPABASE_URL", "SUPABASE_KEY", "BOT_USER_ID"]
    missing_env = [env for env in required_env if not os.getenv(env)]
    if missing_env:
        logger.error(f"缺少必要的环境变量: {', '.join(missing_env)}")
        logger.error("请复制 .env.example 为 .env 并填写配置")
        sys.exit(1)

    # 显示统计信息
    if args.stats:
        with LocalDatabase() as db:
            stats = db.get_stats()
            print("\n=== 统计信息 ===")
            print(f"总处理页面数: {stats['total_pages_processed']}")
            print(f"已发布帖子数: {stats['total_posts_published']}")
            print("\n各大学处理数量:")
            for uni, count in stats['university_breakdown'].items():
                print(f"  {uni}: {count}")
        return

    # 显示执行日志
    if args.logs:
        with LocalDatabase() as db:
            logs = db.get_recent_logs(10)
            print("\n=== 最近执行日志 ===")
            for log in logs:
                print(f"\n时间: {log['run_time']}")
                print(f"状态: {log['status']}")
                print(f"处理大学: {log['universities_processed']}")
                print(f"发布帖子: {log['posts_published']}")
                if log['errors']:
                    print(f"错误: {log['errors']}")
        return

    # 执行监控
    monitor = UniversityMonitor(args.config)

    try:
        stats = monitor.run(
            dry_run=args.dry_run,
            export_liuqingju=args.export_liuqingju,
            sync_target=args.sync_target
        )

        print("\n=== 执行结果 ===")
        print(f"处理大学数: {stats['universities_processed']}")
        print(f"发布帖子数: {stats['posts_published']}")

        if args.export_liuqingju:
            print(f"留情局导出: {stats['liuqingju_exports']} 条情报")

        if stats['errors']:
            print(f"\n错误 ({len(stats['errors'])}):")
            for error in stats['errors']:
                print(f"  - {error}")

        sys.exit(0 if not stats['errors'] else 1)

    except KeyboardInterrupt:
        logger.info("用户中断")
        sys.exit(0)
    except Exception as e:
        logger.error(f"执行失败: {e}")
        sys.exit(1)
    finally:
        monitor.close()


if __name__ == "__main__":
    main()
