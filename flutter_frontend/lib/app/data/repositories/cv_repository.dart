import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import '../models/cv_models.dart';

class CvRepository {
  const CvRepository();

  Future<CvData> loadCv() async {
    final raw = await rootBundle.loadString('assets/data/cv_data.json');
    final jsonMap = jsonDecode(raw) as Map<String, dynamic>;
    return CvData.fromJson(jsonMap);
  }
}
