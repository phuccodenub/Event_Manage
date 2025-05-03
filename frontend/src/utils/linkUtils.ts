export const formatDescriptionWithLinks = (text: string) => {
  // Regex để tìm URLs và bit.ly links
  const urlRegex = /(https?:\/\/[^\s]+|bit\.ly\/[a-zA-Z0-9_-]+)/gi;
  
  // Tìm tất cả matches và loại bỏ trùng lặp
  const matches = Array.from(new Set(text.match(urlRegex) || []));
  
  // Thay thế từng URL trong text, chỉ thay thế lần xuất hiện đầu tiên
  let result = text;
  matches.forEach(url => {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    // Chỉ thay thế lần xuất hiện đầu tiên của mỗi URL
    result = result.replace(url, `[${url}](${formattedUrl})`);
  });
  
  // Tách và xử lý các phần
  const parts = result.split(/(\[[^\]]+\]\([^)]+\))/g);
  
  return parts.map(part => {
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      return {
        type: 'link',
        text: linkMatch[1],
        url: linkMatch[2]
      };
    }
    return part;
  });
};
