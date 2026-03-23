import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export const dynamic = 'force-dynamic'

/** GET /api/lead-tags - fetch all lead-tag assignments. Returns { leadTags: { lead_id: string, tag_id: string, tag_name: string }[] }. */
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data: ltData, error } = await supabase
      .from('lead_tags')
      .select('lead_id, tag_id')

    if (error) {
      console.error('[api/lead-tags]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (ltData ?? []) as { lead_id: string; tag_id: string }[]
    if (rows.length === 0) {
      return NextResponse.json({ leadTags: [] })
    }

    const tagIds = [...new Set(rows.map((r) => r.tag_id))]
    const { data: tagsData } = await supabase.from('tags').select('id, name').in('id', tagIds)
    const tagMap = new Map((tagsData ?? []).map((t: { id: string; name: string }) => [t.id, t.name]))

    const leadTags = rows.map((row) => ({
      lead_id: row.lead_id,
      tag_id: row.tag_id,
      tag_name: tagMap.get(row.tag_id) ?? '',
    }))

    return NextResponse.json({ leadTags })
  } catch (err) {
    console.error('[api/lead-tags]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch lead tags' },
      { status: 500 }
    )
  }
}

/** POST /api/lead-tags - add a tag to a lead. Body: { lead_id: string, tag_name: string } or { lead_id: string, tag_id: string }. */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const leadId = body?.lead_id
    const tagName = typeof body?.tag_name === 'string' ? body.tag_name.trim() : null
    const tagId = body?.tag_id

    if (!leadId || (!tagId && !tagName)) {
      return NextResponse.json(
        { error: 'lead_id and (tag_id or tag_name) required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    let resolvedTagId = tagId
    if (!resolvedTagId && tagName) {
      // Fetch or create tag by name
      let { data: tag } = await supabase.from('tags').select('id').eq('name', tagName).single()
      if (!tag) {
        const { data: created, error: createErr } = await supabase
          .from('tags')
          .insert({ name: tagName })
          .select('id')
          .single()
        if (createErr) {
          if (createErr.code === '23505') {
            const { data: existing } = await supabase.from('tags').select('id').eq('name', tagName).single()
            tag = existing
          } else {
            console.error('[api/lead-tags] create tag', createErr)
            return NextResponse.json({ error: createErr.message }, { status: 500 })
          }
        } else {
          tag = created
        }
      }
      resolvedTagId = tag?.id
    }

    if (!resolvedTagId) {
      return NextResponse.json({ error: 'Could not resolve tag' }, { status: 400 })
    }

    const { error } = await supabase.from('lead_tags').insert({ lead_id: leadId, tag_id: resolvedTagId })

    if (error) {
      if (error.code === '23505') return NextResponse.json({ ok: true }) // already linked
      console.error('[api/lead-tags]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/lead-tags]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add tag' },
      { status: 500 }
    )
  }
}

/** DELETE /api/lead-tags - remove a tag from a lead. Query: ?lead_id=...&tag_id=... */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const tagId = searchParams.get('tag_id')

    if (!leadId || !tagId) {
      return NextResponse.json(
        { error: 'lead_id and tag_id required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from('lead_tags')
      .delete()
      .eq('lead_id', leadId)
      .eq('tag_id', tagId)

    if (error) {
      console.error('[api/lead-tags]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/lead-tags]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to remove tag' },
      { status: 500 }
    )
  }
}
