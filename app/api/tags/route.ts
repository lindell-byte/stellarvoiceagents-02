import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export const dynamic = 'force-dynamic'

/** GET /api/tags - fetch all tags. */
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('tags')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('[api/tags]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tags: data ?? [] })
  } catch (err) {
    console.error('[api/tags]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

/** POST /api/tags - create a tag. Body: { name: string }. */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('tags')
      .insert({ name })
      .select('id, name')
      .single()

    if (error) {
      if (error.code === '23505') {
        // unique violation - tag exists, fetch and return it
        const { data: existing } = await supabase
          .from('tags')
          .select('id, name')
          .eq('name', name)
          .single()
        return NextResponse.json({ tag: existing })
      }
      console.error('[api/tags]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tag: data })
  } catch (err) {
    console.error('[api/tags]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create tag' },
      { status: 500 }
    )
  }
}

/** DELETE /api/tags?id=<uuid> - delete a tag (cascades lead_tags). */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const name = searchParams.get('name')
    if (!id && !name) {
      return NextResponse.json(
        { error: 'id or name is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const q = supabase.from('tags').delete()
    const { error } = id ? await q.eq('id', id) : await q.eq('name', name!)
    if (error) {
      console.error('[api/tags]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/tags]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete tag' },
      { status: 500 }
    )
  }
}
