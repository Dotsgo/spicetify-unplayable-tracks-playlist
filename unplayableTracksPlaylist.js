/*
 * Spicetify Playlist Unplayable Tracks
 *
 * MIT License
 *
 * Copyright (c) 2025 Dotsgo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// 1. Function to create playlist from unplayable tracks
(function unplayableTracksPlaylist() {
  const {
    CosmosAsync,

    URI,
  } = Spicetify;
  if (!(CosmosAsync && URI)) {
    setTimeout(unplayableTracksPlaylist, 300);
    return;
  }

  const API_DELAY = 200; // Artificial delay in milliseconds between API calls

  const buttontxt = "Playlist from Unplayable (Unavailable) Tracks";

  async function makeunplayableTracksPlaylist(uris) {
    // Definitions

    const getPlaylistName = async () => {
      const playlistID = uris[0].split(":")[2];

      const response = await CosmosAsync.get(
        `https://api.spotify.com/v1/playlists/${playlistID}`
      );

      console.log("Playlist name response:", response);

      if (!response.name) {
        console.error("Error fetching playlist name");
        throw new Error(`Failed to fetch playlist name.`);
      }

      const playlistName = response.name;
      return playlistName;
    };

    async function getPlaylistTracks() {
      const uri = uris[0];
      const uriFinal = uri.split(":")[2];

      let offset = 0;
      let limit = 50;
      const TracksReceived = [];
      let response;
      console.log("Fetching tracks...");

      do {
        response = await CosmosAsync.get(
          `sp://core-playlist/v1/playlist/spotify:playlist:${uriFinal}/rows`
        );

        if (!response) {
          console.log("Failed to fetch playlist tracks.");
          throw new Error("Failed to fetch playlist tracks.");
        }
        TracksReceived.push(response.rows.map((track) => track));
        offset += limit;
        console.log("Fetching more...");
      } while (offset < response.total);
      console.log("Tracks Received: " + JSON.stringify(TracksReceived));
      const playlistTracks = TracksReceived.flat(Infinity);
      return playlistTracks;
    }

    function determineunplayableTracks(playlistTracks = []) {
      console.log(
        "Playlist Tracks passed to determiner: " +
          JSON.stringify(playlistTracks)
      );
      console.log("Size of playlistTracks: " + playlistTracks.length);

      const unplayableTracks = [];
      console.log("Cycling playlist tracks...");

      playlistTracks.forEach((track) => {
        console.log("track: " + JSON.stringify(track.name));
        const trackArtists = track.artists;
        const trackArtistNames = trackArtists.map((artist) => artist.name);
        console.log("track artist names: " + JSON.stringify(trackArtistNames));

        if (track.playable == false) {
          unplayableTracks.push(track);
        }
      });

      if (unplayableTracks.length < 1) {
        Spicetify.showNotification("Nothing unplayable");
      }
      return unplayableTracks;
    }

    async function createNewPlaylist(
      originalPlaylistName = Date.now().toLocaleString()
    ) {
      const newPlaylistName = `Unplayable Tracks: ${originalPlaylistName}`;

      const response = await CosmosAsync.post(
        "https://api.spotify.com/v1/me/playlists",
        {
          name: newPlaylistName,
          public: true,
          description: "Created with Spicetify Unplayable Tracks to Playlist",
        }
      );
      if (!response.id) {
        throw new Error("Failed to create empty playlist");
      }
      console.log("Playlist created:", response);
      const newPlaylistID = response.id;
      return newPlaylistID;
    }

    const addTracksToPlaylist = async (playlistId = null, tracks = []) => {
      if (playlistId == null) {
        return;
      }

      const requestURL = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
      const batchSize = 100;
      let adjustedAPIDelay = API_DELAY;

      if (tracks.length >= 1000) {
        adjustedAPIDelay = API_DELAY * 2;
      }

      console.log("Adding tracks to playlist...");
      while (tracks.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, adjustedAPIDelay));

        const batch = tracks.splice(0, batchSize);

        const requestBody = JSON.stringify({
          uris: batch.map((track) => `${track.link}`),
        });
        console.log("Batch adding: " + JSON.stringify(batch));
        console.log("Request: " + requestBody);
        const response = await CosmosAsync.post(requestURL, requestBody);
        console.log("Response: " + JSON.stringify(response));

        if (!response.snapshot_id) {
          console.error("Error adding tracks to playlist");
          throw new Error(`Failed to add tracks to playlist.`);
        } else console.log("Added a batch...");
      }
    };

    // Execution
    Spicetify.showNotification("Making playlist from unavailable tracks...");
    await new Promise((resolve) => setTimeout(resolve, API_DELAY));

    let newPlaylistID = null;
    const originalPlaylistName = await getPlaylistName();
    const playlistTracks = await getPlaylistTracks();
    console.log("Playlist tracks fetched: " + JSON.stringify(playlistTracks));

    const unplayableTracks = determineunplayableTracks(playlistTracks);

    if (unplayableTracks.length > 0) {
      newPlaylistID = await createNewPlaylist(originalPlaylistName);

      console.log("New playlist ID: " + newPlaylistID);
    }

    await addTracksToPlaylist(newPlaylistID, unplayableTracks)
      .then(() => {
        Spicetify.showNotification("Unplayable Tracks to Playlist done");
      })
      .catch((error) => {
        console.error(error);
        Spicetify.showNotification("Unplayable Tracks to Playlist failed");
      });
  }

  function shouldDisplayContextMenu(uris) {
    if (uris.length > 1) {
      return false;
    }

    const uri = uris[0];
    const uriObj = Spicetify.URI.fromString(uri);

    if (uriObj.type === Spicetify.URI.Type.PLAYLIST_V2) {
      return true;
    }

    return false;
  }

  const cntxMenu = new Spicetify.ContextMenu.Item(
    buttontxt,
    makeunplayableTracksPlaylist,
    shouldDisplayContextMenu
  );

  cntxMenu.register();
})();

// 2. Function to remove unplayable tracks from playlist
(function removeUnplayableTracks() {
  const {
    CosmosAsync,

    URI,
  } = Spicetify;
  if (!(CosmosAsync && URI)) {
    setTimeout(removeUnplayableTracks, 300);
    return;
  }

  const MAX_TRACKS_REQUESTABLE = 50; // Spotify Get Playlist Items API max tracks per request (https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks)
  const API_DELAY = 200; // Artificial delay in milliseconds between API calls

  const buttontxt = "Remove Unplayable (Unavailable) Tracks";

  async function purgePlaylist(uris) {
    // Definitions
    async function getPlaylistTracks() {
      const uri = uris[0];
      const uriFinal = uri.split(":")[2];

      let offset = 0;
      let limit = 50;
      const TracksReceived = [];
      let response;
      console.log("Fetching tracks...");

      do {
        response = await CosmosAsync.get(
          `sp://core-playlist/v1/playlist/spotify:playlist:${uriFinal}/rows`
        );

        if (!response) {
          console.log("Failed to fetch playlist tracks.");
          throw new Error("Failed to fetch playlist tracks.");
        }
        TracksReceived.push(response.rows.map((track) => track));
        offset += limit;
        console.log("Fetching more...");
      } while (offset < response.total);
      console.log("Tracks Received: " + JSON.stringify(TracksReceived));
      const playlistTracks = TracksReceived.flat(Infinity);
      return playlistTracks;
    }

    function determineTracksToDelete(playlistTracks = []) {
      console.log(
        "Playlist Tracks passed to determiner: " +
          JSON.stringify(playlistTracks)
      );
      console.log("Size of playlistTracks: " + playlistTracks.length);

      const tracksToDelete = [];
      console.log("Cycling playlist tracks...");

      playlistTracks.forEach((track) => {
        console.log("track: " + JSON.stringify(track.name));
        const trackArtists = track.artists;
        const trackArtistNames = trackArtists.map((artist) => artist.name);
        console.log("track artist names: " + JSON.stringify(trackArtistNames));

        if (track.playable == false) {
          tracksToDelete.push(track);
        }
      });

      if (tracksToDelete.length < 1) {
        Spicetify.showNotification("Nothing to remove");
      }
      return tracksToDelete;
    }

    async function deleteTracksFromPlaylist(tracksToDelete = []) {
      let useAPIDelay = false;
      console.log("Tracks to delete: " + JSON.stringify(tracksToDelete));
      const trackURIsToDelete = tracksToDelete.map((track) => track.link);
      if (trackURIsToDelete.length >= 1000) {
        useAPIDelay = true;
      }

      const portableTrackLinks = trackURIsToDelete.map(
        (trackuri) => "https://open.spotify.com/track/" + trackuri.split(":")[2]
      );
      console.log(
        "Portable track links " +
          `[${portableTrackLinks.length}] ` +
          JSON.stringify(portableTrackLinks)
      );

      const batchesOfTrackURIsToDelete = [];

      do {
        batchesOfTrackURIsToDelete.push(
          trackURIsToDelete.splice(0, MAX_TRACKS_REQUESTABLE)
        );
      } while (trackURIsToDelete.length > 0);

      console.log("Number of batches: " + batchesOfTrackURIsToDelete.length);

      const playlistURI = uris[0];
      const uriFinal = playlistURI.split(":")[2]; // Get Playlist ID
      const requestURL = `https://api.spotify.com/v1/playlists/${uriFinal}/tracks`;

      for (let i = 0; i < batchesOfTrackURIsToDelete.length; i++) {
        if (useAPIDelay == true) {
          await new Promise((resolve) => setTimeout(resolve, API_DELAY));
        }
        const jsonURIsToDelete = JSON.stringify({
          tracks: batchesOfTrackURIsToDelete[i].map((uri) => ({ uri: uri })),
        });

        console.log("Batch to delete: " + jsonURIsToDelete);

        const response = await CosmosAsync.del(requestURL, jsonURIsToDelete);
        console.log("Deletion response:" + JSON.stringify(response));
        if (!response.snapshot_id) {
          throw new Error("Deletion request failed");
        }
      }
    }

    // Execution
    Spicetify.showNotification("Removing unavailable tracks...");
    await new Promise((resolve) => setTimeout(resolve, API_DELAY));

    const playlistTracks = await getPlaylistTracks();
    console.log("Playlist tracks fetched: " + JSON.stringify(playlistTracks));

    const tracksToDelete = determineTracksToDelete(playlistTracks);

    await deleteTracksFromPlaylist(tracksToDelete)
      .then(() => {
        Spicetify.showNotification("Removed unavailable tracks");
      })
      .catch((error) => {
        console.error(error);
        Spicetify.showNotification("Removing unavailable tracks failed");
      });
  }

  function shouldDisplayContextMenu(uris) {
    if (uris.length > 1) {
      return false;
    }

    const uri = uris[0];
    const uriObj = Spicetify.URI.fromString(uri);

    if (uriObj.type === Spicetify.URI.Type.PLAYLIST_V2) {
      return true;
    }

    return false;
  }

  const cntxMenu = new Spicetify.ContextMenu.Item(
    buttontxt,
    purgePlaylist,
    shouldDisplayContextMenu
  );

  cntxMenu.register();
})();
