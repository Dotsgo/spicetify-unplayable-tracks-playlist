# Spicetify Playlist Unplayable Tracks

Spicetify context menu extension that gets adds buttons to (1) get all unplayable tracks from selected playlist and copy them to a new playlist and (2) remove all unplayable tracks from a playlist. Unplayable is per is_playable property of a track, meaning available/unavailable in the user's market (see full definition at https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks).

This will not include otherwise playable tracks from artists you have blocked using Spotify's built-in "Don't play this artist" feature. You also do not need to be the owner of the playlist to make a playlist of its unplayable tracks, but you do need to be the owner to remove them.

Can be installed from Spicetify Marketplace or manually below.

![sample](/sample1.png)
![sample](/sample2.png)

## Manual Installation

1. Install Spicetify: [https://spicetify.app/docs/installation](https://spicetify.app/docs/installation)
2. Download unplayableTracksPlaylist.js and put it in the Spicetify Extensions folder (find location using https://spicetify.app/docs/advanced-usage/extensions)
3. Open a terminal and run: `spicetify config extensions unplayableTracksPlaylist.js`
4. In the terminal, run: `spicetify apply`

## Updating

1. Download the new version of unplayableTracksPlaylist.js and put it in the Spicetify Extensions folder, overwriting the old version
2. Open a terminal and run: `spicetify apply`

## Manual Uninstallation

1. Open a terminal and run: `spicetify config extensions unplayableTracksPlaylist.js-`
2. In the terminal, run: `spicetify apply`
3. Delete unplayableTracksPlaylist.js from the Spicetify Extensions folder (if not deleted it will still no longer load in Spicetify at this point)

## Usage

Right click a playlist in your library, or open the playlist and click the three dots (...) button to open the context menu.

Click the menu option reading "Playlist from Unplayable (Unavailable) Tracks" or the one reading "Remove Unplayable (Unavailable) Tracks" and a notification should appear to indicate that the script has started. After completion, another notification will appear indicating success or failure.

Running is fast and shouldn't take more than a few seconds for a playlist of ~10,000 mostly playable tracks, though if there are thousands of unplayable tracks it make take a minute.
