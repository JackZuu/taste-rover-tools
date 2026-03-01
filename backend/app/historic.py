"""
Historic data module — Tasterover internal sales / performance data.

No data is currently available. This module exists as a placeholder
so the pipeline interface is complete; real data can be wired in later.
"""
from app.models import HistoricResult


def get_historic() -> HistoricResult:
    """
    Returns historic Tasterover performance data.
    Currently always returns "No data available".
    """
    return HistoricResult(message="No data available")


if __name__ == "__main__":
    print(get_historic().message)
