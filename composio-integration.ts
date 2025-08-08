/**
 * Composio Integration Layer for Email/Calendar Agent
 * Handles Gmail and Google Calendar operations via Composio MCP
 */

import { Composio } from 'composio-core';

export interface ComposioConfig {
  apiKey: string;
  entityId: string;
  baseUrl?: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  timestamp: Date;
  isUnread: boolean;
  labels: string[];
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: Array<{
    email: string;
    name?: string;
    status: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  }>;
  location?: string;
  meetingLink?: string;
  recurrence?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  photoUrl?: string;
}

export class ComposioEmailCalendarService {
  private composio: Composio;
  private entityId: string;

  constructor(config: ComposioConfig) {
    this.composio = new Composio({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://backend.composio.dev'
    });
    this.entityId = config.entityId;
  }

  // Gmail Operations
  async getRecentEmails(limit: number = 10): Promise<EmailMessage[]> {
    try {
      const response = await this.composio.getExpectedParamsForTools({
        tools: ['GMAIL_GET_MESSAGES'],
        entityId: this.entityId
      });

      const messages = await this.composio.executeAction({
        actionName: 'GMAIL_GET_MESSAGES',
        entityId: this.entityId,
        input: {
          maxResults: limit,
          includeSpamTrash: false
        }
      });

      return this.parseGmailMessages(messages.data);
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw new Error('Failed to fetch emails');
    }
  }

  async searchEmails(query: string): Promise<EmailMessage[]> {
    try {
      const response = await this.composio.executeAction({
        actionName: 'GMAIL_SEARCH_MESSAGES',
        entityId: this.entityId,
        input: {
          q: query,
          maxResults: 20
        }
      });

      return this.parseGmailMessages(response.data);
    } catch (error) {
      console.error('Error searching emails:', error);
      throw new Error('Failed to search emails');
    }
  }

  async sendEmail(params: {
    to: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    attachments?: File[];
  }): Promise<{ messageId: string; threadId: string }> {
    try {
      const response = await this.composio.executeAction({
        actionName: 'GMAIL_SEND_EMAIL',
        entityId: this.entityId,
        input: {
          to: params.to.join(','),
          cc: params.cc?.join(','),
          bcc: params.bcc?.join(','),
          subject: params.subject,
          body: params.body,
          // Handle attachments if provided
          ...(params.attachments && { attachments: params.attachments })
        }
      });

      return {
        messageId: response.data.id,
        threadId: response.data.threadId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async markEmailAsRead(messageId: string): Promise<void> {
    try {
      await this.composio.executeAction({
        actionName: 'GMAIL_MODIFY_MESSAGE',
        entityId: this.entityId,
        input: {
          messageId,
          removeLabelIds: ['UNREAD']
        }
      });
    } catch (error) {
      console.error('Error marking email as read:', error);
      throw new Error('Failed to mark email as read');
    }
  }

  // Google Calendar Operations
  async getTodaysEvents(): Promise<CalendarEvent[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const response = await this.composio.executeAction({
        actionName: 'GOOGLECALENDAR_LIST_EVENTS',
        entityId: this.entityId,
        input: {
          calendarId: 'primary',
          timeMin: startOfDay.toISOString(),
          timeMax: endOfDay.toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        }
      });

      return this.parseCalendarEvents(response.data.items);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  async createCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    try {
      const response = await this.composio.executeAction({
        actionName: 'GOOGLECALENDAR_CREATE_EVENT',
        entityId: this.entityId,
        input: {
          calendarId: 'primary',
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
          attendees: event.attendees.map(a => ({ email: a.email, displayName: a.name })),
          location: event.location,
          conferenceData: event.meetingLink ? {
            createRequest: {
              requestId: `meet-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          } : undefined
        }
      });

      return this.parseCalendarEvent(response.data);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  async findAvailableSlots(duration: number, startDate: Date, endDate: Date): Promise<Array<{ start: Date; end: Date }>> {
    try {
      const response = await this.composio.executeAction({
        actionName: 'GOOGLECALENDAR_FREEBUSY_QUERY',
        entityId: this.entityId,
        input: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          items: [{ id: 'primary' }]
        }
      });

      return this.calculateAvailableSlots(response.data, duration);
    } catch (error) {
      console.error('Error finding available slots:', error);
      throw new Error('Failed to find available slots');
    }
  }

  // Contact Operations
  async searchContacts(query: string): Promise<Contact[]> {
    try {
      const response = await this.composio.executeAction({
        actionName: 'GOOGLECONTACTS_SEARCH_CONTACTS',
        entityId: this.entityId,
        input: {
          query,
          pageSize: 10
        }
      });

      return this.parseContacts(response.data);
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw new Error('Failed to search contacts');
    }
  }

  // AI-Powered Query Processing
  async processNaturalLanguageQuery(query: string): Promise<{
    intent: 'email' | 'calendar' | 'contact' | 'unknown';
    action: string;
    parameters: Record<string, any>;
    response: string;
  }> {
    const lowerQuery = query.toLowerCase();
    
    // Email intents
    if (lowerQuery.includes('email') || lowerQuery.includes('message') || lowerQuery.includes('send')) {
      if (lowerQuery.includes('send') || lowerQuery.includes('compose')) {
        return {
          intent: 'email',
          action: 'compose',
          parameters: this.extractEmailParams(query),
          response: 'I can help you compose and send an email. Who would you like to send it to?'
        };
      } else if (lowerQuery.includes('unread') || lowerQuery.includes('new')) {
        const emails = await this.getRecentEmails(5);
        const unreadEmails = emails.filter(e => e.isUnread);
        return {
          intent: 'email',
          action: 'list_unread',
          parameters: { emails: unreadEmails },
          response: `You have ${unreadEmails.length} unread email${unreadEmails.length !== 1 ? 's' : ''}.`
        };
      } else if (lowerQuery.includes('search') || lowerQuery.includes('find')) {
        const searchTerm = this.extractSearchTerm(query);
        const emails = await this.searchEmails(searchTerm);
        return {
          intent: 'email',
          action: 'search',
          parameters: { emails, searchTerm },
          response: `I found ${emails.length} email${emails.length !== 1 ? 's' : ''} matching "${searchTerm}".`
        };
      }
    }

    // Calendar intents
    if (lowerQuery.includes('calendar') || lowerQuery.includes('meeting') || lowerQuery.includes('appointment') || lowerQuery.includes('schedule')) {
      if (lowerQuery.includes('schedule') || lowerQuery.includes('book') || lowerQuery.includes('create')) {
        return {
          intent: 'calendar',
          action: 'create_event',
          parameters: this.extractCalendarParams(query),
          response: 'I can help you schedule a meeting. What would you like to schedule?'
        };
      } else if (lowerQuery.includes('today') || lowerQuery.includes('agenda')) {
        const events = await this.getTodaysEvents();
        return {
          intent: 'calendar',
          action: 'list_today',
          parameters: { events },
          response: `You have ${events.length} event${events.length !== 1 ? 's' : ''} scheduled for today.`
        };
      }
    }

    // Contact intents
    if (lowerQuery.includes('contact') || lowerQuery.includes('phone') || lowerQuery.includes('address')) {
      const contactName = this.extractContactName(query);
      if (contactName) {
        const contacts = await this.searchContacts(contactName);
        return {
          intent: 'contact',
          action: 'search',
          parameters: { contacts, query: contactName },
          response: contacts.length > 0 
            ? `I found ${contacts.length} contact${contacts.length !== 1 ? 's' : ''} for "${contactName}".`
            : `I couldn't find any contacts matching "${contactName}".`
        };
      }
    }

    return {
      intent: 'unknown',
      action: 'general',
      parameters: {},
      response: 'I can help you with email, calendar, and contact management. What would you like to do?'
    };
  }

  // Private helper methods
  private parseGmailMessages(data: any[]): EmailMessage[] {
    return data.map(msg => ({
      id: msg.id,
      threadId: msg.threadId,
      from: this.extractEmailAddress(msg.payload.headers.find((h: any) => h.name === 'From')?.value || ''),
      to: [this.extractEmailAddress(msg.payload.headers.find((h: any) => h.name === 'To')?.value || '')],
      subject: msg.payload.headers.find((h: any) => h.name === 'Subject')?.value || '',
      body: this.extractEmailBody(msg.payload),
      timestamp: new Date(parseInt(msg.internalDate)),
      isUnread: msg.labelIds?.includes('UNREAD') || false,
      labels: msg.labelIds || []
    }));
  }

  private parseCalendarEvents(data: any[]): CalendarEvent[] {
    return data.map(event => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description,
      startTime: new Date(event.start.dateTime || event.start.date),
      endTime: new Date(event.end.dateTime || event.end.date),
      attendees: (event.attendees || []).map((a: any) => ({
        email: a.email,
        name: a.displayName,
        status: a.responseStatus
      })),
      location: event.location,
      meetingLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri
    }));
  }

  private parseCalendarEvent(data: any): CalendarEvent {
    return {
      id: data.id,
      title: data.summary || 'Untitled Event',
      description: data.description,
      startTime: new Date(data.start.dateTime || data.start.date),
      endTime: new Date(data.end.dateTime || data.end.date),
      attendees: (data.attendees || []).map((a: any) => ({
        email: a.email,
        name: a.displayName,
        status: a.responseStatus
      })),
      location: data.location,
      meetingLink: data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri
    };
  }

  private parseContacts(data: any): Contact[] {
    return (data.connections || []).map((contact: any) => ({
      id: contact.resourceName,
      name: contact.names?.[0]?.displayName || 'Unknown',
      email: contact.emailAddresses?.[0]?.value || '',
      phone: contact.phoneNumbers?.[0]?.value,
      organization: contact.organizations?.[0]?.name,
      photoUrl: contact.photos?.[0]?.url
    }));
  }

  private extractEmailAddress(header: string): string {
    const match = header.match(/<([^>]+)>/);
    return match ? match[1] : header.trim();
  }

  private extractEmailBody(payload: any): string {
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          return Buffer.from(part.body.data, 'base64').toString();
        }
      }
    } else if (payload.body.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }
    return '';
  }

  private extractEmailParams(query: string): Record<string, any> {
    // Extract email composition parameters from natural language
    const params: Record<string, any> = {};
    
    // Extract recipient
    const toMatch = query.match(/(?:send|email|message).+?(?:to|@)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (toMatch) params.to = [toMatch[1]];
    
    // Extract subject
    const subjectMatch = query.match(/(?:subject|about|regarding)\s+["']?([^"'\n]+)["']?/i);
    if (subjectMatch) params.subject = subjectMatch[1];
    
    return params;
  }

  private extractCalendarParams(query: string): Record<string, any> {
    // Extract calendar event parameters from natural language
    const params: Record<string, any> = {};
    
    // Extract time/date information
    const timeMatch = query.match(/(?:at|@)\s+(\d{1,2}:\d{2}(?:\s*[ap]m)?)/i);
    if (timeMatch) params.time = timeMatch[1];
    
    // Extract meeting title
    const titleMatch = query.match(/(?:schedule|book|create)\s+(?:a\s+)?(?:meeting|appointment|call)?\s+(?:for|about|with)?\s+["']?([^"'\n]+?)["']?(?:\s+(?:at|on|for))/i);
    if (titleMatch) params.title = titleMatch[1];
    
    return params;
  }

  private extractSearchTerm(query: string): string {
    const match = query.match(/(?:search|find).+?(?:for|about)\s+["']?([^"'\n]+)["']?/i);
    return match ? match[1] : query.replace(/(?:search|find|email|message)/gi, '').trim();
  }

  private extractContactName(query: string): string {
    const match = query.match(/(?:contact|phone|address).+?(?:for|of)\s+["']?([^"'\n]+)["']?/i);
    return match ? match[1] : query.replace(/(?:contact|phone|address)/gi, '').trim();
  }

  private calculateAvailableSlots(freeBusyData: any, duration: number): Array<{ start: Date; end: Date }> {
    // Implementation for calculating available time slots
    // This would analyze the free/busy data and find available slots of the specified duration
    const slots: Array<{ start: Date; end: Date }> = [];
    // Simplified implementation - in practice, this would be more complex
    return slots;
  }
}

// Export singleton instance
export const createComposioService = (config: ComposioConfig): ComposioEmailCalendarService => {
  return new ComposioEmailCalendarService(config);
};