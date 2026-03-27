import asyncio
from typing import Dict

class NotificationStreamManager:
    def __init__(self):
        self.queues: Dict[int, asyncio.Queue] = {}

    async def subscribe(self, user_id: int):
        if user_id not in self.queues:
            self.queues[user_id] = asyncio.Queue()
        return self.queues[user_id]

    async def notify(self, user_id: int):
        # Notify specific user
        if user_id in self.queues:
            await self.queues[user_id].put("ping")

# Global instance
sse_manager = NotificationStreamManager()
