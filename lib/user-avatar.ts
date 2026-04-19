type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null
}

function readString(record: UnknownRecord | null, key: string): string | undefined {
  const value = record?.[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function getUserAvatarUrl(user: unknown): string | undefined {
  const root = asRecord(user)
  const metadata = asRecord(root?.user_metadata)
  const appMetadata = asRecord(root?.app_metadata)

  const directCandidates = [
    readString(root, 'avatar_url'),
    readString(root, 'picture'),
    readString(metadata, 'avatar_url'),
    readString(metadata, 'picture'),
    readString(metadata, 'photo_url'),
    readString(metadata, 'photoURL'),
    readString(appMetadata, 'avatar_url'),
    readString(appMetadata, 'picture'),
  ]

  for (const candidate of directCandidates) {
    if (candidate) return candidate
  }

  const identities = Array.isArray(root?.identities) ? root.identities : []
  for (const identity of identities) {
    const identityRecord = asRecord(identity)
    const identityData = asRecord(identityRecord?.identity_data)
    const candidate =
      readString(identityData, 'avatar_url') ??
      readString(identityData, 'picture') ??
      readString(identityData, 'photo_url') ??
      readString(identityData, 'photoURL')

    if (candidate) return candidate
  }

  return undefined
}

export function getUserDisplayName(user: unknown): string | undefined {
  const root = asRecord(user)
  const metadata = asRecord(root?.user_metadata)
  const appMetadata = asRecord(root?.app_metadata)

  return (
    readString(root, 'full_name') ??
    readString(root, 'name') ??
    readString(metadata, 'full_name') ??
    readString(metadata, 'name') ??
    readString(metadata, 'user_name') ??
    readString(metadata, 'preferred_username') ??
    readString(appMetadata, 'full_name') ??
    readString(appMetadata, 'name')
  )
}
