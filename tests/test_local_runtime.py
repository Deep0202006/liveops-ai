import socket

from rul_predictor.local_runtime import port_is_available


def test_port_check_detects_conflict_without_killing_owner():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
        assert not port_is_available("127.0.0.1", port)
    assert port_is_available("127.0.0.1", port)
