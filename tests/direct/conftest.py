"""
Pins the GenVM SDK version used by direct-mode tests.

genlayer-test's "latest" auto-resolution follows
github.com/genlayerlabs/genvm/releases/latest, which currently points at
v0.3.0-rc7. That pre-release does not ship a `genvm-universal.tar.xz` asset
under the name gltest's downloader expects, so every direct-mode test fails
before it even runs, with an unrelated-looking 404 during SDK download - not
a bug in this contract or these tests. v0.2.16 is the latest version that
does have a working `genvm-universal.tar.xz` asset, and this contract's
`Depends` header (py-genlayer:1jb45aa8...) already targets the pre-v0.3.0
API, so it's the correct pin, not just a workaround.

Overriding the `direct_deploy` fixture here (rather than passing
sdk_version="v0.2.16" on every call in every test) means the pin lives in
exactly one place.
"""

from typing import Any, Callable

import pytest

PINNED_SDK_VERSION = "v0.2.16"


@pytest.fixture
def direct_deploy(direct_deploy: Callable[..., Any]) -> Callable[..., Any]:
    def _deploy(contract_path: str, *args: Any, sdk_version: str | None = None, **kwargs: Any) -> Any:
        return direct_deploy(
            contract_path, *args, sdk_version=sdk_version or PINNED_SDK_VERSION, **kwargs
        )

    return _deploy
