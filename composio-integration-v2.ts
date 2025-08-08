/**
 * Composio Integration Layer v2 - Using Correct Entity API
 * Handles Gmail and Google Calendar operations via Composio
 */

import { Composio } from 'composio-core';

export interface ComposioConfig {
  apiKey: string;
  entityId?: string;
}

export interface EmailMessage {
  id: string;
  threadId?: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  timestamp: Date;
  isUnread: boolean;
  labels: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: Array<{
    email: string;
    name?: string;
    status?: string;
  }>;
  location?: string;
  meetingLink?: string;
}

export class ComposioEmailCalendarService {
  private client: Composio;
  private entity: any;
  private entityId: string;
  private isInitialized: boolean = false;

  constructor(config: ComposioConfig) {
    this.client = new Composio(config.apiKey);
    this.entityId = config.entityId || 'default-user';
  }

  /**
   * Initialize the entity connection
   */
  private async initialize() {
    if (!this.isInitialized) {
      this.entity = await this.client.getEntity(this.entityId);
      this.isInitialized = true;
    }
  }

  /**
   * Check if Gmail is connected
   */
  async isGmailConnected(): Promise<boolean> {
    await this.initialize();
    try {
      const connections = await Promise.race([
        this.entity.getConnections(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any[];
      
      return connections.some((conn: any) => 
        conn.appName?.toLowerCase().includes('gmail') ||
        conn.appUniqueId?.toLowerCase().includes('gmail')
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if Google Calendar is connected
   */
  async isCalendarConnected(): Promise<boolean> {
    await this.initialize();
    try {
      const connections = await Promise.race([
        this.entity.getConnections(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any[];
      
      return connections.some((conn: any) => 
        conn.appName?.toLowerCase().includes('calendar') ||
        conn.appUniqueId?.toLowerCase().includes('googlecalendar')
      );
    } catch {
      return false;
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{
    gmail: boolean;
    calendar: boolean;
    entityId: string;
  }> {
    await this.initialize();
    
    return {
      gmail: await this.isGmailConnected(),
      calendar: await this.isCalendarConnected(),
      entityId: this.entityId
    };
  }

  // Gmail Operations

  /**
   * Get recent emails
   */
  async getRecentEmails(limit: number = 10): Promise<EmailMessage[]> {
    await this.initialize();
    
    try {
      const result = await this.entity.execute({
        actionName: 'gmail_list_emails',
        params: {
          max_results: limit,
          include_spam_trash: false
        }
      });

      if (!result.data || !Array.isArray(result.data)) {
        return [];
      }

      return result.data.map((msg: any) => this.parseEmailMessage(msg));
    } catch (error: any) {
      console.error('Error fetching emails:', error.message);
      throw new Error(`Failed to fetch emails: ${error.message}`);
    }
  }

  /**
   * Search emails
   */
  async searchEmails(query: string): Promise<EmailMessage[]> {
    await this.initialize();
    
    try {
      const result = await this.entity.execute({
        actionName: 'gmail_search_emails',
        params: {
          query: query,
          max_results: 20
        }
      });

      if (!result.data || !Array.isArray(result.data)) {
        return [];
      }

      return result.data.map((msg: any) => this.parseEmailMessage(msg));
    } catch (error: any) {
      console.error('Error searching emails:', error.message);
      throw new Error(`Failed to search emails: ${error.message}`);
    }
  }

  /**
   * Send email
   */
  async sendEmail(params: {
    to: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<{ success: boolean; messageId?: string }> {
    await this.initialize();
    
    try {
      const result = await this.entity.execute({
        actionName: 'gmail_send_email',
        params: {
          to: params.to.join(','),
          subject: params.subject,
          body: params.body,
          cc: params.cc?.join(','),
          bcc: params.bcc?.join(',')
        }
      });

      return {
        success: true,
        messageId: result.data?.id
      };
    } catch (error: any) {
      console.error('Error sending email:', error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Google Calendar Operations

  /**
   * Get today's events
   */
  async getTodaysEvents(): Promise<CalendarEvent[]> {
    await this.initialize();
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await this.entity.execute({
        actionName: 'googlecalendar_list_events',
        params: {
          calendar_id: 'primary',
          time_min: today.toISOString(),
          time_max: tomorrow.toISOString(),
          single_events: true,
          order_by: 'startTime'
        }
      });

      if (!result.data?.items || !Array.isArray(result.data.items)) {
        return [];
      }

      return result.data.items.map((event: any) => this.parseCalendarEvent(event));
    } catch (error: any) {
      console.error('Error fetching calendar events:', error.message);
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }
  }

  /**
   * Create calendar event
   */
  async createCalendarEvent(event: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
    location?: string;
  }): Promise<CalendarEvent> {
    await this.initialize();
    
    try {
      const result = await this.entity.execute({
        actionName: 'googlecalendar_create_event',
        params: {
          calendar_id: 'primary',
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: event.endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          attendees: event.attendees?.map(email => ({ email })),
          location: event.location
        }
      });

      return this.parseCalendarEvent(result.data);
    } catch (error: any) {
      console.error('Error creating calendar event:', error.message);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  /**
   * Get events for date range
   */
  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    await this.initialize();
    
    try {
      const result = await this.entity.execute({
        actionName: 'googlecalendar_list_events',
        params: {
          calendar_id: 'primary',
          time_min: startDate.toISOString(),
          time_max: endDate.toISOString(),
          single_events: true,
          order_by: 'startTime'
        }
      });

      if (!result.data?.items || !Array.isArray(result.data.items)) {
        return [];
      }

      return result.data.items.map((event: any) => this.parseCalendarEvent(event));
    } catch (error: any) {
      console.error('Error fetching events:', error.message);
      throw new Error(`Failed to fetch events: ${error.message}`);
    }
  }

  // Helper methods

  private parseEmailMessage(data: any): EmailMessage {
    // Parse Gmail API response
    const headers = data.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    return {
      id: data.id || '',
      threadId: data.threadId,
      from: this.extractEmailAddress(getHeader('From')),
      to: this.parseEmailAddresses(getHeader('To')),
      subject: getHeader('Subject') || '(No Subject)',
      body: this.extractEmailBody(data.payload),
      timestamp: new Date(parseInt(data.internalDate) || Date.now()),
      isUnread: data.labelIds?.includes('UNREAD') || false,
      labels: data.labelIds || []
    };
  }

  private parseCalendarEvent(data: any): CalendarEvent {
    return {
      id: data.id || '',
      title: data.summary || 'Untitled Event',
      description: data.description,
      startTime: new Date(data.start?.dateTime || data.start?.date),
      endTime: new Date(data.end?.dateTime || data.end?.date),
      attendees: (data.attendees || []).map((a: any) => ({
        email: a.email,
        name: a.displayName,
        status: a.responseStatus
      })),
      location: data.location,
      meetingLink: data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri
    };
  }

  private extractEmailAddress(header: string): string {
    if (!header) return '';
    const match = header.match(/<([^>]+)>/);
    return match ? match[1] : header.trim();
  }

  private parseEmailAddresses(header: string): string[] {
    if (!header) return [];
    return header.split(',').map(addr => this.extractEmailAddress(addr.trim()));
  }

  private extractEmailBody(payload: any): string {
    if (!payload) return '';
    
    // Try to find text/plain part
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString();
        }
      }
      // Fallback to text/html if no plain text
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString();
        }
      }
    } else if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }
    
    return '';
  }
}

// Export factory function
export const createComposioService = (config: ComposioConfig): ComposioEmailCalendarService => {
  return new ComposioEmailCalendarService(config);
};