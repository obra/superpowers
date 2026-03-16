# Active Storage Patterns

> Lessons from 37signals' Fizzy codebase.

---

## Variant Preprocessing ([#767](https://github.com/basecamp/fizzy/pull/767))

Use `preprocessed: true` to prevent on-the-fly transformations failing on read replicas:

```ruby
has_many_attached :embeds do |attachable|
  attachable.variant :small,
    resize_to_limit: [800, 600],
    preprocessed: true
end
```

Centralize variant definitions in a module.

## Direct Upload Expiry ([#773](https://github.com/basecamp/fizzy/pull/773))

**Problem**: When using Cloudflare (or similar CDN/proxy), large file uploads can fail with signature expiration errors. Cloudflare buffers the entire request before forwarding it to your origin server. For large files on slow connections, this buffering can take longer than Rails' default signed URL expiry (5 minutes), causing the upload to fail even though the user is still actively uploading.

**Solution**: Extend the direct upload URL expiry to accommodate slow uploads:

```ruby
# config/initializers/active_storage.rb
module ActiveStorage
  mattr_accessor :service_urls_for_direct_uploads_expire_in,
    default: 48.hours
end

# Prepend to ActiveStorage::Blob
def service_url_for_direct_upload(expires_in: ActiveStorage.service_urls_for_direct_uploads_expire_in)
  super
end
```

**Why 48 hours?** This provides ample time for even the slowest uploads while still expiring unused URLs. The signed URL is single-use anyway, so the security impact is minimal.

## Large File Preview Limits ([#941](https://github.com/basecamp/fizzy/pull/941))

Skip previews above size threshold:

```ruby
module ActiveStorageBlobPreviewable
  MAX_PREVIEWABLE_SIZE = 16.megabytes

  def previewable?
    super && byte_size <= MAX_PREVIEWABLE_SIZE
  end
end
```

## Preview vs Variant ([#770](https://github.com/basecamp/fizzy/pull/770))

- **Variable** (images): `blob.variant(options)`
- **Previewable** (PDFs, videos): `blob.preview(options)`

Don't conflate them - different operations.

## Avatar Optimization ([#1689](https://github.com/basecamp/fizzy/pull/1689))

**Problem**: Streaming avatar images through your Rails app ties up web workers and adds latency. Every avatar request occupies a Puma thread while bytes flow through.

**Solution**: Redirect to the blob URL and let your storage service (S3, GCS, etc.) serve the file directly:

```ruby
def show
  if @user.avatar.attached?
    redirect_to rails_blob_url(@user.avatar.variant(:thumb))
  else
    render_initials if stale?(@user)
  end
end
```

**Key details**:
- Use a preprocessed `:thumb` variant to avoid on-the-fly transformations
- Only apply `stale?` to the initials fallback, not the redirect—otherwise browsers will show broken images after an avatar change until the cache expires
- The redirect is fast (just sends a 302), offloading the heavy lifting to your CDN/storage service

## Mirror Configuration ([#557](https://github.com/basecamp/fizzy/pull/557))

**Pattern**: Use Active Storage's mirror service to write to multiple backends simultaneously while reading from a fast local primary.

**Use cases**:
- Local NVMe/SSD primary for speed, cloud backup for durability
- Gradual migration between storage providers
- Disaster recovery without impacting read performance

```yaml
# config/storage.yml
mirror:
  service: Mirror
  primary: local
  mirrors: [s3_backup]

local:
  service: Disk
  root: <%= Rails.root.join("storage") %>

s3_backup:
  service: S3
  bucket: myapp-backups
  force_path_style: true                        # Required for MinIO, Pure Storage, etc.
  request_checksum_calculation: when_required   # For non-AWS S3-compatible services
```

**How it works**: Uploads write to both primary and mirrors. Downloads always read from primary only. This gives you local-speed reads with cloud redundancy.
