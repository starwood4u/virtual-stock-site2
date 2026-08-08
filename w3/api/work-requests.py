"""
Created : 2026-08-08
Descript : ONVEST 업무요청(WR) 조회 API - Vercel Serverless Function 진입점
           GET /api/work-requests
           GET /api/work-requests?requestId={requestId}
           GET /api/work-requests?requestDpId={requestDpId}
"""
import json
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "work-requests.json"


def load_data():
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        request_id = query.get("requestId", [None])[0]
        request_dp_id = query.get("requestDpId", [None])[0]

        try:
            data = load_data()
        except (OSError, json.JSONDecodeError) as error:
            self._send_json({"error": f"데이터 조회 실패: {error}"}, status=500)
            return

        if request_id:
            result = next(
                (item for item in data["workRequests"] if item["requestId"] == request_id),
                None,
            )
            if result is None:
                self._send_json({"error": f"requestId={request_id} 조회 결과 없음"}, status=404)
                return
            self._send_json(result)
            return

        if request_dp_id:
            result = next(
                (item for item in data["developmentPlans"] if item["requestDpId"] == request_dp_id),
                None,
            )
            if result is None:
                self._send_json({"error": f"requestDpId={request_dp_id} 조회 결과 없음"}, status=404)
                return
            self._send_json(result)
            return

        self._send_json(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
