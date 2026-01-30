from __future__ import annotations
from typing import Dict, Any
from llama_index.core.tools import FunctionTool

async def _shop_online(product: str, quantity: int) -> Dict[str, Any]:
    return {"ok": True, "message": f"Would buy {quantity} x {product} (demo stub)"}

shop_online_li = FunctionTool.from_defaults(
    name="shop_online",
    description="Demo purchase tool (stub).",
    fn=_shop_online,
)
