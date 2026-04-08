import asyncio
from typing import Optional, List, Dict, Any
from contextlib import AsyncExitStack
import os

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


class MCPClient:
    def __init__(self, command: str, args: List[str]):
        # Initialize session and client objects
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.command = command
        self.args = args

    async def call_tool(self, tool_name: str, tool_args: Dict[str, Any]) -> str:
        call_tool_result = await self.session.call_tool(tool_name, tool_args)
        return call_tool_result.content[0].text

    async def connect_to_server(self):
        """Connect to the MCP server using the uv run command"""
        server_params = StdioServerParameters(
            command=self.command,
            args=self.args,
            env=None
        )

        stdio, write = await self.exit_stack.enter_async_context(stdio_client(server_params))
        self.session = await self.exit_stack.enter_async_context(ClientSession(stdio, write))
        await self.session.initialize()

    async def __aenter__(self):
        await self.connect_to_server()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.exit_stack.aclose()


# Example usage
if __name__ == "__main__":

    async def main():

        # 获取与当前脚本同目录下的 mcp_server.py 的绝对地址
        mcp_server_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "mcp_server.py"))

        # 启动 MCP Client 并调用 MCP Tool
        async with MCPClient("uv", ["run", mcp_server_path]) as client:
            result = await client.call_tool("search", { "query": "weather in New York"})
            print(result)

    asyncio.run(main())