# FanHouse Flutter Frontend

This is the mobile frontend for the FanHouse vertical slice, built with Flutter and GetX.

## Features

- **Authentication**: Login/Register with JWT.
- **Feed**: View posts, subscribe to creators, unlock PPV content.
- **Creator Dashboard**: Apply to become a creator, view status, create posts (Free, Subscriber-only, PPV).
- **Admin Panel**: Approve/Reject creators, view financial ledger.
- **Notifications**: Realtime updates for new posts, subscriptions, etc.

## Prerequisites

- Flutter SDK (>=3.3.0)
- Backend API running (usually on port 4000)

## Running the App

To run the app, you need to provide the API Base URL and optionally the Ably API Key for realtime features.

### Development

```bash
# Run on Windows/macOS/Linux
flutter run -d windows --dart-define=API_BASE_URL=http://localhost:4000 --dart-define=ABLY_API_KEY=your_ably_key_here

# Run on Android Emulator (ensure 10.0.2.2 points to localhost)
flutter run -d android --dart-define=API_BASE_URL=http://10.0.2.2:4000 --dart-define=ABLY_API_KEY=your_ably_key_here
```

### Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `API_BASE_URL` | URL of the backend API | `http://localhost:4000` |
| `ABLY_API_KEY` | API Key for Ably Realtime | Empty (Realtime disabled) |

## Project Structure

- `lib/app/modules`: Feature modules (Auth, Feed, Creator, Admin, Notifications).
- `lib/app/services`: Core services (API, Session, Realtime).
- `lib/app/widgets`: Reusable UI components.
- `lib/app/routes`: Navigation configuration.

## Testing

```bash
flutter test
```
