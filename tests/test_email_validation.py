import pytest

from app.api.auth import validate_email


@pytest.mark.parametrize(
    "email,expected",
    [
        ("user@example.com", True),
        ("first.last+tag@sub.domain.co", True),
        ("", False),
        ("notanemail", False),
        ("a@b", False),  # no dot in domain
        ("Foo <user@example.com>", False),  # display-name form not allowed
        ("user@@example.com", False),
        ("@example.com", False),  # no local part
        ("user@", False),  # no domain
    ],
)
def test_validate_email(email, expected):
    assert validate_email(email) is expected
