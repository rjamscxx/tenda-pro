import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'receipts'
const MAX_BYTES = 5 * 1024 * 1024 // 5MB after compression
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
}

// Cached across warm invocations on the same server instance to avoid a
// listBuckets()+createBucket() round-trip on every upload.
let bucketEnsured = false

async function ensureBucket(supabase: ReturnType<typeof createAdminClient>) {
  if (bucketEnsured) return
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find(b => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES })
  }
  bucketEnsured = true
}

export async function POST(req: NextRequest) {
  // Auth: signed-in users only. Prevents anonymous storage-cost DoS.
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large' }, { status: 400 })

  const ext = EXT_BY_MIME[file.type]
  if (!ext) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })

  const supabase = createAdminClient()
  await ensureBucket(supabase)

  const filename = `${user.id}/${Date.now()}-${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
    contentType: file.type,
    upsert: false,
  })
  if (error) {
    console.error('[upload-receipt]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return NextResponse.json({ url: publicUrl })
}
