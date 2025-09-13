import { decodeBase64Content, encodeBase64Content, parseNoteContent, filterNotesByTags, getAllTags } from '@/lib/note-utils'

describe('note-utils', () => {
  test('base64 encode/decode', () => {
    const s = 'Hello，世界'
    const e = encodeBase64Content(s)
    const d = decodeBase64Content(e)
    expect(d).toBe(s)
  })
  test('parse frontmatter', () => {
    const c = `---\ncreated_at: "2024-01-01"\nupdated_at: "2024-01-02"\nprivate: true\ntags: [标签1, 标签2]\n---\n正文...`
    const r = parseNoteContent(c, 't.md')
    expect(r.createdDate).toBe('2024-01-01')
    expect(r.isPrivate).toBe(true)
    expect(r.tags).toEqual(['标签1', '标签2'])
  })
  test('tags', () => {
    const notes = [
      { name:'a.md', path:'', sha:'1', type:'file', tags:['A','B'] },
      { name:'b.md', path:'', sha:'2', type:'file', tags:['B','C'] },
    ] as any
    expect(getAllTags(notes)).toEqual(['A','B','C'])
    expect(filterNotesByTags(notes, ['B']).length).toBe(2)
    expect(filterNotesByTags(notes, ['A','C']).length).toBe(0)
  })
})

