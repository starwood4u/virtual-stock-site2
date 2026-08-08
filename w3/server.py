#!/usr/bin/env python3
"""
Created : 2026-08-08
Descript : ONVEST w3 - 업무요청 API 서버
           정적 파일(w2/w3)과 /w3/api/work-requests JSON API를 함께 서빙한다.
"""
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = Path(__file__).resolve().parent / "data" / "work-requests.json"
API_PATH = "/w3/api/work-requests"


def load_data():
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


class ApiHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == API_PATH:
            self.handle_api(parsed)
            return
        super().do_GET()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def handle_api(self, parsed):
        query = parse_qs(parsed.query)
        request_id = query.get("requestId", [None])[0]
        request_dp_id = query.get("requestDpId", [None])[0]

        try:
            data = load_data()
        except (OSError, json.JSONDecodeError) as error:
            self.send_json({"error": f"데이터 조회 실패: {error}"}, status=500)
            return

        if request_id:
            result = next(
                (item for item in data["workRequests"] if item["requestId"] == request_id),
                None,
            )
            if result is None:
                self.send_json({"error": f"requestId={request_id} 조회 결과 없음"}, status=404)
                return
            self.send_json(result)
            return

        if request_dp_id:
            result = next(
                (item for item in data["developmentPlans"] if item["requestDpId"] == request_dp_id),
                None,
            )
            if result is None:
                self.send_json({"error": f"requestDpId={request_dp_id} 조회 결과 없음"}, status=404)
                return
            self.send_json(result)
            return

        self.send_json(data)

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    port = 5500
    server = ThreadingHTTPServer(("127.0.0.1", port), ApiHandler)
    print(f"Serving {ROOT} on http://127.0.0.1:{port}")
    print(f"API: http://127.0.0.1:{port}{API_PATH}?requestId=WR0101")
    server.serve_forever()


if __name__ == "__main__":
    main()
