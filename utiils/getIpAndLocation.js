const axios = require('axios');

/**
 * Get client IP address from request
 * Handles proxies and forwarded headers
 */
const getClientIp = (req) => {
  // In development, allow using a test IP from environment variable
  // Set TEST_IP in .env to test with a real IP (e.g., TEST_IP=8.8.8.8)
  if (process.env.NODE_ENV === 'development' && process.env.TEST_IP) {
    return process.env.TEST_IP;
  }

  // Try x-forwarded-for header first (contains comma-separated list, first is client)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    // Filter out internal IPs and get the first public IP
    const publicIp = ips.find(ip => 
      ip && 
      ip !== '127.0.0.1' && 
      ip !== '::1' && 
      !ip.startsWith('192.168.') && 
      !ip.startsWith('10.') && 
      !ip.startsWith('172.') &&
      !ip.startsWith('::ffff:192.168.') &&
      !ip.startsWith('::ffff:10.')
    );
    if (publicIp) {
      return publicIp;
    }
    // If no public IP found, return first IP anyway
    return ips[0];
  }
  
  // Try x-real-ip header
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  
  // Try CF-Connecting-IP (Cloudflare)
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }
  
  // Try True-Client-IP (Akamai, Cloudflare Enterprise)
  if (req.headers['true-client-ip']) {
    return req.headers['true-client-ip'];
  }
  
  // Fallback to req.ip (works with trust proxy enabled)
  if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1') {
    // Handle IPv6-mapped IPv4 addresses
    if (req.ip.startsWith('::ffff:')) {
      return req.ip.replace('::ffff:', '');
    }
    return req.ip;
  }
  
  // Last resort: socket remote address
  const remoteAddr = req.socket?.remoteAddress;
  if (remoteAddr && remoteAddr.startsWith('::ffff:')) {
    return remoteAddr.replace('::ffff:', '');
  }
  return remoteAddr || 'unknown';
};

/**
 * Get location data from IP address using ipinfo.io
 * Free tier: 50,000 requests/month
 */
const getLocationFromIp = async (ipAddress) => {
  try {
    // Skip localhost/internal IPs (unless in development with TEST_IP)
    const isLocalhost = !ipAddress || 
      ipAddress === 'unknown' || 
      ipAddress === '::1' || 
      ipAddress === '127.0.0.1' || 
      ipAddress.startsWith('192.168.') || 
      ipAddress.startsWith('10.') || 
      ipAddress.startsWith('172.') ||
      ipAddress.startsWith('::ffff:192.168.') ||
      ipAddress.startsWith('::ffff:10.') ||
      ipAddress.startsWith('::ffff:172.');
    
    if (isLocalhost && !(process.env.NODE_ENV === 'development' && process.env.TEST_IP)) {
      return {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        timezone: 'Unknown',
        ipAddress: ipAddress,
      };
    }

    // Use ipinfo.io API (free tier available)
    // You can also use other services like ip-api.com, ipgeolocation.io, etc.
    const apiKey = process.env.IPINFO_API_KEY || ''; // Optional: add API key in .env for higher rate limits
    const url = apiKey 
      ? `https://ipinfo.io/${ipAddress}/json?token=${apiKey}`
      : `https://ipinfo.io/${ipAddress}/json`;

    try {
      const response = await axios.get(url, {
        timeout: 5000, // 5 second timeout
      });

      if (response.data && response.data.country) {
        const locationData = {
          country: response.data.country || 'Unknown',
          city: response.data.city || 'Unknown',
          region: response.data.region || 'Unknown',
          timezone: response.data.timezone || 'Unknown',
          ipAddress: ipAddress,
        };
        return locationData;
      }

      return {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        timezone: 'Unknown',
        ipAddress: ipAddress,
      };
    } catch (ipinfoError) {
      // Fallback to ip-api.com (free tier: 45 requests/minute)
      try {
        const fallbackUrl = `http://ip-api.com/json/${ipAddress}?fields=status,country,regionName,city,timezone,query`;
        const fallbackResponse = await axios.get(fallbackUrl, {
          timeout: 5000,
        });

        if (fallbackResponse.data && fallbackResponse.data.status === 'success') {
          const locationData = {
            country: fallbackResponse.data.country || 'Unknown',
            city: fallbackResponse.data.city || 'Unknown',
            region: fallbackResponse.data.regionName || 'Unknown',
            timezone: fallbackResponse.data.timezone || 'Unknown',
            ipAddress: ipAddress,
          };
          return locationData;
        }
      } catch (fallbackError) {
      }

      // Return default values on error
      return {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        timezone: 'Unknown',
        ipAddress: ipAddress,
      };
    }
  } catch (error) {
    // Return default values on error
    return {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
      timezone: 'Unknown',
      ipAddress: ipAddress,
    };
  }
};

/**
 * Get IP and location from request
 * Main function to use in routes
 */
const getIpAndLocation = async (req) => {
  const ipAddress = getClientIp(req);
  
  const location = await getLocationFromIp(ipAddress);
  
  return {
    ipAddress,
    location: {
      ...location,
      ipAddress, // Ensure IP is in location object too
    },
  };
};

module.exports = {
  getClientIp,
  getLocationFromIp,
  getIpAndLocation,
};

