"""
DeepSeek 信息处理模块
使用 DeepSeek API 提取和结构化招生信息
"""

import json
import logging
import os
from typing import Dict, Any, Optional

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class InfoProcessor:
    """招生信息处理器"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "deepseek-chat"):
        """
        初始化处理器
        
        Args:
            api_key: DeepSeek API Key，默认从环境变量读取
            model: 使用的模型名称
        """
        self.api_key = api_key or os.getenv("DEEPSEEK_API_KEY")
        if not self.api_key:
            raise ValueError("DeepSeek API Key 未设置")
        
        self.model = model
        
        # 初始化 DeepSeek 客户端（兼容 OpenAI SDK）
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.deepseek.com"
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    def extract_info(self, content: str, university: str) -> Dict[str, Any]:
        """
        从页面内容中提取招生信息
        
        Args:
            content: 页面正文内容
            university: 大学名称
            
        Returns:
            结构化的招生信息字典
        """
        # 构建 prompt
        prompt = self._build_extraction_prompt(content, university)
        
        try:
            logger.info(f"正在使用 DeepSeek 处理 {university} 的内容...")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的留学信息提取助手，擅长从大学官网提取招生录取信息。请严格按照 JSON 格式返回结果。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # 低温度提高一致性
                max_tokens=1500
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # 解析 JSON
            result = self._parse_json_response(result_text)
            
            logger.info(f"{university} 处理完成，置信度: {result.get('confidence', 0)}")
            return result
            
        except Exception as e:
            logger.error(f"DeepSeek API 调用失败: {e}")
            return {
                "is_relevant": False,
                "error": str(e)
            }
    
    def _build_extraction_prompt(self, content: str, university: str) -> str:
        """
        构建信息提取 prompt
        
        Args:
            content: 页面内容
            university: 大学名称
            
        Returns:
            Prompt 字符串
        """
        # 截取内容（避免超出 token 限制）
        max_length = 6000
        if len(content) > max_length:
            content = content[:max_length] + "..."
        
        return f"""请分析以下来自 {university} 官方网站的内容，提取招生/录取相关信息。

请严格按照以下 JSON 格式返回结果（不要添加任何其他文字）：
{{
    "is_relevant": true/false,  // 是否包含招生/录取/申请/奖学金相关信息
    "info_type": "admission|enrollment|deadline|scholarship|other",  // 信息类型
    "degree_level": "undergraduate|master|phd|all",  // 学位层次
    "title": "信息标题（简洁明了）",
    "summary": "中文摘要（100-200字，适合论坛发布，包含关键信息）",
    "key_dates": [
        {{"event": "事件名称", "date": "YYYY-MM-DD 或描述"}}
    ],
    "requirements": ["申请要求1", "申请要求2"],  // 申请要求列表
    "scholarship_info": "奖学金信息（如有）",
    "contact_email": "联系邮箱（如有）",
    "original_language": "en|zh|other",  // 原文语言
    "confidence": 0.0-1.0  // 提取置信度
}}

判断标准：
- is_relevant: 只有包含明确的招生、录取、申请截止日期、奖学金等信息时才为 true
- info_type: admission=招生简章, enrollment=录取通知, deadline=截止日期, scholarship=奖学金
- degree_level: 根据内容判断是本科、硕士还是博士，不确定则为 all
- confidence: 你对提取结果的信心程度

网页内容：
{content}

请只返回 JSON，不要有其他文字。"""
    
    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """
        解析 LLM 返回的 JSON 响应
        
        Args:
            text: 响应文本
            
        Returns:
            解析后的字典
        """
        # 去除可能的 markdown 代码块
        text = text.strip()
        if text.startswith("```"):
            # 去除开头的 ```json 或 ```
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines)
        
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON 解析失败: {e}\n原始文本: {text[:500]}")
            return {
                "is_relevant": False,
                "error": f"JSON 解析失败: {e}"
            }
    
    def generate_forum_post(
        self, 
        info: Dict[str, Any], 
        university: str, 
        source_url: str,
        source_title: str = ""
    ) -> Optional[str]:
        """
        生成适合论坛发布的帖子内容
        
        Args:
            info: 提取的招生信息
            university: 大学名称
            source_url: 原文链接
            source_title: 原文标题
            
        Returns:
            帖子内容，如果信息不相关则返回 None
        """
        if not info.get("is_relevant"):
            return None
        
        # 构建帖子内容
        lines = []
        
        # 标题行
        title = info.get("title", "招生信息更新")
        lines.append(f"# [{university}] {title}")
        lines.append("")
        
        # 信息摘要
        summary = info.get("summary", "")
        if summary:
            lines.append("📋 **信息摘要**")
            lines.append(summary)
            lines.append("")
        
        # 信息类型和学位
        info_type_map = {
            "admission": "招生简章",
            "enrollment": "录取通知",
            "deadline": "截止日期",
            "scholarship": "奖学金",
            "other": "其他"
        }
        degree_map = {
            "undergraduate": "本科",
            "master": "硕士",
            "phd": "博士",
            "all": "全学位"
        }
        
        info_type = info_type_map.get(info.get("info_type", "other"), "其他")
        degree = degree_map.get(info.get("degree_level", "all"), "全学位")
        
        lines.append(f"📌 **信息类型**：{info_type}")
        lines.append(f"🎓 **学位层次**：{degree}")
        lines.append("")
        
        # 关键日期
        key_dates = info.get("key_dates", [])
        if key_dates:
            lines.append("📅 **重要日期**")
            for date_item in key_dates:
                event = date_item.get("event", "")
                date = date_item.get("date", "")
                if event and date:
                    lines.append(f"- {event}：{date}")
            lines.append("")
        
        # 申请要求
        requirements = info.get("requirements", [])
        if requirements:
            lines.append("📝 **申请要求**")
            for req in requirements:
                lines.append(f"- {req}")
            lines.append("")
        
        # 奖学金信息
        scholarship = info.get("scholarship_info", "")
        if scholarship:
            lines.append(f"💰 **奖学金**：{scholarship}")
            lines.append("")
        
        # 联系邮箱
        contact = info.get("contact_email", "")
        if contact:
            lines.append(f"📧 **联系方式**：{contact}")
            lines.append("")
        
        # 原文链接
        lines.append(f"🔗 **原文链接**：[点击查看]({source_url})")
        
        # 原文标题（如果有）
        if source_title:
            lines.append(f"📄 **原文标题**：{source_title}")
        
        # 自动发布标识
        lines.append("")
        lines.append("---")
        lines.append("*本帖由系统自动采集发布*")
        
        return "\n".join(lines)
    
    def batch_process(
        self, 
        scrape_results: list,
        confidence_threshold: float = 0.7
    ) -> list:
        """
        批量处理爬取结果
        
        Args:
            scrape_results: 爬虫结果列表
            confidence_threshold: 置信度阈值
            
        Returns:
            处理后的结果列表
        """
        processed = []
        
        for result in scrape_results:
            if not result.get("success"):
                continue
            
            university = result.get("university", "Unknown")
            content = result.get("content", "")
            
            if not content:
                continue
            
            # 调用 DeepSeek 提取信息
            info = self.extract_info(content, university)
            
            # 检查置信度
            if info.get("confidence", 0) < confidence_threshold:
                logger.info(f"{university} 置信度不足，跳过")
                continue
            
            # 生成论坛帖子
            post_content = self.generate_forum_post(
                info,
                university,
                result.get("url", ""),
                result.get("title", "")
            )
            
            if post_content:
                processed.append({
                    "university": university,
                    "url": result.get("url"),
                    "info": info,
                    "post_content": post_content,
                    "title": f"[{university}] {info.get('title', '招生信息更新')}"
                })
        
        return processed
