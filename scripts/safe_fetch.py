"""Bounded HTTPS ingestion with explicit hosts and no unchecked redirect following.

Direct connections pin validated public DNS addresses until TLS connects. Inherited
HTTP(S) proxies remain in use; an operator-provided proxy is a trusted transport
and must enforce public-destination egress itself, including DNS rebinding.
"""
import http.client
import ipaddress
import json
import re
import socket
import ssl
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass

WIKIMEDIA_HOSTS = frozenset({"en.wikipedia.org", "commons.wikimedia.org", "upload.wikimedia.org"})
GEOGRAPHY_HOSTS = frozenset({"www.geoboundaries.org", "geoboundaries.org", "github.com", "raw.githubusercontent.com", "media.githubusercontent.com"})
HEADERS = {"User-Agent": "Citylit/1.0 (https://github.com/thembaxx/citylit) public source research", "Accept-Encoding": "identity"}


def public_host(url):
    if not isinstance(url, str) or len(url) > 4096 or re.search(r"[\x00-\x20\x7f]", url):
        raise ValueError("Invalid source URL")
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.username or parsed.password or parsed.port not in (None, 443):
        raise ValueError("Only credential-free HTTPS on the standard port is allowed")
    host = (parsed.hostname or "").encode("idna").decode("ascii").lower().rstrip(".")
    if not re.fullmatch(r"[a-z0-9-]+(?:\.[a-z0-9-]+)+", host) or re.search(r"(?:^|\.)(?:localhost|local|internal|invalid|test)$", host):
        raise ValueError("A public DNS hostname is required")
    try:
        ipaddress.ip_address(host)
    except ValueError:
        return host
    raise ValueError("IP-literal sources are not allowed")


def public_addresses(host, port=443):
    addresses = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    def is_public(address):
        value = ipaddress.ip_address(address[4][0])
        return value.is_global and not value.is_multicast
    if not addresses or not all(is_public(address) for address in addresses):
        raise ValueError("Source DNS includes a non-public address")
    return addresses


class PublicHTTPSConnection(http.client.HTTPSConnection):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._create_connection = self._connect_public

    def _connect_public(self, address, timeout=socket._GLOBAL_DEFAULT_TIMEOUT, source_address=None):
        if self._tunnel_host:
            # Preserve the configured proxy, including its authentication and CA trust.
            # The trusted proxy owns its destination resolution/egress policy.
            public_addresses(self._tunnel_host, self._tunnel_port)
            return socket.create_connection(address, timeout, source_address)
        addresses = public_addresses(address[0], address[1])
        last_error = None
        for family, kind, protocol, _, destination in addresses:
            connection = socket.socket(family, kind, protocol)
            try:
                if timeout is not socket._GLOBAL_DEFAULT_TIMEOUT:
                    connection.settimeout(timeout)
                if source_address:
                    connection.bind(source_address)
                # Connect to this validated numeric address, with no second DNS lookup.
                connection.connect(destination)
                return connection
            except OSError as error:
                connection.close()
                last_error = error
        raise last_error or OSError("No public address could be connected")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class PublicHTTPSHandler(urllib.request.HTTPSHandler):
    def https_open(self, request):
        return self.do_open(PublicHTTPSConnection, request, context=self._context)


@dataclass(frozen=True)
class FetchResult:
    body: bytes
    url: str
    status: int


def fetch_bytes(url, *, allowed_hosts, max_bytes=4 * 1024 * 1024, timeout=25, allow_prefix=False):
    if not 0 < max_bytes <= 32 * 1024 * 1024:
        raise ValueError("Invalid source size budget")
    opener = urllib.request.build_opener(NoRedirect(), PublicHTTPSHandler(context=ssl.create_default_context()))
    current = url
    for hop in range(4):
        host = public_host(current)
        if host not in allowed_hosts:
            raise ValueError("Unapproved source or redirect host")
        public_addresses(host)
        request = urllib.request.Request(current, headers=HEADERS)
        try:
            response = opener.open(request, timeout=timeout)
        except urllib.error.HTTPError as error:
            if error.code not in (301, 302, 303, 307, 308):
                raise
            location = error.headers.get("Location")
            error.close()
            if not location or hop == 3:
                raise ValueError("Missing redirect location or redirect limit reached") from None
            current = urllib.parse.urljoin(current, location)
            continue
        with response:
            if response.headers.get("Content-Encoding", "identity").lower() not in ("", "identity"):
                raise ValueError("Encoded source bodies are not accepted")
            length = response.headers.get("Content-Length")
            if not allow_prefix and length and int(length) > max_bytes:
                raise ValueError("Source exceeds its byte budget")
            body = response.read(max_bytes + 1)
            if len(body) > max_bytes and not allow_prefix:
                raise ValueError("Source exceeds its byte budget")
            return FetchResult(body[:max_bytes], current, response.status)
    raise ValueError("Redirect limit reached")


def fetch_json(url, *, allowed_hosts, max_bytes=4 * 1024 * 1024, timeout=25):
    return json.loads(fetch_bytes(url, allowed_hosts=allowed_hosts, max_bytes=max_bytes, timeout=timeout).body)
