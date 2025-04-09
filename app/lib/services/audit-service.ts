/**
 * Security Audit Logging Service
 * 
 * This service provides functions for logging security-related events.
 */

import { createClient } from '../supabase/client';
import { createServerClient } from '../supabase/server';
import { cookies } from 'next/headers';

// Get the appropriate Supabase client based on context
function getAuditClient(serverSide = true) {
  if (serverSide) {
    const cookieStore = cookies();
    return createServerClient(cookieStore);
  }

  return createClient();
}

// Audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  PASSWORD_RESET_FAILURE = 'PASSWORD_RESET_FAILURE',
  VERIFICATION_CODE_GENERATED = 'VERIFICATION_CODE_GENERATED',
  VERIFICATION_CODE_VALIDATED = 'VERIFICATION_CODE_VALIDATED',
  VERIFICATION_CODE_INVALID = 'VERIFICATION_CODE_INVALID',
  PIN_SETUP = 'PIN_SETUP',
  PIN_CHANGE = 'PIN_CHANGE',
  PIN_RESET = 'PIN_RESET',
  
  // Session events
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_EXTENDED = 'SESSION_EXTENDED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_TERMINATED = 'SESSION_TERMINATED',
  
  // Account events
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_UPDATED = 'ACCOUNT_UPDATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  
  // Permission events
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  
  // Data access events
  DATA_ACCESSED = 'DATA_ACCESSED',
  DATA_MODIFIED = 'DATA_MODIFIED',
  DATA_DELETED = 'DATA_DELETED',
  
  // System events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_WARNING = 'SYSTEM_WARNING',
  SYSTEM_INFO = 'SYSTEM_INFO'
}

// Audit service
export const auditService = {
  /**
   * Log an audit event
   * 
   * @param eventType - Type of audit event
   * @param userId - User ID (if applicable)
   * @param details - Additional event details
   * @param ipAddress - IP address of the request
   * @param userAgent - User agent of the request
   * @param serverSide - Whether to use server-side client
   * @returns Logging result
   */
  async logEvent(
    eventType: AuditEventType,
    userId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    serverSide = true
  ) {
    try {
      const supabase = getAuditClient(serverSide);
      
      // Create audit log entry
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          event_type: eventType,
          user_id: userId,
          details: details || {},
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error logging audit event:', error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in audit logging:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Log an authentication event
   * 
   * @param eventType - Type of authentication event
   * @param userId - User ID (if applicable)
   * @param email - User email
   * @param success - Whether the authentication was successful
   * @param reason - Reason for failure (if applicable)
   * @param ipAddress - IP address of the request
   * @param userAgent - User agent of the request
   * @param serverSide - Whether to use server-side client
   * @returns Logging result
   */
  async logAuthEvent(
    eventType: AuditEventType,
    userId: string | undefined,
    email: string,
    success: boolean,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
    serverSide = true
  ) {
    return this.logEvent(
      eventType,
      userId,
      {
        email,
        success,
        reason
      },
      ipAddress,
      userAgent,
      serverSide
    );
  },
  
  /**
   * Log a session event
   * 
   * @param eventType - Type of session event
   * @param userId - User ID
   * @param sessionId - Session ID
   * @param deviceId - Device ID
   * @param ipAddress - IP address of the request
   * @param userAgent - User agent of the request
   * @param serverSide - Whether to use server-side client
   * @returns Logging result
   */
  async logSessionEvent(
    eventType: AuditEventType,
    userId: string,
    sessionId: string,
    deviceId: string,
    ipAddress?: string,
    userAgent?: string,
    serverSide = true
  ) {
    return this.logEvent(
      eventType,
      userId,
      {
        session_id: sessionId,
        device_id: deviceId
      },
      ipAddress,
      userAgent,
      serverSide
    );
  },
  
  /**
   * Log a data access event
   * 
   * @param eventType - Type of data access event
   * @param userId - User ID
   * @param resourceType - Type of resource accessed
   * @param resourceId - ID of resource accessed
   * @param action - Action performed
   * @param ipAddress - IP address of the request
   * @param userAgent - User agent of the request
   * @param serverSide - Whether to use server-side client
   * @returns Logging result
   */
  async logDataEvent(
    eventType: AuditEventType,
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string,
    serverSide = true
  ) {
    return this.logEvent(
      eventType,
      userId,
      {
        resource_type: resourceType,
        resource_id: resourceId,
        action
      },
      ipAddress,
      userAgent,
      serverSide
    );
  }
};
