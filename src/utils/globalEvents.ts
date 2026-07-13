// Global event system for cache synchronization
type EventType = 'student-updated' | 'payment-updated' | 'application-updated' | 'settings-updated' | 'room-updated';

interface GlobalEvent {
  type: EventType;
  data?: any;
  timestamp: number;
}

class GlobalEventManager {
  private listeners: Map<EventType, Set<(data?: any) => void>> = new Map();

  // Subscribe to events
  subscribe(eventType: EventType, callback: (data?: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  // Emit events
  emit(eventType: EventType, data?: any) {
    const event: GlobalEvent = {
      type: eventType,
      data,
      timestamp: Date.now()
    };

    // Emit to all listeners
    this.listeners.get(eventType)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
      }
    });

    // Also store in localStorage for cross-tab communication
    localStorage.setItem('global-event', JSON.stringify(event));
  }

  // Initialize cross-tab communication
  initCrossTabSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'global-event' && e.newValue) {
        try {
          const event: GlobalEvent = JSON.parse(e.newValue);
          // Only process recent events (within 5 seconds)
          if (Date.now() - event.timestamp < 5000) {
            this.listeners.get(event.type)?.forEach(callback => {
              try {
                callback(event.data);
              } catch (error) {
              }
            });
          }
        } catch (error) {
        }
      }
    });
  }
}

// Global instance
export const globalEvents = new GlobalEventManager();

// Initialize cross-tab sync
if (typeof window !== 'undefined') {
  globalEvents.initCrossTabSync();
}

// Helper functions for common events
export const emitStudentUpdate = (data?: any) => globalEvents.emit('student-updated', data);
export const emitPaymentUpdate = (data?: any) => globalEvents.emit('payment-updated', data);
export const emitApplicationUpdate = (data?: any) => globalEvents.emit('application-updated', data);
export const emitSettingsUpdate = (data?: any) => globalEvents.emit('settings-updated', data);
export const emitRoomUpdate = (data?: any) => globalEvents.emit('room-updated', data);

// Hook for React components
export const useGlobalEvents = () => {
  return {
    subscribe: globalEvents.subscribe.bind(globalEvents),
    emitStudentUpdate,
    emitPaymentUpdate,
    emitApplicationUpdate,
    emitSettingsUpdate,
    emitRoomUpdate
  };
};