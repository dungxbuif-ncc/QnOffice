/**
 * Utility function to join URL path segments without causing duplicate slashes
 *
 * @param {string[]} segments - URL path segments to join
 * @returns {string} - Properly joined URL path
 */
const joinUrlPaths = (...segments: string[]): string => {
  // Filter out empty segments
  const filteredSegments = segments.filter(Boolean);

  if (filteredSegments.length === 0) {
    return '';
  }

  // Handle the protocol specially (if present)
  let result = '';
  let firstSegment = filteredSegments[0];
  const remainingSegments = filteredSegments.slice(1);

  // Check for protocol (e.g., http://, https://)
  const protocolMatch = firstSegment.match(/^(https?:\/\/)/);
  if (protocolMatch) {
    const protocol = protocolMatch[1];
    const restOfFirst = firstSegment.slice(protocol.length);

    result = protocol;
    if (restOfFirst) {
      firstSegment = restOfFirst;
    } else {
      // If the first segment is just the protocol, move to the next segment
      firstSegment = remainingSegments.shift() || '';
    }
  }

  // Process the first segment (which might have been modified above)
  result += firstSegment.replace(/\/+$/, ''); // Remove trailing slashes

  // Process remaining segments
  for (const segment of remainingSegments) {
    const normalizedSegment = segment
      .replace(/^\/+/, '') // Remove leading slashes
      .replace(/\/+$/, ''); // Remove trailing slashes

    if (normalizedSegment) {
      result += '/' + normalizedSegment;
    }
  }

  // Clean up any remaining consecutive slashes in the final result
  // But preserve the protocol double slash
  return result
    .replace(/:\/\//, '___PROTOCOL___')
    .replace(/\/+/g, '/')
    .replace(/___PROTOCOL___/, '://');
};

export { joinUrlPaths };
export default joinUrlPaths;
