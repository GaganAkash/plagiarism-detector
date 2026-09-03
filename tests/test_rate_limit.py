from unittest.mock import Mock

import pytest

from app.api.rate_limit import rate_limit


def _req(ip="1.2.3.4"):
    req = Mock()
    req.client.host = ip
    return req


def test_rate_limit_allows_under_limit_and_blocks_over():
    dep = rate_limit(limit=3, window=60)
    for _ in range(3):
        dep(_req())
    with pytest.raises(Exception) as e:
        dep(_req())
    assert "Too many requests" in str(e.value.detail)


def test_rate_limit_is_per_ip():
    dep = rate_limit(limit=2, window=60)
    dep(_req("1.1.1.1"))
    dep(_req("1.1.1.1"))
    # different IP unaffected
    dep(_req("2.2.2.2"))
    dep(_req("2.2.2.2"))
