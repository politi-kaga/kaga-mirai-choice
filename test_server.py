#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="/home/user/webapp/dist", **kwargs)
    
    def log_message(self, format, *args):
        sys.stdout.write(f"{self.log_date_time_string()} - {format%args}\n")
        sys.stdout.flush()

if __name__ == "__main__":
    port = 8080
    with socketserver.TCPServer(("0.0.0.0", port), CustomHandler) as httpd:
        print(f"Serving generated site at http://0.0.0.0:{port}/")
        print("Press Ctrl+C to stop the server")
        sys.stdout.flush()
        httpd.serve_forever()