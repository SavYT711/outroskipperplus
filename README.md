# Jellyfin Outro Skipper Plus

A Jellyfin plugin that detects outro segments and gives you two options:
- **Skip the outro** instantly
- **Preview the next episode** in a mini-player while the outro plays

---

## Features

- Detects outros using chapter/marker data
- Skip Outro button appears automatically when the outro begins
- Mini-player preview of the next episode in the corner of the screen
- Countdown timer with optional auto-advance
- Suppressed automatically on the last episode of a series

---

## Requirements

- Jellyfin 10.11.x
- .NET 9
- Node.js (for building the client)

---

## Development Setup

### Server (C# / Rider)
1. Open `server/` in JetBrains Rider
2. Restore NuGet packages
3. Build the project

### Client (TypeScript / VS Code)
1. Open `client/` in VS Code
2. Run `npm install`
3. Run `npm run build` to compile

---

## Roadmap

- [x] Plugin entry point and configuration
- [x] Next episode API endpoint
- [x] TypeScript client setup
- [x] XHR interceptor for episode ID
- [x] Overlay UI injection
- [x] Skip Outro button
- [x] Next episode name showing correctly
- [x] Timing fixed (30s before end fallback)
- [x] Silent background preview player
- [x] Watch Now button
- [x] Dismiss button
- [x] Overlay dismisses on player close
- [x] Overlay dismisses on seek/pause
- [x] Last episode guard
- [ ] "Last episode" screen with random unwatched show/movie suggestion (Netflix-style)
- [ ] Option 2 — PiP swap mode (settings toggle)
- [ ] Real outro detection via chapter markers
- [ ] Countdown timer before auto-advancing
- [ ] Mobile/TV client support

---

## License

GPL-2.0 — matching Jellyfin. 
