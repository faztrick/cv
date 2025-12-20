import 'package:collection/collection.dart';

class CvData {
  final PersonalInfo personal;

  final String summary;
  final Skills skills;
  final List<Experience> experience;
  final List<Project> projects;
  final List<String> keywords;
  final List<Education> education;
  CvData({
    required this.personal,
    required this.summary,
    required this.skills,
    required this.experience,
    required this.projects,
    required this.keywords,
    required this.education,
  });

  factory CvData.fromJson(Map<String, dynamic> json) {
    return CvData(
      personal: PersonalInfo.fromJson(json['personal'] ?? const {}),
      summary: json['summary']?.toString() ?? '',
      skills: Skills.fromJson(json['skills'] ?? const {}),
      experience: (json['experience'] as List<dynamic>? ?? [])
          .map((e) => Experience.fromJson(e as Map<String, dynamic>))
          .toList(),
      projects: (json['projects'] as List<dynamic>? ?? [])
          .map((e) => Project.fromJson(e as Map<String, dynamic>))
          .toList(),
      keywords:
          (json['keywords'] as List<dynamic>? ?? []).map((e) => '$e').toList(),
      education: (json['education'] as List<dynamic>? ?? [])
          .map((e) => Education.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class Education {
  final String? degree;

  final String? institution;
  final String? period;
  Education({this.degree, this.institution, this.period});

  factory Education.fromJson(Map<String, dynamic> json) => Education(
        degree: json['degree']?.toString(),
        institution: json['institution']?.toString(),
        period: json['period']?.toString(),
      );
}

class Experience {
  final String title;

  final String company;
  final String period;
  final List<String> responsibilities;
  Experience({
    required this.title,
    required this.company,
    required this.period,
    required this.responsibilities,
  });

  factory Experience.fromJson(Map<String, dynamic> json) {
    return Experience(
      title: json['title']?.toString() ?? '',
      company: json['company']?.toString() ?? '',
      period: json['period']?.toString() ?? '',
      responsibilities: (json['responsibilities'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
    );
  }
}

class PersonalInfo {
  final String name;

  final String title;
  final String location;
  final String phone;
  final String email;
  final String website;
  final String github;
  final String linkedin;
  PersonalInfo({
    required this.name,
    required this.title,
    required this.location,
    required this.phone,
    required this.email,
    required this.website,
    required this.github,
    required this.linkedin,
  });

  factory PersonalInfo.fromJson(Map<String, dynamic> json) {
    return PersonalInfo(
      name: json['name']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      website: json['website']?.toString() ?? '',
      github: json['github']?.toString() ?? '',
      linkedin: json['linkedin']?.toString() ?? '',
    );
  }
}

class Project {
  final String name;

  final String description;
  Project({required this.name, required this.description});

  factory Project.fromJson(Map<String, dynamic> json) => Project(
        name: json['name']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
      );
}

class Skills {
  final List<String> all;

  final List<String> languages;
  final List<String> frameworks;
  final List<String> ai;
  final List<String> iot;
  final List<String> networking;
  final List<String> database;
  final List<String> cloud;
  final List<String> automation;
  Skills({
    required this.all,
    required this.languages,
    required this.frameworks,
    required this.ai,
    required this.iot,
    required this.networking,
    required this.database,
    required this.cloud,
    required this.automation,
  });

  factory Skills.fromJson(Map<String, dynamic> json) {
    List<String> list(String key) =>
        (json[key] as List<dynamic>? ?? []).map((e) => '$e').toList();

    return Skills(
      all: list('all'),
      languages: list('languages'),
      frameworks: list('frameworks'),
      ai: list('ai'),
      iot: list('iot'),
      networking: list('networking'),
      database: list('database'),
      cloud: list('cloud'),
      automation: list('automation'),
    );
  }

  List<String> topSkills({int max = 10}) => all.take(max).toList();
}

extension ExperienceHelpers on List<Experience> {
  Experience? get current => firstOrNull;
}
