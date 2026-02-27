import React from 'react';
import {
  PreviewDevToolsMessage,
  NavigationCommand,
  PREVIEW_DEVTOOLS_SOURCE,
  isPreviewDevToolsMessage,
} from '@/shared/types/previewDevTools';

type MessageHandler = (message: PreviewDevToolsMessage) => void;

/**
 * Bridge for communicating with the preview iframe's devtools
 * Handles postMessage communication for navigation commands and devtools events
 */
export class PreviewDevToolsBridge {
  private messageHandler: MessageHandler;
  private iframeRef: React.RefObject<HTMLIFrameElement | null>;
  private messageListener: ((event: MessageEvent) => void) | null = null;

  constructor(
    messageHandler: MessageHandler,
    iframeRef: React.RefObject<HTMLIFrameElement | null>
  ) {
    this.messageHandler = messageHandler;
    this.iframeRef = iframeRef;
  }

  /**
   * Start listening for messages from the preview iframe
   */
  start(): void {
    if (this.messageListener) {
      this.stop(); // Clean up existing listener
    }

    this.messageListener = (event: MessageEvent) => {
      if (event.source !== this.iframeRef.current?.contentWindow) return;

      const data = event.data;

      // Only handle messages from our devtools
      if (!isPreviewDevToolsMessage(data)) {
        return;
      }

      this.messageHandler(data);
    };

    window.addEventListener('message', this.messageListener);
  }

  /**
   * Stop listening for messages
   */
  stop(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
  }

  /**
   * Send a navigation command to the iframe
   */
  private sendCommand(command: NavigationCommand): void {
    const iframe = this.iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(command, '*');
    }
  }

  /**
   * Navigate back in the iframe's history
   */
  navigateBack(): void {
    this.sendCommand({
      source: PREVIEW_DEVTOOLS_SOURCE,
      type: 'navigate',
      payload: {
        action: 'back',
      },
    });
  }

  /**
   * Navigate forward in the iframe's history
   */
  navigateForward(): void {
    this.sendCommand({
      source: PREVIEW_DEVTOOLS_SOURCE,
      type: 'navigate',
      payload: {
        action: 'forward',
      },
    });
  }

  /**
   * Refresh the iframe
   */
  refresh(): void {
    this.sendCommand({
      source: PREVIEW_DEVTOOLS_SOURCE,
      type: 'navigate',
      payload: {
        action: 'refresh',
      },
    });
  }

  /**
   * Navigate to a specific URL in the iframe
   */
  navigateTo(url: string): void {
    this.sendCommand({
      source: PREVIEW_DEVTOOLS_SOURCE,
      type: 'navigate',
      payload: {
        action: 'goto',
        url,
      },
    });
  }
}
