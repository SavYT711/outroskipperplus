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
- [ ] Playback position hook
- [ ] Overlay UI injection
- [ ] Mini-player preview
- [ ] Countdown timer + auto-advance
- [ ] Last episode guard

---

## License

GPL-2.0 — matching Jellyfin. 
