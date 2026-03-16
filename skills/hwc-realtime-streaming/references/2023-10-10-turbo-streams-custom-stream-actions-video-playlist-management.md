---
title: Turbo Streams - Custom Stream Actions - Video Playlist Management
date: '2023-10-10'
categories:
- Turbo Streams
tags:
- Custom Stream Actions
- Custom Events
- Event Orchestration
- Rails
free: true
ready: true
---

# Video Playlist Management with Custom Turbo Stream Actions

This pattern demonstrates managing a video playlist using custom Turbo Stream actions orchestrated through custom events. The implementation uses three decoupled custom stream actions to handle video exchange, playlist control updates, and playing indicator management.

## Table of Contents

- [Custom Stream Actions](#custom-stream-actions)
- [1. exchangeVideo Action](#1-exchangevideo-action)
- [2. managePlaylistControls Action](#2-manageplaylistcontrols-action)
- [3. managePlayingIndicator Action](#3-manageplayingindicator-action)
- [Event Orchestration](#event-orchestration)
- [Button Click Handler](#button-click-handler)
- [videochange Event Listener](#videochange-event-listener)
- [videochanged Event Listener](#videochanged-event-listener)
- [HTML Structure](#html-structure)
- [Rails Usage](#rails-usage)
- [Controller Action](#controller-action)
- [Turbo Stream Template](#turbo-stream-template)
- [Using turbo_stream_action_tag Helper](#using-turbo_stream_action_tag-helper)
- [Form Submission](#form-submission)
- [Key Points](#key-points)

## Custom Stream Actions

Three custom stream actions are defined to handle different aspects of playlist management:

### 1. exchangeVideo Action

Replaces the video player element with a new video ID and dispatches a `videochanged` event:

```js
import '@hotwired/turbo';
import { StreamActions } from '@hotwired/turbo';

// <turbo-stream action="exchangeVideo" target="#player-dom-id" youtubeId="a youtube id"></turbo-stream>
StreamActions.exchangeVideo = function () {
  const youtubeId = this.getAttribute('youtubeid');
  const playerElement = document.querySelector(this.getAttribute('target'));

  const playerElementClone = document
    .querySelector('#player-template')
    .content.cloneNode(true);

  playerElementClone.firstElementChild.setAttribute('videoid', youtubeId);

  playerElement.replaceWith(playerElementClone);

  const videoChangedEvent = new CustomEvent('videochanged', {
    detail: {
      youtubeId: youtubeId,
    },
    bubbles: true,
  });

  document.body.dispatchEvent(videoChangedEvent);
};
```

### 2. managePlaylistControls Action

Updates the next and previous button datasets with the appropriate YouTube IDs:

```js
// <turbo-stream action="managePlaylistControls" target="#a-dom-id" nextYoutubeId="a youtube id" previousYoutubeId="a youtube id"></turbo-stream>
StreamActions.managePlaylistControls = function () {
  document.querySelector('#button-previous').dataset.youtubeId =
    this.getAttribute('previousyoutubeid');
  document.querySelector('#button-next').dataset.youtubeId =
    this.getAttribute('nextyoutubeid');
};
```

### 3. managePlayingIndicator Action

Updates visual indicators by removing active classes from all items and adding them to the current video:

```js
// <turbo-stream action="managePlayingIndicator" target="#playlist-dom-id" currentYoutubeId="a youtube id"></turbo-stream>
StreamActions.managePlayingIndicator = function () {
  document
    .querySelectorAll(`${this.getAttribute('target')} .indicator-ping`)
    .forEach((indicator) => {
      indicator.classList.remove('animate-ping', 'bg-sky-400');
      indicator.classList.add('bg-gray-400');
    });

  document
    .querySelectorAll(`${this.getAttribute('target')} .indicator`)
    .forEach((indicator) => {
      indicator.classList.remove('bg-sky-500');
      indicator.classList.add('bg-gray-500');
    });

  document
    .querySelector(
      `${this.getAttribute('target')} li[data-youtube-id=${this.getAttribute(
        'currentyoutubeid'
      )}] .indicator-ping`
    )
    .classList.add('animate-ping', 'bg-sky-400');

  document
    .querySelector(
      `${this.getAttribute('target')} li[data-youtube-id=${this.getAttribute(
        'currentyoutubeid'
      )}] .indicator`
    )
    .classList.add('bg-sky-500');
};
```

## Event Orchestration

The solution uses two custom events to orchestrate DOM changes: `videochange` and `videochanged`.

### Button Click Handler

When a playlist control button is clicked, it dispatches a `videochange` event:

```js
document.querySelectorAll('#playlist-controls button').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();

    const videoChangeEvent = new CustomEvent('videochange', {
      detail: {
        youtubeId: event.currentTarget.dataset.youtubeId,
      },
      bubbles: true,
    });

    event.target.dispatchEvent(videoChangeEvent);
  });
});
```

### videochange Event Listener

Handles the video change by cloning and executing the exchange video action:

```js
document.addEventListener('videochange', (event) => {
  const youtubeId = event.detail.youtubeId;

  // execute video change action
  const exchangeVideoActionClone = document
    .querySelector('#exchange-video-action-template')
    .content.cloneNode(true);
  exchangeVideoActionClone.firstElementChild.setAttribute(
    'youtubeid',
    youtubeId
  );

  document.body.appendChild(exchangeVideoActionClone);
});
```

### videochanged Event Listener

After the video is exchanged, this listener updates the playlist controls and indicators:

```js
document.addEventListener('videochanged', (event) => {
  const youtubeId = event.detail.youtubeId;

  const playlistElements = Array.from(
    document.querySelectorAll('#playlist li')
  );

  const currentVideoElementIdx = playlistElements.findIndex(
    (element) => element.dataset.youtubeId === youtubeId
  );

  const previousVideoElement =
    playlistElements[
      (currentVideoElementIdx - 1 + playlistElements.length) %
        playlistElements.length
    ];
  const nextVideoElement =
    playlistElements[(currentVideoElementIdx + 1) % playlistElements.length];

  // execute manage playlist controls action
  const managePlaylistActionClone = document
    .querySelector('#manage-playlist-controls-action-template')
    .content.cloneNode(true);

  managePlaylistActionClone.firstElementChild.setAttribute(
    'previousyoutubeid',
    previousVideoElement.dataset.youtubeId
  );

  managePlaylistActionClone.firstElementChild.setAttribute(
    'nextyoutubeid',
    nextVideoElement.dataset.youtubeId
  );

  document.body.appendChild(managePlaylistActionClone);

  // execute manage playing indicator action
  const manageIndicatorActionClone = document
    .querySelector('#manage-playing-indicator-action-template')
    .content.cloneNode(true);

  manageIndicatorActionClone.firstElementChild.setAttribute(
    'currentyoutubeid',
    youtubeId
  );

  document.body.appendChild(manageIndicatorActionClone);
});
```

## HTML Structure

The HTML includes template elements for the player and the three custom stream actions:

```html
<template id="player-template">
  <lite-youtube id="player"></lite-youtube>
</template>
<template id="exchange-video-action-template">
  <turbo-stream action="exchangeVideo" target="#player"></turbo-stream>
</template>
<template id="manage-playlist-controls-action-template">
  <turbo-stream
    action="managePlaylistControls"
    target="#playlist-controls"
  ></turbo-stream>
</template>
<template id="manage-playing-indicator-action-template">
  <turbo-stream
    action="managePlayingIndicator"
    target="#playlist"
  ></turbo-stream>
</template>

<div id="playlist-controls">
  <button
    type="button"
    id="button-previous"
    data-youtube-id="G1QbH2QZX08"
  >
    Previous
  </button>
  <button
    type="button"
    id="button-next"
    data-youtube-id="TKulocPqV38"
  >
    Next
  </button>
</div>

<ul id="playlist">
  <li data-youtube-id="nOhGMcjL0jk">
    <span class="indicator-ping"></span>
    <span class="indicator"></span>
    <!-- video content -->
  </li>
  <!-- additional playlist items -->
</ul>
```

## Rails Usage

In a Rails application, the client-side cloning and manipulation of turbo-stream actions can be replaced with server-side `.turbo_stream.erb` templates. This reduces JavaScript complexity to only implementing the three custom actions.

### Controller Action

```ruby
class PlaylistsController < ApplicationController
  def next_video
    @current_video = Video.find(params[:video_id])
    @playlist = @current_video.playlist
    @next_video = @playlist.next_video_after(@current_video)
    @previous_video = @playlist.previous_video_before(@current_video)
  end
end
```

### Turbo Stream Template

Create `app/views/playlists/next_video.turbo_stream.erb`:

```erb
<%= turbo_stream_action_tag "exchangeVideo", target: "#player", youtubeId: @next_video.youtube_id %>

<%= turbo_stream_action_tag "managePlaylistControls", 
    target: "#playlist-controls",
    nextYoutubeId: @playlist.next_video_after(@next_video).youtube_id,
    previousYoutubeId: @playlist.previous_video_before(@next_video).youtube_id %>

<%= turbo_stream_action_tag "managePlayingIndicator",
    target: "#playlist",
    currentYoutubeId: @next_video.youtube_id %>
```

### Using turbo_stream_action_tag Helper

You may need to create a helper method for custom stream actions:

```ruby
# app/helpers/turbo_stream_helper.rb
module TurboStreamHelper
  def turbo_stream_action_tag(action, **attributes)
    tag.turbo_stream(
      action: action,
      **attributes.transform_keys { |k| k.to_s.camelize(:lower) }
    )
  end
end
```

### Form Submission

Trigger the action from a form or button:

```erb
<%= button_to "Next Video", 
    next_video_playlist_path(@playlist, video_id: @current_video.id),
    method: :post,
    data: { turbo_stream: true } %>
```

When the form is submitted, Rails responds with the turbo_stream template, which automatically executes the custom stream actions on the client side.

## Key Points

- **Decoupled Actions**: Keeping custom stream actions separate makes the solution more maintainable and easier to refactor.
- **Event-Driven**: Using custom events (`videochange` and `videochanged`) orchestrates multiple DOM updates in sequence.
- **Template-Based**: Turbo Stream actions are defined in HTML templates and cloned when needed, or sent from the server in Rails.
- **Server-Side Generation**: In Rails, turbo_stream templates can generate these actions server-side, reducing client-side JavaScript complexity.
