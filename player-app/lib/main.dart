import 'package:flutter/material.dart';
import 'screens/player_screen.dart';

void main() {
  runApp(const MyDigitalSignageApp());
}

class MyDigitalSignageApp extends StatelessWidget {
  const MyDigitalSignageApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Digital Signage Player',
      debugShowCheckedModeBanner: false,
      home: PlayerScreen(),
    );
  }
}
