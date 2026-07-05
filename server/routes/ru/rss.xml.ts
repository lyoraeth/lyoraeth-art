import { renderFeed } from '../rss.xml'

export default defineEventHandler(event => renderFeed(event, 'ru'))
