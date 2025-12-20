// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:cv_frontend/app/app.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App launches to Home', (WidgetTester tester) async {
    await tester.pumpWidget(const CvApp());
    await tester.pumpAndSettle();

    // The Home page uses the shared scaffold and shows the title 'Fanhouse'.
    expect(find.text('Fanhouse'), findsOneWidget);
  });
}
