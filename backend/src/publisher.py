"""
Supabase 论坛发布模块
负责将处理后的信息发布到论坛
"""

import logging
import os
from typing import Dict, Any, Optional

from supabase import create_client, Client
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class ForumPublisher:
    """论坛发布器"""
    
    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        bot_user_id: Optional[str] = None
    ):
        """
        初始化发布器
        
        Args:
            supabase_url: Supabase 项目 URL
            supabase_key: Supabase Service Role Key
            bot_user_id: 机器人用户 ID
        """
        self.supabase_url = supabase_url or os.getenv("SUPABASE_URL")
        self.supabase_key = supabase_key or os.getenv("SUPABASE_KEY")
        self.bot_user_id = bot_user_id or os.getenv("BOT_USER_ID")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase URL 和 Key 必须设置")
        
        if not self.bot_user_id:
            raise ValueError("BOT_USER_ID 必须设置")
        
        # 初始化 Supabase 客户端
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        
        # 分类映射缓存
        self._category_cache = {}
    
    def _get_category_id(self, slug: str) -> Optional[str]:
        """
        获取分类 ID
        
        Args:
            slug: 分类 slug
            
        Returns:
            分类 ID 或 None
        """
        # 检查缓存
        if slug in self._category_cache:
            return self._category_cache[slug]
        
        try:
            response = self.client.table("categories") \
                .select("id") \
                .eq("slug", slug) \
                .single() \
                .execute()
            
            if response.data:
                category_id = response.data["id"]
                self._category_cache[slug] = category_id
                return category_id
            else:
                logger.warning(f"未找到分类: {slug}")
                return None
                
        except Exception as e:
            logger.error(f"获取分类失败: {e}")
            return None
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    def publish_post(
        self,
        title: str,
        content: str,
        category_slug: str = "admissions",
        source_url: str = "",
        source_university: str = "",
        info_type: str = "admission",
        degree_level: str = "all"
    ) -> Dict[str, Any]:
        """
        发布帖子到论坛
        
        Args:
            title: 帖子标题
            content: 帖子内容（Markdown 格式）
            category_slug: 分类 slug
            source_url: 原文链接
            source_university: 来源大学
            info_type: 信息类型
            degree_level: 学位层次
            
        Returns:
            发布结果字典
        """
        result = {
            "success": False,
            "post_id": None,
            "error": None
        }
        
        try:
            # 获取分类 ID
            category_id = self._get_category_id(category_slug)
            if not category_id:
                result["error"] = f"分类不存在: {category_slug}"
                return result
            
            # 构建帖子数据
            post_data = {
                "title": title,
                "content": content,
                "category_id": category_id,
                "author_id": self.bot_user_id,
                "source_url": source_url,
                "source_university": source_university,
                "info_type": info_type,
                "degree_level": degree_level,
                "is_auto_published": True
            }
            
            logger.info(f"正在发布帖子: {title[:50]}...")
            
            # 插入帖子
            response = self.client.table("posts").insert(post_data).execute()
            
            if response.data:
                post_id = response.data[0]["id"]
                result["success"] = True
                result["post_id"] = post_id
                logger.info(f"帖子发布成功: {post_id}")
            else:
                result["error"] = "发布失败，无返回数据"
                logger.error(result["error"])
                
        except Exception as e:
            result["error"] = f"发布异常: {str(e)}"
            logger.error(result["error"])
            raise
        
        return result
    
    def publish_batch(
        self,
        posts: list,
        category_slug: str = "admissions"
    ) -> list:
        """
        批量发布帖子
        
        Args:
            posts: 帖子列表，每个元素包含 title, content, url, university, info 等
            category_slug: 分类 slug
            
        Returns:
            发布结果列表
        """
        results = []
        
        for post in posts:
            info = post.get("info", {})
            
            result = self.publish_post(
                title=post.get("title", ""),
                content=post.get("post_content", ""),
                category_slug=category_slug,
                source_url=post.get("url", ""),
                source_university=post.get("university", ""),
                info_type=info.get("info_type", "admission"),
                degree_level=info.get("degree_level", "all")
            )
            
            results.append({
                "university": post.get("university"),
                "url": post.get("url"),
                **result
            })
        
        return results
    
    def check_post_exists(self, source_url: str) -> bool:
        """
        检查帖子是否已存在
        
        Args:
            source_url: 原文链接
            
        Returns:
            是否存在
        """
        try:
            response = self.client.table("posts") \
                .select("id") \
                .eq("source_url", source_url) \
                .execute()
            
            return len(response.data) > 0
            
        except Exception as e:
            logger.error(f"检查帖子存在性失败: {e}")
            return False
    
    def get_recent_posts(self, limit: int = 10) -> list:
        """
        获取最近发布的帖子
        
        Args:
            limit: 数量限制
            
        Returns:
            帖子列表
        """
        try:
            response = self.client.table("posts") \
                .select("*") \
                .eq("is_auto_published", True) \
                .order("created_at", desc=True) \
                .limit(limit) \
                .execute()
            
            return response.data or []
            
        except Exception as e:
            logger.error(f"获取最近帖子失败: {e}")
            return []
    
    def delete_post(self, post_id: str) -> bool:
        """
        删除帖子（用于测试或纠错）
        
        Args:
            post_id: 帖子 ID
            
        Returns:
            是否成功
        """
        try:
            self.client.table("posts").delete().eq("id", post_id).execute()
            logger.info(f"帖子已删除: {post_id}")
            return True
            
        except Exception as e:
            logger.error(f"删除帖子失败: {e}")
            return False
