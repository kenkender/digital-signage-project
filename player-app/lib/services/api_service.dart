import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl =
      "https://digital-signage-project.onrender.com";

  // ---------------------------------------------------------
  // FETCH PLAYLIST (GET)
  // ---------------------------------------------------------
  static Future<List<dynamic>> fetchPlaylist() async {
    final url = Uri.parse("$baseUrl/api/content");

    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded is List) return decoded;
        if (decoded is Map && decoded["items"] is List) {
          // เผื่อ backend ปรับเป็น { items: [...] }
          return decoded["items"] as List<dynamic>;
        }
        throw Exception("Unexpected playlist payload");
      } else {
        throw Exception("Server error: ${response.statusCode}");
      }
    } catch (e) {
      throw Exception("Failed to fetch playlist: $e");
    }
  }

  // ---------------------------------------------------------
  // CONTROL STATE (สำหรับ realtime control dashboard)
  // ---------------------------------------------------------
  static Future<Map<String, dynamic>> fetchControlState() async {
    final url = Uri.parse("$baseUrl/api/control/state");
    final response = await http.get(url);
    if (response.statusCode != 200) {
      throw Exception("Failed to fetch control state");
    }
    final decoded = jsonDecode(response.body);
    if (decoded is Map<String, dynamic>) return decoded;
    throw Exception("Unexpected control payload");
  }

  static Future<void> clearControlState() async {
    final url = Uri.parse("$baseUrl/api/control/clear");
    await http.post(url);
  }

  // ---------------------------------------------------------
  // UPLOAD FILE (ภาพ/วิดีโอ)
  // ---------------------------------------------------------
  static Future<bool> uploadFile(String path) async {
    final url = Uri.parse("$baseUrl/api/upload");

    try {
      final req = http.MultipartRequest("POST", url);
      req.files.add(await http.MultipartFile.fromPath("file", path));

      final res = await req.send();

      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // ---------------------------------------------------------
  // ADD YOUTUBE LINK
  // ---------------------------------------------------------
  static Future<bool> addYouTube(String url) async {
    final apiUrl = Uri.parse("$baseUrl/api/youtube");

    try {
      final res = await http.post(
        apiUrl,
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"url": url}),
      );

      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // ---------------------------------------------------------
  // PUBLISH VERSION (ใช้เช็คว่ามีการกดส่งจากฝั่ง admin หรือไม่)
  // ---------------------------------------------------------
  static Future<int> fetchPublishVersion() async {
    final url = Uri.parse("$baseUrl/api/publish/version");

    final response = await http.get(url);
    if (response.statusCode != 200) {
      throw Exception("Failed to fetch publish version");
    }

    final decoded = jsonDecode(response.body);
    final version = decoded["version"];
    if (version is int) return version;
    if (version is double) return version.toInt();
    throw Exception("Unexpected publish version payload");
  }
}
