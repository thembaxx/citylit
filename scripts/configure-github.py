"""Review/apply Citylit repository settings with an owner-authorized gh login."""
import argparse
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

def api(repo, suffix, method="GET", payload=None):
    command = ["gh", "api", "--method", method, f"repos/{repo}{suffix}"]
    if payload is not None:
        command += ["--input", "-"]
    try:
        result = subprocess.run(
            command, input=json.dumps(payload) if payload is not None else None,
            capture_output=True, text=True, check=False, timeout=30,
        )
    except subprocess.TimeoutExpired as error:
        raise RuntimeError(f"GitHub API timed out after 30 seconds: {suffix or '/'}") from error
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return json.loads(result.stdout) if result.stdout.strip() else None

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default="thembaxx/citylit")
    parser.add_argument("--phase", choices=("bootstrap", "steady"), default="bootstrap")
    parser.add_argument("--require-approval", action="store_true",
                        help="Require one independent code-owner approval after adding a reviewer.")
    parser.add_argument("--apply", action="store_true", help="Otherwise print the exact plan only.")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", args.repo):
        parser.error("Use owner/repository.")
    filename = "main.json" if args.phase == "steady" else "main-bootstrap.json"
    policy = json.loads((ROOT / ".github/rulesets" / filename).read_text())
    if args.require_approval:
        pr_rule = next(rule for rule in policy["rules"] if rule["type"] == "pull_request")
        pr_rule["parameters"].update(
            required_approving_review_count=1,
            require_code_owner_review=True,
            require_last_push_approval=True,
        )
    settings = {
        "allow_squash_merge": True,
        "allow_merge_commit": False,
        "allow_rebase_merge": False,
        "delete_branch_on_merge": True,
        "allow_auto_merge": True,
    }
    requests = [
        ("Repository merge settings", "", "PATCH", settings),
        # GitHub combines Actions PR creation and review approval in one switch.
        ("Actions read default and catalog PR creation", "/actions/permissions/workflow", "PUT",
         {"default_workflow_permissions": "read", "can_approve_pull_request_reviews": True}),
        ("Dependabot alerts", "/vulnerability-alerts", "PUT", None),
        ("Dependabot security update PRs", "/automated-security-fixes", "PUT", None),
        ("Private vulnerability reports", "/private-vulnerability-reporting", "PUT", None),
        ("Native secret scanning and push protection", "", "PATCH",
         {"security_and_analysis": {
             "secret_scanning": {"status": "enabled"},
             "secret_scanning_push_protection": {"status": "enabled"},
         }}),
    ]
    if not args.apply:
        print(json.dumps({"repo": args.repo, "phase": args.phase,
                          "ruleset": policy, "settings": requests}, indent=2))
        print("Dry run only. Add --apply with an owner-authorized gh login.")
        return
    errors = []
    for label, suffix, method, payload in requests:
        try:
            api(args.repo, suffix, method, payload)
            print(f"Applied: {label}")
        except RuntimeError as error:
            errors.append(f"{label}: {error}")
    try:
        existing = api(args.repo, "/rulesets")
        match = next((rule for rule in existing if rule["name"] == policy["name"]), None)
        suffix = f"/rulesets/{match['id']}" if match else "/rulesets"
        response = api(args.repo, suffix, "PUT" if match else "POST", policy)
        actual = api(args.repo, f"/rulesets/{response['id']}")
        if actual.get("enforcement") != "active":
            raise RuntimeError("Ruleset is not active after applying.")
        print(f"Verified active main protection: ruleset {response['id']}")
    except RuntimeError as error:
        errors.append(f"Main protection: {error}")
    if errors:
        print("Some settings were not applied:", file=sys.stderr)
        for error in errors:
            print(error, file=sys.stderr)
        raise SystemExit(1)

if __name__ == "__main__":
    main()
