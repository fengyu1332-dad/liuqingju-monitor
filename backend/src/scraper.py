"""
爬虫模块
负责抓取大学官网页面内容
"""

import time
import logging
from typing import Optional, Dict, Any
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class WebScraper:
    """网页爬虫类"""
    
    def __init__(
        self,
        timeout: int = 30,
        delay: int = 5,
        max_retries: int = 3,
        max_content_length: int = 8000
    ):
        """
        初始化爬虫
        
        Args:
            timeout: 请求超时时间（秒）
            delay: 请求间隔（秒）
            max_retries: 最大重试次数
            max_content_length: 内容最大长度
        """
        self.timeout = timeout
        self.delay = delay
        self.max_retries = max_retries
        self.max_content_length = max_content_length
        self.ua = UserAgent()
        
        # 创建 session
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
        })
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    def scrape_page(self, url: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        抓取单个页面
        
        Args:
            url: 页面 URL
            config: 页面配置（可选）
            
        Returns:
            包含页面信息的字典
        """
        result = {
            "url": url,
            "title": "",
            "content": "",
            "publish_date": None,
            "success": False,
            "error": None
        }
        
        try:
            # 设置随机 User-Agent
            headers = {
                'User-Agent': self.ua.random
            }
            
            logger.info(f"正在抓取: {url}")
            
            response = self.session.get(
                url,
                headers=headers,
                timeout=self.timeout,
                allow_redirects=True
            )
            response.raise_for_status()
            
            # 检测编码
            response.encoding = response.apparent_encoding
            
            # 解析 HTML
            soup = BeautifulSoup(response.text, 'lxml')
            
            # 提取标题
            result["title"] = self._extract_title(soup)
            
            # 提取正文
            result["content"] = self._extract_content(soup, config)
            
            # 提取发布日期
            result["publish_date"] = self._extract_publish_date(soup)
            
            result["success"] = True
            logger.info(f"抓取成功: {url} (标题: {result['title'][:50]}...)")
            
        except requests.exceptions.RequestException as e:
            result["error"] = f"请求错误: {str(e)}"
            logger.error(f"抓取失败 {url}: {result['error']}")
            raise
        except Exception as e:
            result["error"] = f"解析错误: {str(e)}"
            logger.error(f"解析失败 {url}: {result['error']}")
        
        # 请求间隔
        time.sleep(self.delay)
        
        return result
    
    def _extract_title(self, soup: BeautifulSoup) -> str:
        """
        提取页面标题
        
        Args:
            soup: BeautifulSoup 对象
            
        Returns:
            页面标题
        """
        # 优先从 title 标签提取
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.get_text(strip=True)
        
        # 备选：从 h1 标签提取
        h1_tag = soup.find('h1')
        if h1_tag:
            return h1_tag.get_text(strip=True)
        
        return ""
    
    def _extract_content(
        self, 
        soup: BeautifulSoup, 
        config: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        提取页面正文内容
        
        Args:
            soup: BeautifulSoup 对象
            config: 页面配置（可能包含 CSS 选择器）
            
        Returns:
            正文内容
        """
        # 移除不需要的元素
        for element in soup(['script', 'style', 'nav', 'header', 'footer', 
                            'aside', 'form', 'button', 'input']):
            element.decompose()
        
        # 如果配置了特定选择器，优先使用
        if config and 'content_selector' in config:
            content_elem = soup.select_one(config['content_selector'])
            if content_elem:
                return self._clean_text(content_elem.get_text())
        
        # 自动检测主要内容区域
        # 策略：找文本内容最多的 div/article/main 元素
        candidates = soup.find_all(['article', 'main', 'div'])
        best_candidate = None
        max_text_length = 0
        
        for candidate in candidates:
            text = candidate.get_text(strip=True)
            # 过滤掉太短的元素
            if len(text) > max_text_length and len(text) > 200:
                max_text_length = len(text)
                best_candidate = candidate
        
        if best_candidate:
            return self._clean_text(best_candidate.get_text())
        
        # 备选：直接提取 body 内容
        body = soup.find('body')
        if body:
            return self._clean_text(body.get_text())
        
        return ""
    
    def _extract_publish_date(self, soup: BeautifulSoup) -> Optional[str]:
        """
        尝试提取页面发布日期
        
        Args:
            soup: BeautifulSoup 对象
            
        Returns:
            发布日期字符串，或 None
        """
        # 常见的日期 meta 标签
        date_meta_selectors = [
            'meta[property="article:published_time"]',
            'meta[name="publish-date"]',
            'meta[name="date"]',
            'meta[property="datePublished"]',
        ]
        
        for selector in date_meta_selectors:
            meta = soup.select_one(selector)
            if meta and meta.get('content'):
                return meta['content']
        
        # 从常见的时间元素提取
        time_elem = soup.find('time')
        if time_elem and time_elem.get('datetime'):
            return time_elem['datetime']
        
        return None
    
    def _clean_text(self, text: str) -> str:
        """
        清理文本内容
        
        Args:
            text: 原始文本
            
        Returns:
            清理后的文本
        """
        # 去除多余空白
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        # 限制长度
        if len(text) > self.max_content_length:
            text = text[:self.max_content_length] + "..."
        
        return text
    
    def scrape_university(
        self, 
        university: str, 
        pages: list,
        config: Optional[Dict[str, Any]] = None
    ) -> list:
        """
        抓取一个大学的所有页面
        
        Args:
            university: 大学名称
            pages: 页面 URL 列表
            config: 额外配置
            
        Returns:
            抓取结果列表
        """
        results = []
        
        for page in pages:
            url = page['url'] if isinstance(page, dict) else page
            page_config = page if isinstance(page, dict) else {}
            
            result = self.scrape_page(url, page_config)
            result['university'] = university
            results.append(result)
        
        return results
    
    def close(self):
        """关闭 session"""
        self.session.close()
    
    def __enter__(self):
        """上下文管理器入口"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口"""
        self.close()
