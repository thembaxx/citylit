"""Install pinned Linux x64 CI tools after verifying release archive checksums."""
import argparse
import hashlib
import io
import pathlib
import platform
import tarfile
import urllib.request

TOOLS = {
    "actionlint": (
        "https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz",
        "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8",
    ),
    "gitleaks": (
        "https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz",
        "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb",
    ),
}
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("tool", choices=TOOLS)
    parser.add_argument("--dest", default=".ci-bin")
    args = parser.parse_args()
    if platform.system() != "Linux" or platform.machine() not in ("x86_64", "amd64"):
        raise SystemExit("These pinned archives target Linux x64 runners.")
    url, digest = TOOLS[args.tool]
    request = urllib.request.Request(url, headers={"User-Agent": "Citylit-CI"})
    with urllib.request.urlopen(request, timeout=60) as response:
        archive = response.read(32 * 1024 * 1024 + 1)
    if len(archive) > 32 * 1024 * 1024 or hashlib.sha256(archive).hexdigest() != digest:
        raise SystemExit("Tool archive size or checksum mismatch.")
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as bundle:
        # Read exactly one regular binary; never extract arbitrary archive paths.
        member = bundle.getmember(args.tool)
        if not member.isfile() or member.size > 32 * 1024 * 1024:
            raise SystemExit("Invalid tool archive member.")
        binary = bundle.extractfile(member).read()
    destination = pathlib.Path(args.dest)
    destination.mkdir(parents=True, exist_ok=True)
    executable = destination / args.tool
    executable.write_bytes(binary)
    executable.chmod(0o755)
    print(f"Installed checksum-verified {args.tool}: {executable}")

if __name__ == "__main__":
    main()
