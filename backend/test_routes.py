import unittest
from app import create_app

class BackendRouteTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_routes_registered(self):
        routes = [rule.rule for rule in self.app.url_map.iter_rules()]
        expected = [
            "/api/auth/me",
            "/api/auth/login",
            "/api/auth/register",
            "/api/classes",
            "/api/classes/<string:class_id>",
            "/api/classes/<string:class_id>/students",
            "/api/assignments",
            "/api/assignments/<string:assign_id>",
            "/api/assignments/<string:assign_id>/submit",
            "/api/materials",
            "/api/materials/<string:mat_id>",
            "/api/sessions",
            "/api/sessions/<string:session_id>",
            "/api/announcements",
            "/api/announcements/<string:ann_id>",
            "/api/attendance",
            "/api/attendance/session/<string:session_id>",
            "/api/attendance/me",
            "/api/submissions",
            "/api/submissions/<string:sub_id>/grade",
            "/api/submissions/me",
            "/api/students",
            "/api/students/<string:student_id>",
        ]
        for route in expected:
            self.assertIn(route, routes, f"Missing route: {route}")
        print("All backend endpoints registered correctly.")

    def test_unauthenticated_requests_reject_cleanly(self):
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.status_code, 401)

        res = self.client.get("/api/classes")
        self.assertEqual(res.status_code, 401)

        res = self.client.get("/api/assignments")
        self.assertEqual(res.status_code, 401)

        res = self.client.get("/api/materials")
        self.assertEqual(res.status_code, 401)

        res = self.client.get("/api/sessions")
        self.assertEqual(res.status_code, 401)

        res = self.client.get("/api/announcements")
        self.assertEqual(res.status_code, 401)

        res = self.client.get("/api/attendance")
        self.assertEqual(res.status_code, 401)

        print("Auth protection verified on all protected endpoints.")

if __name__ == "__main__":
    unittest.main()
