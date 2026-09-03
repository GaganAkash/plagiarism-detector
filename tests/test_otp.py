from app.services import otp


def test_otp_roundtrip():
    code = otp.generate("  User@Example.com ")
    assert otp.verify("USER@example.com", code) is True


def test_otp_wrong_code_fails():
    otp.generate("a@example.com")
    assert otp.verify("a@example.com", "000000") is False
    # correct code still works after a wrong attempt
    code = otp.generate("a@example.com")
    otp.verify("a@example.com", "999999")
    assert otp.verify("a@example.com", code) is True


def test_otp_unknown_email_fails():
    assert otp.verify("nobody@example.com", "123456") is False
