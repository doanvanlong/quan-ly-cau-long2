/**
 * Robustly parses a YouTube web link / short link / embed link / shorts link
 * and extracts the 11-character Video ID, returning a secure embed URL.
 * 
 * @param url Any YouTube URL or bare video ID
 * @returns Correctly formatted YouTube embed URL, or the trimmed original if not a match
 */
export function getYouTubeEmbedUrl(url: string | undefined | null): string {
  if (!url) return '';
  let cleanUrl = url.trim();

  // If they copy-pasted the whole iframe element, extract the src attribute
  if (cleanUrl.includes('<iframe') && cleanUrl.includes('src=')) {
    const match = cleanUrl.match(/src=["']([^"']+)["']/);
    if (match && match[1]) {
      cleanUrl = match[1];
    }
  }

  // Regex for extracting 11-character video ID from common YouTube URL patterns:
  // - youtube.com/watch?v=VIDEO_ID
  // - youtu.be/VIDEO_ID
  // - youtube.com/embed/VIDEO_ID
  // - youtube.com/shorts/VIDEO_ID
  // - youtube.com/v/VIDEO_ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = cleanUrl.match(regExp);

  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }

  // Fallback: If it's already a bare 11-character ID
  const bareIdRegex = /^[a-zA-Z0-9_-]{11}$/;
  if (bareIdRegex.test(cleanUrl)) {
    return `https://www.youtube.com/embed/${cleanUrl}`;
  }

  return cleanUrl;
}
