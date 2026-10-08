import io
import pathlib
import socket
import sys
import tempfile
import unittest
import urllib.error
from unittest.mock import Mock, patch
from PIL import Image
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import safe_fetch
from safe_images import save_photo

PUBLIC = [(socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, '', ('93.184.216.34', 443))]
PRIVATE = [(socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, '', ('127.0.0.1', 443))]


class Response(io.BytesIO):
    def __init__(self, body=b'{}', headers=None):
        super().__init__(body)
        self.status = 200
        self.headers = headers or {}


class FetchSecurityTests(unittest.TestCase):
    def test_disallowed_schemes_credentials_ports_and_local_hosts(self):
        for url in ['file:///tmp/source', 'http://venue.example', 'https://localhost/',
                    'https://127.0.0.1/', 'https://[::1]/', 'https://169.254.169.254/',
                    'https://fixture:fixture@venue.example/', 'https://venue.example:8080/',
                    'https://venue.local/', 'https://venue.example/\nheader', 'https://venue.example/has space']:
            with self.subTest(url=url), self.assertRaises(ValueError):
                safe_fetch.public_host(url)

    def test_mixed_private_dns_rejected_before_request(self):
        opener = Mock()
        with patch('safe_fetch.socket.getaddrinfo', return_value=PUBLIC + PRIVATE), patch('safe_fetch.urllib.request.build_opener', return_value=opener):
            with self.assertRaisesRegex(ValueError, 'non-public'):
                safe_fetch.fetch_bytes('https://venue.example/', allowed_hosts={'venue.example'})
        opener.open.assert_not_called()

    def test_multicast_dns_is_not_a_public_destination(self):
        answers = [(socket.AF_INET6, socket.SOCK_STREAM, socket.IPPROTO_TCP, '', ('ff02::1', 443, 0, 0))]
        with patch('safe_fetch.socket.getaddrinfo', return_value=answers):
            with self.assertRaisesRegex(ValueError, 'non-public'):
                safe_fetch.public_addresses('venue.example')

    def test_private_and_unapproved_redirects_are_never_requested(self):
        for target in ['https://127.0.0.1/', 'file:///tmp/source', 'https://other.example/', 'http://venue.example/']:
            with self.subTest(target=target):
                opener = Mock()
                opener.open.side_effect = urllib.error.HTTPError('https://venue.example/', 302, 'Moved', {'Location': target}, None)
                with patch('safe_fetch.socket.getaddrinfo', return_value=PUBLIC), patch('safe_fetch.urllib.request.build_opener', return_value=opener):
                    with self.assertRaises(ValueError):
                        safe_fetch.fetch_bytes('https://venue.example/', allowed_hosts={'venue.example'})
                self.assertEqual(opener.open.call_count, 1)

    def test_redirect_cap(self):
        opener = Mock()
        opener.open.side_effect = lambda *args, **kwargs: (_ for _ in ()).throw(urllib.error.HTTPError('https://venue.example/', 302, 'Moved', {'Location': '/next'}, None))
        with patch('safe_fetch.socket.getaddrinfo', return_value=PUBLIC), patch('safe_fetch.urllib.request.build_opener', return_value=opener):
            with self.assertRaisesRegex(ValueError, 'redirect limit'):
                safe_fetch.fetch_bytes('https://venue.example/', allowed_hosts={'venue.example'})
        self.assertEqual(opener.open.call_count, 4)

    def test_oversized_and_encoded_responses_rejected(self):
        for response in [Response(b'123456', {'Content-Length': '6'}), Response(b'123456'), Response(b'{}', {'Content-Encoding': 'gzip'})]:
            opener = Mock(); opener.open.return_value = response
            with patch('safe_fetch.socket.getaddrinfo', return_value=PUBLIC), patch('safe_fetch.urllib.request.build_opener', return_value=opener):
                with self.assertRaises(ValueError):
                    safe_fetch.fetch_bytes('https://venue.example/', allowed_hosts={'venue.example'}, max_bytes=5)

    def test_prefix_is_bounded_and_timeout_is_passed(self):
        opener = Mock(); opener.open.return_value = Response(b'0123456789', {'Content-Length': '10'})
        with patch('safe_fetch.socket.getaddrinfo', return_value=PUBLIC), patch('safe_fetch.urllib.request.build_opener', return_value=opener):
            result = safe_fetch.fetch_bytes('https://venue.example/', allowed_hosts={'venue.example'}, max_bytes=5, timeout=7, allow_prefix=True)
        self.assertEqual(result.body, b'01234')
        self.assertEqual(opener.open.call_args.kwargs['timeout'], 7)

    def test_direct_connection_pins_public_dns_without_resolving_again(self):
        connection = safe_fetch.PublicHTTPSConnection('venue.example')
        stream = Mock()
        with patch('safe_fetch.socket.getaddrinfo', side_effect=[PUBLIC, PRIVATE]) as resolve, patch('safe_fetch.socket.socket', return_value=stream):
            self.assertIs(connection._connect_public(('venue.example', 443), 5), stream)
        self.assertEqual(resolve.call_count, 1)
        stream.connect.assert_called_once_with(('93.184.216.34', 443))

    def test_direct_connection_rechecks_dns_at_connect_time(self):
        connection = safe_fetch.PublicHTTPSConnection('venue.example')
        with patch('safe_fetch.socket.getaddrinfo', return_value=PRIVATE), patch('safe_fetch.socket.socket') as create:
            with self.assertRaisesRegex(ValueError, 'non-public'):
                connection._connect_public(('venue.example', 443), 5)
        create.assert_not_called()

    def test_https_handler_preserves_verified_tls_context(self):
        import ssl
        context = ssl.create_default_context()
        handler = safe_fetch.PublicHTTPSHandler(context=context)
        request = safe_fetch.urllib.request.Request('https://venue.example/')
        with patch.object(handler, 'do_open', return_value='response') as open_request:
            self.assertEqual(handler.https_open(request), 'response')
        self.assertIs(open_request.call_args.kwargs['context'], context)
        self.assertTrue(context.check_hostname)
        self.assertEqual(context.verify_mode, ssl.CERT_REQUIRED)

    def test_explicit_proxy_transport_is_preserved_after_destination_validation(self):
        connection = safe_fetch.PublicHTTPSConnection('configured-proxy.example')
        connection.set_tunnel('venue.example', 443)
        stream = Mock()
        with patch('safe_fetch.socket.getaddrinfo', return_value=PUBLIC) as resolve, patch('safe_fetch.socket.create_connection', return_value=stream) as connect:
            self.assertIs(connection._connect_public(('configured-proxy.example', 443), 5), stream)
        resolve.assert_called_once_with('venue.example', 443, type=socket.SOCK_STREAM)
        connect.assert_called_once_with(('configured-proxy.example', 443), 5, None)

    def test_validated_source_json_is_decoded(self):
        opener = Mock(); opener.open.return_value = Response(b'{"source": "public"}')
        with patch('safe_fetch.socket.getaddrinfo', return_value=PUBLIC), patch('safe_fetch.urllib.request.build_opener', return_value=opener):
            self.assertEqual(safe_fetch.fetch_json('https://venue.example/', allowed_hosts={'venue.example'}), {'source': 'public'})


class ImageSecurityTests(unittest.TestCase):
    def test_safe_still_image_is_resized_and_written_as_jpeg(self):
        buffer = io.BytesIO(); Image.new('RGB', (1300, 10)).save(buffer, format='PNG')
        with tempfile.TemporaryDirectory() as directory:
            target = pathlib.Path(directory) / 'photo.jpg'; save_photo(buffer.getvalue(), target)
            with Image.open(target) as image:
                self.assertEqual(image.format, 'JPEG'); self.assertLessEqual(max(image.size), 1200)

    def test_pixel_bomb_is_rejected_before_decode(self):
        import struct, zlib
        buffer = io.BytesIO(); Image.new('RGB', (1, 1)).save(buffer, format='PNG')
        data = bytearray(buffer.getvalue()); data[16:24] = struct.pack('>II', 4000, 4000)
        data[29:33] = struct.pack('>I', zlib.crc32(data[12:29]))
        with self.assertRaisesRegex(ValueError, 'pixel budget'):
            save_photo(bytes(data), pathlib.Path('/tmp/unused-citylit-security-image.jpg'))

    def test_non_photo_format_rejected(self):
        buffer = io.BytesIO(); Image.new('RGB', (1, 1)).save(buffer, format='GIF')
        with self.assertRaisesRegex(ValueError, 'photographs'):
            save_photo(buffer.getvalue(), pathlib.Path('/tmp/unused-citylit-security-image.jpg'))

    def test_byte_budget_is_checked_before_image_parser(self):
        with patch('safe_images.Image.open') as parse:
            with self.assertRaisesRegex(ValueError, 'byte budget'):
                save_photo(b'x' * (12 * 1024 * 1024 + 1), pathlib.Path('/tmp/unused-citylit-security-image.jpg'))
        parse.assert_not_called()
