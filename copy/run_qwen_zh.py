# ========= Copyright 2023-2024 @ CAMEL-AI.org. All Rights Reserved. =========
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ========= Copyright 2023-2024 @ CAMEL-AI.org. All Rights Reserved. =========

# To run this file, you need to configure the Qwen API key
# You can obtain your API key from Bailian platform: bailian.console.aliyun.com
# Set it as QWEN_API_KEY="your-api-key" in your .env file or add it to your environment variables

import sys
import pathlib

sys.path.append('D:\study\cPilot\cPilot_v1')

from dotenv import load_dotenv
from pilot.models import ModelFactory
from pilot.toolkits import (
    CodeExecutionToolkit,
    ExcelToolkit,
    ImageAnalysisToolkit,
    SearchToolkit,
    BrowserToolkit,
    FileWriteToolkit,
    WeChatToolkit,
    WeMeetToolkit,
    WeatherToolkit,
    ArxivToolkit,
    GoogleScholarToolkit,
)
from pilot.types import ModelPlatformType, ModelType
from pilot.societies import RolePlaying

from pilot.utils.arxiv_fast_tool_selector_new import create_arxiv_fast_tool_selector
from pilot.toolkits.action_toolkit import ActionToolkit
from pilot.toolkits.wechat_toolkit import WeChatToolkit
from pilot.toolkits.wemeet_toolkit import WeMeetToolkit
# from information_extractor_toolkit import InformationExtractorToolkit


from cPilot.utils import run_society, DocumentProcessingToolkit

from pilot.logger import set_log_level

base_dir = pathlib.Path(__file__).parent.parent
env_path = base_dir / "cPilot" / ".env"
load_dotenv(dotenv_path=str(env_path))

set_log_level(level="DEBUG")

def is_arxiv_task(question: str) -> bool:
    """判断是否为arxiv相关任务"""
    arxiv_indicators = [
        'arxiv', '论文', 'paper', 'papers', '搜索', '下载', 'search', 'download',
        '学术', 'academic', '研究', 'research', '发表', 'published', '最新', 'latest'
    ]
    
    question_lower = question.lower()
    return any(indicator in question_lower for indicator in arxiv_indicators)

def handle_arxiv_task_directly(question: str) -> str:
    """直接使用Fast Tool Selector处理arxiv任务"""
    # logger.info("Using Arxiv Fast Tool Selector for direct handling")
    
    # 创建arxiv fast tool selector
    fast_selector = create_arxiv_fast_tool_selector(output_dir="fast_arxiv_results_")
    
    # 直接处理任务
    result = fast_selector.handle_arxiv_task(question)
    
    if result["success"]:
        response = f"""✅ Arxiv任务执行成功！

📊 任务结果:
- 找到论文: {result['papers_found']} 篇
- 下载状态: {result['papers_downloaded']}
- 输出目录: {result['output_directory']}
- 查询词: {result['query']}
"""
        
        if result.get('excel_created'):
            response += f"- Excel文件: {result['excel_created']}\n"

        response += "\n📚 论文列表:\n"
        for i, paper in enumerate(result['search_results'][:5], 1):  # 显示前5篇
            response += f"{i}. {paper['title']}\n"
            response += f"   📅 发表时间: {paper['published_date']}\n"
            response += f"   👥 作者: {', '.join(paper['authors'][:3])}{'...' if len(paper['authors']) > 3 else ''}\n"
            response += f"   🔗 ArXiv ID: {paper['entry_id'].split('/')[-1] if paper.get('entry_id') else 'N/A'}\n\n"
        
        if len(result['search_results']) > 5:
            response += f"... 还有 {len(result['search_results']) - 5} 篇论文，详情请查看Excel文件\n"
        
        return response
    else:
        return f"❌ Arxiv任务执行失败: {result.get('error', '未知错误')}"

def construct_society(question: str) -> RolePlaying:
    """
    Construct a society of agents based on the given question.

    Args:
        question (str): The task or question to be addressed by the society.

    Returns:
        RolePlaying: A configured society of agents ready to address the question.
    """

    # Create models for different components
    models = {
        "user": ModelFactory.create(
            model_platform=ModelPlatformType.QWEN,
            model_type=ModelType.QWEN_MAX,
            model_config_dict={"temperature": 0},
        ),
        "assistant": ModelFactory.create(
            model_platform=ModelPlatformType.QWEN,
            model_type=ModelType.QWEN_MAX,
            model_config_dict={"temperature": 0},
        ),
        "browsing": ModelFactory.create(
            model_platform=ModelPlatformType.QWEN,
            model_type=ModelType.QWEN_VL_MAX,
            model_config_dict={"temperature": 0},
        ),
        "planning": ModelFactory.create(
            model_platform=ModelPlatformType.QWEN,
            model_type=ModelType.QWEN_MAX,
            model_config_dict={"temperature": 0},
        ),
        "video": ModelFactory.create(
            model_platform=ModelPlatformType.QWEN,
            model_type=ModelType.QWEN_VL_MAX,
            model_config_dict={"temperature": 0},
        ),
        "image": ModelFactory.create(
            model_platform=ModelPlatformType.QWEN,
            model_type=ModelType.QWEN_VL_MAX,
            model_config_dict={"temperature": 0},
        ),
        "document": ModelFactory.create(
            model_platform=ModelPlatformType.QWEN,
            model_type=ModelType.QWEN_VL_MAX,
            model_config_dict={"temperature": 0},
        ),
    }

    # Configure toolkits
    tools = [
        # *BrowserToolkit(
        #     headless=False,  # Set to True for headless mode (e.g., on remote servers)
        #     web_agent_model=models["browsing"],
        #     planning_agent_model=models["planning"],
        #     output_language="Chinese",
        # ).get_tools(),
        # *VideoAnalysisToolkit(model=models["video"]).get_tools(),
        # *CodeExecutionToolkit(sandbox="subprocess", verbose=True).get_tools(),
        # *ImageAnalysisToolkit(model=models["image"]).get_tools(),
        # SearchToolkit().search_duckduckgo,
        # SearchToolkit().search_google,  # Comment this out if you don't have google search
        # SearchToolkit().search_wiki,
        # SearchToolkit().search_baidu,
        # *ExcelToolkit().get_tools(),
        # *WeatherToolkit().get_tools(),
        # *DocumentProcessingToolkit(model=models["document"]).get_tools(),
        # *FileWriteToolkit(output_dir="D:\Research_Study\src\paper_download").get_tools(),
        *WeMeetToolkit().get_tools(),
        *WeChatToolkit(wechat_path="C:\Program Files\Tencent\WeChat\WeChat.exe").get_tools(),
        # *ArxivToolkit().get_tools(),
        # *GoogleScholarToolkit(author_identifier='https://scholar.google.com/citations?user=fMASH0kAAAAJ&hl=zh-CN').get_tools(),
        *ActionToolkit().get_tools(),
    ]

    # Configure agent roles and parameters
    user_agent_kwargs = {"model": models["user"]}
    assistant_agent_kwargs = {"model": models["assistant"], "tools": tools}

    # Configure task parameters
    task_kwargs = {
        "task_prompt": question,
        "with_task_specify": False,
    }

    # Create and return the society
    society = RolePlaying(
        **task_kwargs,
        user_role_name="user",
        user_agent_kwargs=user_agent_kwargs,
        assistant_role_name="assistant",
        assistant_agent_kwargs=assistant_agent_kwargs,
        output_language="Chinese",
    )

    return society



def main(default_task=None , log_callback = None , task_complete_callback = None):
    r"""Main function to run the cPilot system with an example question."""
    # Default research question
    simple_task = "打开微信"
    # simple_task = "Open Brave search, summarize the github stars, fork counts, etc. of camel-ai's camel framework, and write the numbers into a python file using the plot package, save it locally, and run the generated python file. Note: You have been provided with the necessary tools to complete this task."

    # Override default task if command line argument is provided
    task = sys.argv[1] if len(sys.argv) > 1 else default_task

    task = default_task if default_task != None else simple_task
    
    society = construct_society(task)
    
    answer, chat_history, token_count = run_society(society, log_callback=log_callback, task_complete_callback=task_complete_callback)

    # Output the result
    print(f"\033[94mAnswer: {answer}\033[0m")
    
    # Return the result for WebSocket callback
    return {
        "answer": answer,
        "chat_history": chat_history,
        "token_count": token_count,
        "status": "success"
    }


if __name__ == "__main__":
    main()
