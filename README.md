# StreamBot

This is a Discord selfbot that allows streaming videos, and streams from YouTube and direct links to a Discord voice channel.

## 🧐Features

- Stream videos from a local folder.
- Stream and search for YouTube videos using titles.
- Stream YouTube videos/live streams by link.
- Stream arbitrary links (video files, live streams, etc.).
- Playback commands: play, playlink, ytplay, pause, resume, stop.
- List available videos.
- Refresh the video list.
- Get playback status.

## Requirements
[node.js](https://nodejs.org/) _(version 16.9.0 or later)_  
[ffmpeg](https://www.ffmpeg.org/) _(must be added to path or installed to working directory)_

## 🛠️ Installation Steps:


```
play <video name> - Play a video from the local folder.
playlink <url> - Play a (YouTube video/live stream, direct link).
ytplay <query> - Play a YouTube video from a title query.
ytsearch <query> - Search for a YouTube video using a title query.
stop - Stop the current playback.
pause - Pause the current playback.
resume - Resume playback.
list - List available videos.
refresh - Refresh the video list.
status - Get current playback status.
preview <video name> - Generate and obtain preview thumbnails of a specific video.
help - Show help message.
```

## 🛠️ Configuration

Configuration is done via `.env`:

```bash
# Selfbot options
TOKEN = "" # Your Discord self-bot token
PREFIX = "$" # The prefix used to trigger your self-bot commands
GUILD_ID = "" # The ID of the Discord server your self-bot will be running on
COMMAND_CHANNEL_ID = "" # The ID of the Discord channel where your self-bot will respond to commands
VIDEO_CHANNEL_ID = "" # The ID of the Discord voice/video channel where your self-bot will stream videos
ADMIN_IDS = [""] # A list of Discord user IDs that are considered administrators for your self-bot (not implemented yet)
VIDEOS_FOLDER = "./videos" # The local path where you store video files
PREVIEW_CACHE = "/tmp/preview-cache" # The local path where your self-bot will cache video preview thumbnails

# Stream options
STREAM_WIDTH = "1280" # The width of the video stream in pixels
STREAM_HEIGHT = "720" # The height of the video stream in pixels
STREAM_FPS = "30" # The frames per second (FPS) of the video stream
STREAM_BITRATE_KBPS = "1000" # The bitrate of the video stream in kilobits per second (Kbps)
STREAM_MAX_BITRATE_KBPS = "2500" # The maximum bitrate of the video stream in kilobits per second (Kbps)
STREAM_HARDWARE_ACCELERATION = "false" # Whether to use hardware acceleration for video decoding, set to "true" to enable, "false" to disable
STREAM_VIDEO_CODEC = "H264" # The video codec to use for the stream, can be "H264" or "H265" or "VP8"

# Videos server options
SERVER_ENABLED = "false" # Whether to enable the built-in video server
SERVER_USERNAME = "admin" # The username for the video server's admin interface
SERVER_PASSWORD = "admin" # The password for the video server's admin interface
SERVER_PORT = "8080" # The port number the video server will listen on
```

## Get Token ?
Get Token ?
1. You should create a Discord user for the bot.
2. Log in from your browser.
3. Open browser devtools and run the code (Discord Console - [Ctrl + Shift + I]).
```js
window.webpackChunkdiscord_app.push([
  [Math.random()],
  {},
  req => {
    if (!req.c) return;
    for (const m of Object.keys(req.c)
      .map(x => req.c[x].exports)
      .filter(x => x)) {
      if (m.default && m.default.getToken !== undefined) {
        return copy(m.default.getToken());
      }
      if (m.getToken !== undefined) {
        return copy(m.getToken());
      }
    }
  },
]);
console.log('%cWorked!', 'font-size: 50px');
console.log(`%cYou now have your token in the clipboard!`, 'font-size: 16px');
```
## Server

An optional basic HTTP server can be enabled to manage the video library:

- List videos
- Upload videos
- Delete videos
- Generate video preview thumbnails

Protected by HTTP basic auth.

## Todo

- [x]  Adding ytsearch and ytplay commands   

# Contributing
Public contributions are welcome!  
You can create a [new issue](https://github.com/ysdragon/StreamBot/issues/new) for bugs, or feel free to open a [pull request](https://github.com/ysdragon/StreamBot/pulls) for any and all your changes or work-in-progress features.


## Legal

This bot may violate Discord's Terms of Service. Use at your own risk.

## إبراء الذمة
أتبرأ من أي استخدام غير أخلاقي لهذا المشروع أمام الله.
## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/ysdragon/StreamBot/blob/main/LICENSE) file for details.
