# Convo Splitter (Robert)
UI: Three panels. Sidebar (with projects, create new project button at the top, settings button in the bottom), main panel (shows transcript of a given recording + play / pause at the bottom), side panel (blank until you select a segment of the main recording or otherwise select a snippet, then shows *inspect* options, like download etc.). You can click to toggle the main panel between *transcript* view and *extracted snippets* view.

Supports the following:
* In the settings, you're required to specify an elevenlabs api key
* You click "new project" and upload an audio file. It gets transcribed. That becomes a permanent new project (named after your audio file).
* Transcribe it
* There's a little project settings icon in the main panel where you can click and map each speaker to their names (e.g. Speaker 1 => "Robert").
* You can highlight segments in the main panel and then that snippet will appear in the side panel. There, you can click a button to download the snippet, save the snippet to the project, etc.