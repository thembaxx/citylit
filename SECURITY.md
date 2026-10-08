# Security policy

The latest reviewed default-branch version of Citylit is supported. Update dependencies through review PRs and keep the lockfile committed.

Report vulnerabilities privately at https://github.com/thembaxx/citylit/security/advisories/new when private reporting is enabled. If the form is unavailable, email the repository owner's public GitHub contact at [mndebele.themba@gmail.com](mailto:mndebele.themba@gmail.com). Include affected versions and reproduction steps privately. This fallback address is published on https://github.com/thembaxx; the owner can replace it with a dedicated security address.

Never include active credentials in a public issue or PR. GitGuardian and the independent Gitleaks history scan detect committed secrets; GitHub native push protection is part of the owner setup. Revoke a leaked credential before removing it from history.

CI checks dependency advisories, source analysis with CodeQL, workflow security and browser regressions. Source crawling does not verify every venue fact; practical information keeps independent provenance and check dates.

See [repository automation](docs/repository-automation.md) for the enforced checks, owner setup and deployment process.
