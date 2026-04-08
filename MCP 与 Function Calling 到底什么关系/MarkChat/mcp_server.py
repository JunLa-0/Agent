from mcp.server.fastmcp import FastMCP


# Initialize FastMCP server
mcp = FastMCP("search_mcp_server", log_level="ERROR")


# Constants
@mcp.tool()
async def search(query: str) -> str:
    """搜索网络

    Args:
        query: 搜索内容
    """
    # 正常情况下，这里应该调用相关 API 做搜索，为了减少代码的复杂度，
    # 这里我们返回一段假的工具执行结果，用以测试
    return "来自 MCP Server 的答案：纽约市今天的天气是晴天，明天的天气是多云。"


if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='stdio')