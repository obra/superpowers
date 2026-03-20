# 1300_00105 Flight Booking API Integration Guide

## Overview
This document provides comprehensive documentation for the flight booking API integration implemented in the travel arrangements system. The integration supports multiple flight search APIs (Amadeus, Sabre, Travelport) with automatic fallback mechanisms and comprehensive error handling.

## System Architecture

### Service Layer
The flight booking functionality is implemented in `client/src/services/flightBookingService.js` and provides:

- **Multi-API Support**: Amadeus, Sabre, and Travelport integrations
- **Automatic Fallback**: Graceful degradation between API providers
- **Retry Logic**: Configurable retry mechanisms with exponential backoff
- **Caching**: Flight search results caching for improved performance
- **Error Handling**: Comprehensive error handling with user-friendly messages

### Configuration
API credentials and settings are managed through the external API configuration service:

- **Configuration File**: `client/src/services/externalApiConfigurationService.js`
- **Environment Variables**: 
  - `AMADEUS_API_KEY`, `AMADEUS_API_SECRET`
  - `SABRE_API_KEY`, `SABRE_API_SECRET` 
  - `TRAVELPORT_API_KEY`, `TRAVELPORT_API_SECRET`

## API Endpoints

### Flight Search
**Method**: `POST /api/flight-search`
**Service Method**: `searchFlights(searchParams)`

Parameters:
```javascript
{
  origin: 'string',           // IATA code (e.g., 'JNB')
  destination: 'string',      // IATA code (e.g., 'CPT')
  departureDate: 'YYYY-MM-DD', // Departure date
  returnDate: 'YYYY-MM-DD',   // Return date (optional for one-way)
  passengers: {
    adults: number,           // Number of adults (1-9)
    children: number,         // Number of children (0-9)
    infants: number          // Number of infants (0-9)
  },
  cabinClass: 'ECONOMY|PREMIUM_ECONOMY|BUSINESS|FIRST',
  maxResults: number          // Maximum number of results (default: 50)
}
```

Response:
```javascript
{
  success: boolean,
  data: {
    flights: [
      {
        id: 'string',           // Unique flight identifier
        provider: 'string',     // API provider (amadeus|sabre|travelport)
        price: {
          currency: 'string',   // Currency code (e.g., 'ZAR')
          total: number,       // Total price
          base: number,        // Base fare
          taxes: number        // Tax amount
        },
        itinerary: [
          {
            origin: 'string',    // Departure airport
            destination: 'string', // Arrival airport
            departureTime: 'ISO8601', // Departure datetime
            arrivalTime: 'ISO8601',  // Arrival datetime
            duration: 'string',     // Duration (e.g., 'PT2H30M')
            airline: 'string',      // Airline code
            flightNumber: 'string', // Flight number
            aircraft: 'string',     // Aircraft type
            cabin: 'string'        // Cabin class
          }
        ],
        bookingUrl: 'string'    // URL for booking this flight
      }
    ],
    metadata: {
      provider: 'string',       // Provider that returned results
      timestamp: 'ISO8601',     // Search timestamp
      cached: boolean          // Whether results were cached
    }
  },
  error: 'string'             // Error message if success is false
}
```

### Booking Creation
**Method**: `POST /api/flight-booking`
**Service Method**: `bookFlight(bookingData)`

Parameters:
```javascript
{
  flightId: 'string',         // Flight identifier from search results
  passengers: [
    {
      title: 'string',         // Mr, Mrs, Ms, etc.
      firstName: 'string',
      lastName: 'string',
      dateOfBirth: 'YYYY-MM-DD',
      email: 'string',
      phone: 'string',
      frequentFlyerNumber: 'string' // Optional
    }
  ],
  contact: {
    email: 'string',          // Contact email
    phone: 'string',          // Contact phone
    specialRequests: 'string' // Special requests (optional)
  },
  payment: {
    cardNumber: 'string',     // Encrypted card number
    expiryMonth: 'string',    // MM
    expiryYear: 'string',     // YYYY
    cvv: 'string',           // Encrypted CVV
    cardholderName: 'string',
    billingAddress: {
      street: 'string',
      city: 'string',
      state: 'string',
      postalCode: 'string',
      country: 'string'
    }
  }
}
```

Response:
```javascript
{
  success: boolean,
  data: {
    bookingReference: 'string',   // Airline booking reference
    status: 'string',            // Booking status
    totalPrice: {
      currency: 'string',
      amount: number
    },
    confirmationUrl: 'string',   // URL for booking confirmation
    eticketUrl: 'string'        // URL for e-ticket (if available)
  },
  error: 'string'              // Error message if success is false
}
```

## Implementation Details

### Flight Search Flow
1. **Configuration Check**: Verify API credentials are available
2. **Cache Lookup**: Check if results exist in cache
3. **Primary API Call**: Attempt search with primary provider (Amadeus)
4. **Fallback Logic**: If primary fails, try Sabre, then Travelport
5. **Result Processing**: Normalize results to common format
6. **Caching**: Store results with 1-hour TTL
7. **Response**: Return formatted results to client

### Error Handling
- **Network Errors**: Retry with exponential backoff (max 3 attempts)
- **Authentication Errors**: Automatic token refresh for OAuth providers
- **Rate Limiting**: Automatic retry with delay for rate-limited requests
- **Provider Errors**: Graceful fallback to next provider
- **Validation Errors**: Client-side validation before API calls

### Caching Strategy
- **Cache Key**: SHA256 hash of search parameters
- **TTL**: 1 hour for flight search results
- **Storage**: In-memory cache with LRU eviction
- **Invalidation**: Automatic on cache expiry

## Testing

### Unit Tests
Located in `client/src/services/testFlightBookingService.js`

Test Coverage:
- ✅ API configuration loading
- ✅ Flight search functionality
- ✅ Booking creation
- ✅ Error handling scenarios
- ✅ Fallback mechanism
- ✅ Cache behavior

### Integration Tests
- ✅ Amadeus API integration
- ✅ Sabre API integration  
- ✅ Travelport API integration
- ✅ End-to-end booking flow

## Security Considerations

### Data Protection
- Payment information encrypted in transit and at rest
- PCI DSS compliance for card data handling
- PII protection for passenger data
- Secure API credential storage

### Authentication
- OAuth 2.0 for API provider authentication
- JWT tokens for client-server communication
- Rate limiting to prevent abuse
- Input validation and sanitization

## Performance Optimization

### Caching
- Flight search results cached for 1 hour
- Configuration data cached on application startup
- Provider status cached to optimize fallback decisions

### Retry Logic
- Exponential backoff: 1s, 2s, 4s delays
- Circuit breaker pattern for failed providers
- Smart retry based on error type

## Monitoring and Logging

### Logging
- All API requests and responses logged
- Error conditions fully documented
- Performance metrics collected
- Audit trail for bookings

### Monitoring
- API response times tracked
- Success/failure rates monitored
- Provider uptime tracking
- Cache hit/miss ratios

## Troubleshooting

### Common Issues

**No Flight Results**
- Check API credentials in configuration
- Verify date formats and airport codes
- Test with broader date ranges
- Check provider status and rate limits

**Booking Failures**
- Validate passenger data format
- Check payment information
- Verify network connectivity
- Review provider-specific error messages

**Performance Issues**
- Check cache hit rates
- Monitor API response times
- Review fallback provider usage
- Analyze network latency

## Future Enhancements

### Planned Features
- Real-time price tracking and alerts
- Multi-city flight support
- Flexible date searching
- Seat selection integration
- Mobile-specific optimizations

### Integration Opportunities
- Loyalty program APIs
- Airport information services
- Weather integration for delay predictions
- Alternative transportation options

## Version History
- v1.0 (2025-09-23): Initial flight booking API integration implementation

## Related Documentation
- `1300_00105_TRAVEL_ARRANGEMENTS.md` - Main travel arrangements page
- `1300_01700_ADVANCED_INTEGRATION_GUIDE.md` - General API integration patterns
- `1300_02020_DOCUMENSO_INTEGRATION_GUIDE.md` - External API integration standards
