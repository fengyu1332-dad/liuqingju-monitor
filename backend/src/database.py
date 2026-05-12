"""
SQLite 本地数据库模块
用于去重和记录处理历史
"""

import sqlite3
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any


class LocalDatabase:
    """本地 SQLite 数据库管理器"""
    
    def __init__(self, db_path: str = "data/monitor.db"):
        """
        初始化数据库连接
        
        Args:
            db_path: 数据库文件路径
        """
        self.db_path = Path(db_path)
        # 确保目录存在
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.row_factory = sqlite3.Row
        self._init_tables()
    
    def _init_tables(self):
        """初始化数据库表结构"""
        cursor = self.conn.cursor()
        
        # 已处理页面记录表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS processed_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE NOT NULL,
                university TEXT NOT NULL,
                content_hash TEXT,
                is_published BOOLEAN DEFAULT FALSE,
                post_id TEXT,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 执行日志表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS execution_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                universities_processed INTEGER DEFAULT 0,
                posts_published INTEGER DEFAULT 0,
                errors TEXT,
                status TEXT DEFAULT 'success'
            )
        """)
        
        # 创建索引
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_url ON processed_pages(url)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_university ON processed_pages(university)
        """)
        
        self.conn.commit()
    
    def is_url_processed(self, url: str) -> bool:
        """
        检查 URL 是否已处理过
        
        Args:
            url: 页面 URL
            
        Returns:
            是否已处理
        """
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT 1 FROM processed_pages WHERE url = ?",
            (url,)
        )
        return cursor.fetchone() is not None
    
    def is_content_changed(self, url: str, content: str) -> bool:
        """
        检查内容是否发生变化
        
        Args:
            url: 页面 URL
            content: 当前内容
            
        Returns:
            内容是否发生变化（或从未处理过）
        """
        current_hash = self._compute_hash(content)
        
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT content_hash FROM processed_pages WHERE url = ?",
            (url,)
        )
        row = cursor.fetchone()
        
        if row is None:
            return True  # 从未处理过
        
        return row['content_hash'] != current_hash
    
    def record_processed(
        self, 
        url: str, 
        university: str, 
        content: str,
        is_published: bool = False,
        post_id: Optional[str] = None
    ):
        """
        记录已处理的页面
        
        Args:
            url: 页面 URL
            university: 大学名称
            content: 页面内容
            is_published: 是否已发布到论坛
            post_id: 论坛帖子 ID
        """
        content_hash = self._compute_hash(content)
        
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO processed_pages 
            (url, university, content_hash, is_published, post_id, processed_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (url, university, content_hash, is_published, post_id, datetime.now()))
        
        self.conn.commit()
    
    def log_execution(
        self,
        universities_processed: int = 0,
        posts_published: int = 0,
        errors: Optional[str] = None,
        status: str = "success"
    ) -> int:
        """
        记录执行日志
        
        Args:
            universities_processed: 处理的大学数量
            posts_published: 发布的帖子数量
            errors: 错误信息
            status: 执行状态
            
        Returns:
            日志记录 ID
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO execution_logs 
            (universities_processed, posts_published, errors, status)
            VALUES (?, ?, ?, ?)
        """, (universities_processed, posts_published, errors, status))
        
        self.conn.commit()
        return cursor.lastrowid
    
    def get_recent_logs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        获取最近的执行日志
        
        Args:
            limit: 返回记录数量
            
        Returns:
            日志记录列表
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT * FROM execution_logs
            ORDER BY run_time DESC
            LIMIT ?
        """, (limit,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def get_stats(self) -> Dict[str, Any]:
        """
        获取统计信息
        
        Returns:
            统计数据字典
        """
        cursor = self.conn.cursor()
        
        # 总处理页面数
        cursor.execute("SELECT COUNT(*) as total FROM processed_pages")
        total_pages = cursor.fetchone()['total']
        
        # 已发布帖子数
        cursor.execute(
            "SELECT COUNT(*) as published FROM processed_pages WHERE is_published = TRUE"
        )
        published_count = cursor.fetchone()['published']
        
        # 各大学处理数量
        cursor.execute("""
            SELECT university, COUNT(*) as count 
            FROM processed_pages 
            GROUP BY university
            ORDER BY count DESC
        """)
        university_stats = {row['university']: row['count'] for row in cursor.fetchall()}
        
        return {
            "total_pages_processed": total_pages,
            "total_posts_published": published_count,
            "university_breakdown": university_stats
        }
    
    @staticmethod
    def _compute_hash(content: str) -> str:
        """
        计算内容的 MD5 哈希
        
        Args:
            content: 内容字符串
            
        Returns:
            MD5 哈希值
        """
        return hashlib.md5(content.encode('utf-8')).hexdigest()
    
    def close(self):
        """关闭数据库连接"""
        self.conn.close()
    
    def __enter__(self):
        """上下文管理器入口"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口"""
        self.close()
