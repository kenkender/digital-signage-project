import 'dart:async';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../services/api_service.dart';

class PlayerScreen extends StatefulWidget {
  const PlayerScreen({super.key});

  @override
  PlayerScreenState createState() => PlayerScreenState();
}

class PlayerScreenState extends State<PlayerScreen> {
  List<dynamic> playlist = [];
  int currentIndex = 0;
  bool isLoading = true;
  String error = "";
  int publishVersion = 0;
  bool pollingStarted = false;
  int controlVersion = 0;
  bool isPaused = false;
  String overlayMessage = "";

  Timer? timer;
  Timer? versionTimer;
  Timer? controlTimer;
  WebViewController? youtubeController;
  VideoPlayerController? videoController;
  bool videoCompleted = false;

  int durationCounter = 0;

  @override
  void initState() {
    super.initState();
    loadPlaylist();
  }

  Future<void> loadPlaylist({bool fromPoll = false}) async {
    try {
      final data = await ApiService.fetchPlaylist(); // <-- now returns List
      final version = await ApiService.fetchPublishVersion();
      setState(() {
        playlist = data;
        isLoading = false;
        error = "";
        publishVersion = version;
        currentIndex = 0;
        durationCounter = 0;
      });

      if (playlist.isNotEmpty) {
        prepareCurrentItem();
      } else {
        timer?.cancel();
        youtubeController = null;
        videoController?.dispose();
        videoController = null;
      }

      if (!pollingStarted) {
        startVersionPolling();
      }

      // เริ่ม control polling ทันทีที่โหลด
      startControlPolling();
    } catch (e) {
      debugPrint("Error loading playlist: $e");
      setState(() {
        error = "โหลดเพลย์ลิสต์ไม่สำเร็จ: $e";
        isLoading = false;
      });
    }
  }

  void prepareCurrentItem() {
    timer?.cancel();
    durationCounter = 0;
    videoCompleted = false;
    youtubeController = null;

    if (playlist.isEmpty) return;

    final item = playlist[currentIndex];
    final type = (item["type"] ?? "").toString().toLowerCase();

    if (type == "video") {
      _playVideo(item["url"]);
    } else {
      videoController?.dispose();
      videoController = null;
      startTimedLoop();
    }
  }

  Future<void> _playVideo(String url) async {
    try {
      videoController?.dispose();
      final controller =
          VideoPlayerController.networkUrl(Uri.parse(buildFullUrl(url)));
      await controller.initialize();
      controller.setLooping(false);
      controller.addListener(() {
        if (!mounted || videoCompleted) return;
        final value = controller.value;
        if (value.hasError) {
          debugPrint("Video error: ${value.errorDescription ?? 'unknown'}");
          videoCompleted = true;
          goToNext();
          return;
        }
        if (value.isInitialized &&
            !value.isPlaying &&
            value.position >= value.duration) {
          videoCompleted = true;
          goToNext();
        }
      });
      await controller.play();

      if (!mounted) return;
      setState(() {
        videoController = controller;
      });
    } catch (e) {
      debugPrint("Video play error: $e");
      goToNext();
    }
  }

  void startTimedLoop() {
    timer?.cancel();

    timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (isPaused) return;

      final item = playlist[currentIndex];

      // 👇 duration รองรับทั้ง int และ string
      final duration = int.tryParse(
              (item["durationSeconds"] ?? item["duration"]).toString()) ??
          10;

      setState(() {
        durationCounter++;
      });

      if (durationCounter >= duration) {
        goToNext();
      }
    });
  }

  void goToNext() {
    if (playlist.isEmpty) return;
    durationCounter = 0;
    setState(() {
      currentIndex = (currentIndex + 1) % playlist.length;
    });
    prepareCurrentItem();
  }

  void goToPrev() {
    if (playlist.isEmpty) return;
    durationCounter = 0;
    setState(() {
      currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    });
    prepareCurrentItem();
  }

  void startVersionPolling() {
    pollingStarted = true;
    versionTimer?.cancel();
    versionTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
      try {
        final version = await ApiService.fetchPublishVersion();
        if (version > publishVersion) {
          publishVersion = version;
          await loadPlaylist(fromPoll: true);
        }
      } catch (e) {
        debugPrint("Version poll failed: $e");
      }
    });
  }

  void startControlPolling() {
    controlTimer?.cancel();
    controlTimer = Timer.periodic(const Duration(seconds: 2), (_) async {
      try {
        final state = await ApiService.fetchControlState();
        final versionRaw = state["version"];
        int version = 0;
        if (versionRaw is int) {
          version = versionRaw;
        } else if (versionRaw is double) {
          version = versionRaw.toInt();
        }

        if (version > controlVersion) {
          controlVersion = version;
          final cmd = state["command"];
          if (cmd is Map<String, dynamic>) {
            handleControlCommand(cmd);
          }
        }
      } catch (e) {
        debugPrint("Control poll failed: $e");
      }
    });
  }

  void handleControlCommand(Map<String, dynamic> cmd) {
    final type = (cmd["type"] ?? "").toString().toLowerCase();
    final payload = cmd["payload"] is Map<String, dynamic>
        ? cmd["payload"] as Map<String, dynamic>
        : <String, dynamic>{};

    switch (type) {
      case "play":
        setState(() {
          isPaused = false;
        });
        if (videoController != null && !videoController!.value.isPlaying) {
          videoController!.play();
        }
        break;
      case "pause":
        setState(() {
          isPaused = true;
        });
        if (videoController != null && videoController!.value.isPlaying) {
          videoController!.pause();
        }
        break;
      case "next":
        goToNext();
        break;
      case "prev":
        goToPrev();
        break;
      case "reload":
        loadPlaylist(fromPoll: true);
        break;
      case "jump":
        final idxRaw = payload["index"];
        int? idx;
        if (idxRaw is int) idx = idxRaw;
        if (idxRaw is double) idx = idxRaw.toInt();
        if (idx != null && idx >= 0 && idx < playlist.length) {
          durationCounter = 0;
          setState(() {
            currentIndex = idx!;
          });
          prepareCurrentItem();
        }
        break;
      case "show_message":
        final msg = payload["message"]?.toString() ?? "";
        setState(() {
          overlayMessage = msg;
        });
        break;
      case "clear_message":
        setState(() {
          overlayMessage = "";
        });
        break;
      default:
        break;
    }
  }

  Widget youtubePlayer(String url) {
    final embedUrl = url.replaceAll("watch?v=", "embed/");

    youtubeController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse(embedUrl));

    return WebViewWidget(controller: youtubeController!);
  }

  Widget imagePlayer(String url) {
    return Container(
      color: Colors.black,
      alignment: Alignment.center,
      child: Image.network(
        buildFullUrl(url),
        fit: BoxFit.contain, // ปรับให้พอดีจอไม่ล้น
        width: double.infinity,
        height: double.infinity,
        filterQuality: FilterQuality.high,
      ),
    );
  }

  Widget videoPlayerWidget() {
    final controller = videoController;
    if (controller == null || !controller.value.isInitialized) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    return FittedBox(
      fit: BoxFit.contain,
      child: SizedBox(
        width: controller.value.size.width,
        height: controller.value.size.height,
        child: VideoPlayer(controller),
      ),
    );
  }

  String buildFullUrl(String url) {
    if (url.startsWith("http")) return url;
    return "${ApiService.baseUrl}$url";
  }

  @override
  void dispose() {
    timer?.cancel();
    versionTimer?.cancel();
    controlTimer?.cancel();
    youtubeController = null;
    videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      );
    }

    if (error.isNotEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Text(
            error,
            style: const TextStyle(color: Colors.redAccent),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    if (playlist.isEmpty) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Text(
            "ไม่พบคอนเทนต์ในเพลย์ลิสต์",
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    final item = playlist[currentIndex];
    final type = (item["type"] ?? "").toString().toLowerCase();
    final isVideo = type == "video";

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          SizedBox.expand(
            child: (type == "youtube")
                ? youtubePlayer(item["url"])
                : isVideo
                    ? videoPlayerWidget()
                    : imagePlayer(item["url"]),
          ),
          if (overlayMessage.isNotEmpty)
            Positioned(
              bottom: 40,
              left: 16,
              right: 16,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white24),
                ),
                child: Text(
                  overlayMessage,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
