import * as cheerio from 'cheerio';

const BLOCKLIST_ELEMENTS = [
  'style',
  'button',
  'script',
  'noscript',
  'iframe',
  'link',
  'img',
  'video',
  'svg',
  'form',
  'footer',
  'hr',
  'br',
];

interface Payload {
  url?: string;
}

export const handler = async ({ url }: Payload) => {
  if (!url) throw new Error('Can not fetch undefined url');

  const result = await fetch(url);
  if (!result.ok) throw new Error(`Failed to fetch ${url}`);

  const pageHTML = await result.text();

  const $ = cheerio.load(pageHTML);

  // Remove elements we don't care about
  BLOCKLIST_ELEMENTS.forEach((element) => $(element).remove());

  // Remove empty elements
  $('body *')
    .filter(function () {
      const text: string = $(this).text().trim(); // Get the trimmed text content
      const children = $(this).children().length; // Get the number of child nodes
      // If the element has no text content and no child nodes, remove it
      return text === '' && children === 0;
    })
    .remove();

  // Remove all comments
  $.root()
    .find('*')
    .contents()
    .filter(function () {
      return this.type === 'comment';
    })
    .remove();

  // Remove all attributes from all elements inside <body>
  $('body *').each(function () {
    this.attribs = {};
  });

  // Get the body HTML string and remove excessive whitespace and superfluous wrapping elements
  const output = $('body')
    .html()
    ?.trim()
    .replace(/&nbsp;/g, ' ')
    .replace(/\t+/g, '\t')
    .replace(/\s+/g, ' ')
    .replace(/<\/?span>/g, '');

  return { output };
};
